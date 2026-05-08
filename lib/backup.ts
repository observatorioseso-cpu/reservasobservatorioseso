/**
 * lib/backup.ts — Sistema de backup y recuperación ante desastres
 *
 * Estrategia de almacenamiento (por prioridad):
 * 1. Vercel Blob (BLOB_READ_WRITE_TOKEN configurado) — almacenamiento externo
 * 2. JSONB en BackupJob.datosJson — fallback en la propia BD
 *
 * Retención: máximo 30 backups. El job de limpieza elimina los más antiguos.
 */

import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { resend, EMAIL_FROM } from "@/lib/email"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackupStats {
  turnos: number
  reservas: number
  acompanantes: number
  configSistema: number
  bloqueosCalendario: number
  mensajesContacto: number
  logsAgente: number
  admins: number
}

export interface BackupData {
  version: "2.0"
  timestamp: string
  checksum: string
  stats: BackupStats
  data: {
    turnos: unknown[]
    reservas: unknown[]
    acompanantes: unknown[]
    configSistema: unknown[]
    bloqueosCalendario: unknown[]
    mensajesContacto: unknown[]
    logsAgente: unknown[]       // últimos 365 días
    admins: unknown[]           // incluye passwordHash para full restore
  }
}

// ---------------------------------------------------------------------------
// Generar backup
// ---------------------------------------------------------------------------

export async function generarBackupData(): Promise<BackupData> {
  const hace365dias = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const [
    turnos,
    reservas,
    acompanantes,
    configSistema,
    bloqueosCalendario,
    mensajesContacto,
    logsAgente,
    admins,
  ] = await Promise.all([
    prisma.turno.findMany({ orderBy: { fecha: "asc" } }),
    prisma.reserva.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.acompanante.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.configSistema.findMany({ orderBy: { clave: "asc" } }),
    prisma.bloqueoCalendario.findMany({ orderBy: { fechaInicio: "asc" } }),
    prisma.mensajeContacto.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    prisma.logAgente.findMany({
      where: { createdAt: { gte: hace365dias } },
      orderBy: { createdAt: "desc" },
      take: 10000,
    }),
    prisma.admin.findMany({ orderBy: { createdAt: "asc" } }),
  ])

  const timestamp = new Date().toISOString()

  const stats: BackupStats = {
    turnos: turnos.length,
    reservas: reservas.length,
    acompanantes: acompanantes.length,
    configSistema: configSistema.length,
    bloqueosCalendario: bloqueosCalendario.length,
    mensajesContacto: mensajesContacto.length,
    logsAgente: logsAgente.length,
    admins: admins.length,
  }

  const dataPayload = {
    turnos,
    reservas,
    acompanantes,
    configSistema,
    bloqueosCalendario,
    mensajesContacto,
    logsAgente,
    admins,
  }

  // SHA-256 del payload para verificación de integridad
  const checksum = createHash("sha256")
    .update(JSON.stringify(dataPayload))
    .digest("hex")

  return {
    version: "2.0",
    timestamp,
    checksum,
    stats,
    data: dataPayload,
  }
}

// ---------------------------------------------------------------------------
// Subir a Vercel Blob
// ---------------------------------------------------------------------------

async function subirABlob(
  jobId: string,
  backup: BackupData
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null

  try {
    // Importar dinámicamente para no romper el build si el paquete no existe
    const { put } = await import("@vercel/blob")
    const json = JSON.stringify(backup)
    const fecha = backup.timestamp.split("T")[0]
    const filename = `backups/eso-backup-${fecha}-${jobId}.json`

    const blob = await put(filename, json, {
      access: "public",
      contentType: "application/json",
      token,
    })

    return blob.url
  } catch (err) {
    console.error("[backup/blob] error al subir:", err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Eliminar de Vercel Blob
// ---------------------------------------------------------------------------

export async function eliminarDeBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token || !url) return
  try {
    const { del } = await import("@vercel/blob")
    await del(url, { token })
  } catch (err) {
    console.error("[backup/blob] error al eliminar:", err)
  }
}

// ---------------------------------------------------------------------------
// Ejecutar backup completo (generar + guardar)
// ---------------------------------------------------------------------------

export async function ejecutarBackup(triggeredBy = "cron"): Promise<{
  jobId: string
  stats: BackupStats
  blobUrl: string | null
  sizeBytes: number
}> {
  // Crear registro de job en progreso
  const job = await prisma.backupJob.create({
    data: { status: "EN_PROGRESO", triggeredBy },
  })

  try {
    const backup = await generarBackupData()
    const json = JSON.stringify(backup)
    const sizeBytes = Buffer.byteLength(json, "utf8")
    const blobUrl = await subirABlob(job.id, backup)

    // Retención: si no hay Blob, guardar JSON en BD; si hay, solo guardar URL
    const datosJson = blobUrl ? undefined : (backup as unknown)

    await prisma.backupJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETADO",
        blobUrl,
        sizeBytes,
        checksum: backup.checksum,
        stats: backup.stats as object,
        datosJson: datosJson as object,
        completedAt: new Date(),
      },
    })

    // Limpieza de backups antiguos (mantener últimos 30)
    await limpiarBackupsAntiguos()

    return { jobId: job.id, stats: backup.stats, blobUrl, sizeBytes }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    await prisma.backupJob.update({
      where: { id: job.id },
      data: { status: "ERROR", error: mensaje, completedAt: new Date() },
    })
    throw err
  }
}

// ---------------------------------------------------------------------------
// Limpieza de backups antiguos (retención: 30)
// ---------------------------------------------------------------------------

async function limpiarBackupsAntiguos(): Promise<void> {
  const todos = await prisma.backupJob.findMany({
    where: { status: "COMPLETADO" },
    orderBy: { createdAt: "desc" },
    select: { id: true, blobUrl: true },
  })

  if (todos.length <= 30) return

  const aEliminar = todos.slice(30)
  for (const j of aEliminar) {
    if (j.blobUrl) await eliminarDeBlob(j.blobUrl)
    await prisma.backupJob.delete({ where: { id: j.id } })
  }
}

// ---------------------------------------------------------------------------
// Obtener datos de un backup por ID
// ---------------------------------------------------------------------------

export async function obtenerDatosBackup(
  jobId: string
): Promise<BackupData | null> {
  const job = await prisma.backupJob.findUnique({ where: { id: jobId } })
  if (!job || job.status !== "COMPLETADO") return null

  // Intentar desde Blob primero
  if (job.blobUrl) {
    try {
      const res = await fetch(job.blobUrl)
      if (res.ok) return (await res.json()) as BackupData
    } catch {
      // fallthrough to datosJson
    }
  }

  // Fallback: datos en BD
  if (job.datosJson) return job.datosJson as unknown as BackupData

  return null
}

// ---------------------------------------------------------------------------
// Restaurar desde un BackupData (estrategia: upsert — no borra datos nuevos)
// ---------------------------------------------------------------------------

export async function restaurarDesdeBackup(
  backup: BackupData
): Promise<{ restaurados: BackupStats; errores: string[] }> {
  const errores: string[] = []
  const restaurados: BackupStats = {
    turnos: 0, reservas: 0, acompanantes: 0, configSistema: 0,
    bloqueosCalendario: 0, mensajesContacto: 0, logsAgente: 0, admins: 0,
  }

  // ConfigSistema
  for (const item of backup.data.configSistema as Array<{ clave: string; valor: string; descripcion?: string | null }>) {
    try {
      await prisma.configSistema.upsert({
        where: { clave: item.clave },
        update: { valor: item.valor },
        create: { clave: item.clave, valor: item.valor, descripcion: item.descripcion ?? null },
      })
      restaurados.configSistema++
    } catch (e) { errores.push(`configSistema ${item.clave}: ${e}`) }
  }

  // Turnos
  for (const t of backup.data.turnos as Array<Record<string, unknown>>) {
    try {
      await prisma.turno.upsert({
        where: { id: t.id as string },
        update: { activo: t.activo as boolean, capacidadMax: t.capacidadMax as number },
        create: {
          id: t.id as string,
          observatorio: t.observatorio as "LA_SILLA" | "PARANAL",
          fecha: new Date(t.fecha as string),
          horaInicio: t.horaInicio as string,
          horaFin: t.horaFin as string,
          capacidadMax: t.capacidadMax as number,
          cuposOcupados: t.cuposOcupados as number,
          activo: t.activo as boolean,
        },
      })
      restaurados.turnos++
    } catch (e) { errores.push(`turno ${t.id}: ${e}`) }
  }

  // Reservas
  for (const r of backup.data.reservas as Array<Record<string, unknown>>) {
    try {
      await prisma.reserva.upsert({
        where: { id: r.id as string },
        update: { estado: r.estado as "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA" },
        create: {
          id: r.id as string,
          token: r.token as string,
          shortId: r.shortId as string,
          observatorio: r.observatorio as "LA_SILLA" | "PARANAL",
          turnoId: r.turnoId as string,
          estado: r.estado as "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA",
          fechaLimiteConfirmacion: new Date(r.fechaLimiteConfirmacion as string),
          confirmadaEn: r.confirmadaEn ? new Date(r.confirmadaEn as string) : null,
          nombre: r.nombre as string,
          apellido: r.apellido as string,
          rutOPasaporte: r.rutOPasaporte as string,
          email: r.email as string,
          telefono: r.telefono as string,
          idioma: r.idioma as "ES" | "EN",
          cantidadPersonas: r.cantidadPersonas as number,
          tienesMenores: r.tienesMenores as boolean,
          recibirWhatsapp: r.recibirWhatsapp as boolean,
          whatsappOptIn: r.whatsappOptIn as boolean,
          passwordHash: r.passwordHash as string,
          locale: r.locale as string,
          pdfUrl: r.pdfUrl as string | null ?? null,
          notaAdmin: r.notaAdmin as string | null ?? null,
        },
      })
      restaurados.reservas++
    } catch (e) { errores.push(`reserva ${r.id}: ${e}`) }
  }

  // Acompanantes
  for (const a of backup.data.acompanantes as Array<Record<string, unknown>>) {
    try {
      await prisma.acompanante.upsert({
        where: { id: a.id as string },
        update: {},
        create: {
          id: a.id as string,
          reservaId: a.reservaId as string,
          nombre: a.nombre as string,
          apellido: a.apellido as string,
          documento: a.documento as string | null ?? null,
        },
      })
      restaurados.acompanantes++
    } catch (e) { errores.push(`acompanante ${a.id}: ${e}`) }
  }

  // BloqueoCalendario
  for (const b of backup.data.bloqueosCalendario as Array<Record<string, unknown>>) {
    try {
      await prisma.bloqueoCalendario.upsert({
        where: { id: b.id as string },
        update: {},
        create: {
          id: b.id as string,
          observatorio: b.observatorio as string | null ?? null,
          fechaInicio: new Date(b.fechaInicio as string),
          fechaFin: new Date(b.fechaFin as string),
          motivo: b.motivo as string,
          creadoPor: b.creadoPor as string | null ?? null,
        },
      })
      restaurados.bloqueosCalendario++
    } catch (e) { errores.push(`bloqueo ${b.id}: ${e}`) }
  }

  return { restaurados, errores }
}

// ---------------------------------------------------------------------------
// Enviar email con resumen del backup al admin principal
// ---------------------------------------------------------------------------

export async function enviarEmailResumenBackup(params: {
  jobId: string
  stats: BackupStats
  blobUrl: string | null
  sizeBytes: number
  error?: string
}): Promise<void> {
  const emailAdmin = process.env.BACKUP_REPORT_EMAIL ?? "reservas@observatorioseso.cl"

  const kb = (params.sizeBytes / 1024).toFixed(1)
  const fecha = new Date().toLocaleDateString("es-CL", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    timeZone: "America/Santiago",
  })
  const hora = new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Santiago",
  })

  const subject = params.error
    ? `ERROR en backup ESO · ${new Date().toISOString().split("T")[0]}`
    : `Backup ESO completado · ${new Date().toISOString().split("T")[0]}`

  const html = params.error
    ? `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0a09;color:#f5f5f4;padding:32px">
        <h2 style="color:#f87171">Error en backup diario</h2>
        <p><strong>Fecha:</strong> ${fecha} ${hora} Santiago</p>
        <p><strong>Error:</strong> ${params.error}</p>
        <p style="color:#a8a29e;font-size:13px">Revisa el panel de admin en /admin/backup para mas detalles.</p>
      </body></html>`
    : `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0a09;color:#f5f5f4;padding:32px">
        <h2 style="color:#f59e0b">Backup diario completado</h2>
        <p><strong>Fecha:</strong> ${fecha} ${hora} Santiago</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px;color:#a8a29e">Reservas</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${params.stats.reservas}</td></tr>
          <tr><td style="padding:8px;color:#a8a29e">Turnos</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${params.stats.turnos}</td></tr>
          <tr><td style="padding:8px;color:#a8a29e">Acompanantes</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${params.stats.acompanantes}</td></tr>
          <tr><td style="padding:8px;color:#a8a29e">Logs (365d)</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${params.stats.logsAgente}</td></tr>
          <tr><td style="padding:8px;color:#a8a29e">Tamano</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${kb} KB</td></tr>
          <tr><td style="padding:8px;color:#a8a29e">Almacenamiento</td><td style="padding:8px;color:#f5f5f4;font-weight:bold">${params.blobUrl ? "Vercel Blob" : "Base de datos (fallback)"}</td></tr>
        </table>
        <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"}/admin/backup" style="background:#f59e0b;color:#0c0a09;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Ver en panel admin</a></p>
        <p style="color:#78716c;font-size:12px;margin-top:24px">ID del job: ${params.jobId}</p>
      </body></html>`

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: emailAdmin,
      subject,
      html,
    })
  } catch (err) {
    console.error("[backup/email] error al enviar resumen:", err)
  }
}
