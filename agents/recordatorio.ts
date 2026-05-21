/**
 * Agente 3: Recordatorios y auto-anulación (determinista, sin LLM)
 *
 * Activación: Vercel Cron 2× al día via GET /api/agentes/recordatorio
 *
 * Responsabilidades:
 * 0. generarTurnosFaltantes — crea turnos de sábados futuros que aún no existan
 *    en la BD, usando la ventana VENTANA_RESERVA_DIAS de ConfigSistema.
 * 1. ejecutarAutoAnulaciones — anula reservas PENDIENTE_CONFIRMACION vencidas,
 *    decrementa cuposOcupados del turno y registra log AUTOANULACION.
 * 2. ejecutarRecordatorios — envía email de recordatorio a titulares con
 *    visita en los próximos 3 días que aún no confirmaron, evitando duplicados.
 */

export { generarTurnosFaltantes } from "@/lib/generadorTurnos"

import { prisma } from "@/lib/prisma"
import { resend, EMAIL_FROM } from "@/lib/email"
import { formatearFechaLimite, formatearHoraLimite } from "@/lib/confirmacion"
import {
  emailRecordatorioHTML,
  emailRecordatorio24hHTML,
  emailRecordatorioJuevesHTML,
  emailRecordatorioViernesHTML,
} from "@/components/email/templates"
import { enviarEmailAnulacion, notificarStaffAnulacion } from "@/agents/comunicaciones"
import { generarUrlAccion } from "@/lib/accionToken"
import type { Prisma } from "@prisma/client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

// ---------------------------------------------------------------------------
// Auto-anulación
// ---------------------------------------------------------------------------

export async function ejecutarAutoAnulaciones(): Promise<{ anuladas: number; ids: string[] }> {
  const ahora = new Date()

  // Buscar hasta 100 reservas vencidas por ejecución (seguridad anti-runaway)
  const reservasVencidas = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE_CONFIRMACION",
      fechaLimiteConfirmacion: { lt: ahora },
    },
    select: {
      id: true,
      shortId: true,
      token: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      locale: true,
      cantidadPersonas: true,
      turnoId: true,
      fechaLimiteConfirmacion: true,
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
        },
      },
    },
    take: 100,
  })

  if (reservasVencidas.length === 0) {
    return { anuladas: 0, ids: [] }
  }

  const ids: string[] = []

  for (const reserva of reservasVencidas) {
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.reserva.update({
          where: { id: reserva.id },
          data: {
            estado: "ANULADA",
            confirmadaEn: null,
          },
        })

        await tx.turno.update({
          where: { id: reserva.turnoId },
          data: {
            cuposOcupados: { decrement: reserva.cantidadPersonas },
          },
        })

        await tx.logAgente.create({
          data: {
            tipo: "AUTOANULACION",
            reservaId: reserva.id,
            resultado: "Auto-anulada por vencimiento de plazo",
            metadata: {
              fechaLimiteConfirmacion: reserva.fechaLimiteConfirmacion.toISOString(),
              cantidadPersonasLiberadas: reserva.cantidadPersonas,
            },
          },
        })
      })

      ids.push(reserva.shortId)

      // Notificar al titular + staff (fire-and-forget)
      const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]
      Promise.allSettled([
        enviarEmailAnulacion({
          reservaId: reserva.id,
          email: reserva.email,
          nombre: reserva.nombre,
          shortId: reserva.shortId,
          token: reserva.token,
          observatorio: reserva.turno.observatorio,
          fecha: fechaStr,
          horaInicio: reserva.turno.horaInicio,
          horaFin: reserva.turno.horaFin,
          locale: (reserva.locale as "es" | "en") ?? "es",
          motivo: "auto",
        }),
        notificarStaffAnulacion({
          reservaId: reserva.id,
          nombre: `${reserva.nombre} ${reserva.apellido}`,
          shortId: reserva.shortId,
          observatorio: reserva.turno.observatorio,
          fecha: fechaStr,
          horaInicio: reserva.turno.horaInicio,
          horaFin: reserva.turno.horaFin,
          cantidadPersonas: reserva.cantidadPersonas,
          telefono: reserva.telefono ?? null,
          email: reserva.email,
        }),
      ]).catch((e) => console.error(`[recordatorio/autoanulacion/notif] ${reserva.shortId}:`, e))
    } catch (err) {
      console.error(`[recordatorio/autoanulacion] error en reserva ${reserva.shortId}:`, err)

      // Log de error fuera de la transacción fallida
      await prisma.logAgente.create({
        data: {
          tipo: "ERROR",
          reservaId: reserva.id,
          resultado: "ERROR: fallo al auto-anular",
          metadata: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  return { anuladas: ids.length, ids }
}

// ---------------------------------------------------------------------------
// Recordatorios
// ---------------------------------------------------------------------------

export async function ejecutarRecordatorios(): Promise<{ enviados: number; ids: string[] }> {
  const ahora = new Date()
  const en3dias = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Inicio del día de hoy (UTC) para filtrar logs de recordatorio duplicados
  const inicioDiaHoy = new Date(ahora)
  inicioDiaHoy.setUTCHours(0, 0, 0, 0)

  // Reservas pendientes cuya visita cae dentro de los próximos 3 días
  const reservasPendientes = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE_CONFIRMACION",
      turno: {
        fecha: {
          gte: ahora,
          lte: en3dias,
        },
      },
      // Excluir reservas que ya recibieron recordatorio hoy
      logsAgente: {
        none: {
          tipo: "RECORDATORIO",
          createdAt: { gte: inicioDiaHoy },
        },
      },
    },
    select: {
      id: true,
      shortId: true,
      token: true,
      nombre: true,
      email: true,
      locale: true,
      fechaLimiteConfirmacion: true,
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
        },
      },
    },
    take: 100,
  })

  if (reservasPendientes.length === 0) {
    return { enviados: 0, ids: [] }
  }

  const ids: string[] = []

  for (const reserva of reservasPendientes) {
    try {
      const locale = (reserva.locale === "en" ? "en" : "es") as "es" | "en"
      const isES = locale === "es"

      const obsNombre =
        reserva.turno.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
      const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]
      const portalUrl = `${BASE_URL}/${locale}/mi-reserva/${reserva.token}`
      const fechaLimite = formatearFechaLimite(reserva.fechaLimiteConfirmacion, locale)

      const subject = isES
        ? `Confirma tu visita a ${obsNombre} — ${fechaStr}`
        : `Confirm your visit to ${obsNombre} — ${fechaStr}`

      const html = emailRecordatorioHTML({
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        observatorio: reserva.turno.observatorio,
        fecha: fechaStr,
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        fechaLimite,
        portalUrl,
        locale,
      })

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: reserva.email,
        subject,
        html,
      })

      await prisma.logAgente.create({
        data: {
          tipo: "RECORDATORIO",
          reservaId: reserva.id,
          resultado: `Recordatorio enviado: ${subject}`,
          metadata: {
            resendId: result.data?.id ?? null,
            fechaVisita: fechaStr,
            observatorio: reserva.turno.observatorio,
          },
        },
      })

      ids.push(reserva.shortId)
    } catch (err) {
      console.error(`[recordatorio] error para reserva ${reserva.shortId}:`, err)

      await prisma.logAgente.create({
        data: {
          tipo: "ERROR",
          reservaId: reserva.id,
          resultado: "ERROR: fallo al enviar recordatorio",
          metadata: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  return { enviados: ids.length, ids }
}

// ---------------------------------------------------------------------------
// Recordatorio 24h — dos botones (confirmar / anular)
// ---------------------------------------------------------------------------

export async function ejecutarRecordatorios24h(): Promise<{ enviados: number; ids: string[] }> {
  const ahora = new Date()

  // Ventana: visitas cuyo turno.fecha es mañana (día completo UTC).
  // Funciona correctamente con el cron a las 21:00 UTC (18:00 Chile aprox).
  const mañanaInicio = new Date(ahora)
  mañanaInicio.setUTCDate(ahora.getUTCDate() + 1)
  mañanaInicio.setUTCHours(0, 0, 0, 0)

  const mañanaFin = new Date(mañanaInicio)
  mañanaFin.setUTCHours(23, 59, 59, 999)

  // Deduplicación absoluta: si ya se envió RECORDATORIO_24H para esta reserva,
  // no volver a enviarlo aunque el cron corra varias veces.
  const reservasPendientes = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE_CONFIRMACION",
      turno: {
        fecha: { gte: mañanaInicio, lte: mañanaFin },
      },
      logsAgente: {
        none: { tipo: "RECORDATORIO_24H" },
      },
    },
    select: {
      id: true,
      shortId: true,
      token: true,
      nombre: true,
      email: true,
      locale: true,
      cantidadPersonas: true,
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
        },
      },
    },
    take: 100,
  })

  if (reservasPendientes.length === 0) {
    return { enviados: 0, ids: [] }
  }

  const ids: string[] = []

  for (const reserva of reservasPendientes) {
    try {
      const locale = (reserva.locale === "en" ? "en" : "es") as "es" | "en"
      const isES = locale === "es"
      const obsNombre = reserva.turno.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
      const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]

      const confirmarUrl = generarUrlAccion(BASE_URL, reserva.token, "confirmar", locale)
      const anularUrl    = generarUrlAccion(BASE_URL, reserva.token, "anular",    locale)

      const subject = isES
        ? `Tu visita a ${obsNombre} es mañana — ¿confirmas?`
        : `Your visit to ${obsNombre} is tomorrow — please confirm`

      const html = emailRecordatorio24hHTML({
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        observatorio: reserva.turno.observatorio,
        fecha: fechaStr,
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        cantidadPersonas: reserva.cantidadPersonas,
        confirmarUrl,
        anularUrl,
        locale,
      })

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: reserva.email,
        subject,
        html,
      })

      await prisma.logAgente.create({
        data: {
          tipo: "RECORDATORIO_24H",
          reservaId: reserva.id,
          resultado: `Recordatorio 24h enviado: ${subject}`,
          metadata: {
            resendId: result.data?.id ?? null,
            fechaVisita: fechaStr,
            observatorio: reserva.turno.observatorio,
          },
        },
      })

      ids.push(reserva.shortId)
    } catch (err) {
      console.error(`[recordatorio/24h] error para reserva ${reserva.shortId}:`, err)

      await prisma.logAgente.create({
        data: {
          tipo: "ERROR",
          reservaId: reserva.id,
          resultado: "ERROR: fallo al enviar recordatorio 24h",
          metadata: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  return { enviados: ids.length, ids }
}

// ---------------------------------------------------------------------------
// Recordatorio jueves — amigable, mañana es el plazo
// Cron: daily 21:00 UTC (18:00 Chile) — catches reservas whose deadline = tomorrow (viernes)
// ---------------------------------------------------------------------------

export async function ejecutarRecordatoriosJueves(): Promise<{ enviados: number; ids: string[] }> {
  const ahora = new Date()

  // Deadline = tomorrow in UTC (running Thursday 21:00 UTC hits Friday deadlines stored as 15:00 UTC)
  const mañanaInicio = new Date(ahora)
  mañanaInicio.setUTCDate(ahora.getUTCDate() + 1)
  mañanaInicio.setUTCHours(0, 0, 0, 0)

  const mañanaFin = new Date(mañanaInicio)
  mañanaFin.setUTCHours(23, 59, 59, 999)

  const reservasPendientes = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE_CONFIRMACION",
      fechaLimiteConfirmacion: { gte: mañanaInicio, lte: mañanaFin },
      logsAgente: {
        none: { tipo: "RECORDATORIO_JUEVES" },
      },
    },
    select: {
      id: true,
      shortId: true,
      token: true,
      nombre: true,
      email: true,
      locale: true,
      cantidadPersonas: true,
      fechaLimiteConfirmacion: true,
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
        },
      },
    },
    take: 100,
  })

  if (reservasPendientes.length === 0) {
    return { enviados: 0, ids: [] }
  }

  const ids: string[] = []

  for (const reserva of reservasPendientes) {
    try {
      const locale = (reserva.locale === "en" ? "en" : "es") as "es" | "en"
      const isES = locale === "es"
      const obsNombre = reserva.turno.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
      const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]
      const portalUrl = `${BASE_URL}/${locale}/mi-reserva/${reserva.token}`
      const fechaLimite = formatearFechaLimite(reserva.fechaLimiteConfirmacion, locale)

      const confirmarUrl = generarUrlAccion(BASE_URL, reserva.token, "confirmar", locale)
      const anularUrl    = generarUrlAccion(BASE_URL, reserva.token, "anular",    locale)

      const subject = isES
        ? `Confirma tu visita a ${obsNombre} antes del viernes a las 12:00`
        : `Confirm your visit to ${obsNombre} before Friday 12:00 PM`

      const html = emailRecordatorioJuevesHTML({
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        observatorio: reserva.turno.observatorio,
        fecha: fechaStr,
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        cantidadPersonas: reserva.cantidadPersonas,
        fechaLimite,
        confirmarUrl,
        anularUrl,
        portalUrl,
        locale,
      })

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: reserva.email,
        subject,
        html,
      })

      await prisma.logAgente.create({
        data: {
          tipo: "RECORDATORIO_JUEVES",
          reservaId: reserva.id,
          resultado: `Recordatorio jueves enviado: ${subject}`,
          metadata: {
            resendId: result.data?.id ?? null,
            fechaVisita: fechaStr,
            observatorio: reserva.turno.observatorio,
          },
        },
      })

      ids.push(reserva.shortId)
    } catch (err) {
      console.error(`[recordatorio/jueves] error para reserva ${reserva.shortId}:`, err)

      await prisma.logAgente.create({
        data: {
          tipo: "ERROR",
          reservaId: reserva.id,
          resultado: "ERROR: fallo al enviar recordatorio jueves",
          metadata: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  return { enviados: ids.length, ids }
}

// ---------------------------------------------------------------------------
// Recordatorio viernes — urgente, link de extensión (+2h)
// Cron: Friday 14:45 UTC (11:45 Chile) — runs 15 min before the 12:00 deadline
// ---------------------------------------------------------------------------

export async function ejecutarRecordatoriosViernes(): Promise<{ enviados: number; ids: string[] }> {
  const ahora = new Date()

  // Deadline = today, still in the future (cron runs Friday 14:45 UTC)
  const hoyFin = new Date(ahora)
  hoyFin.setUTCHours(23, 59, 59, 999)

  const reservasPendientes = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE_CONFIRMACION",
      fechaLimiteConfirmacion: { gte: ahora, lte: hoyFin },
      logsAgente: {
        none: { tipo: "RECORDATORIO_VIERNES" },
      },
    },
    select: {
      id: true,
      shortId: true,
      token: true,
      nombre: true,
      email: true,
      locale: true,
      cantidadPersonas: true,
      fechaLimiteConfirmacion: true,
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
        },
      },
    },
    take: 100,
  })

  if (reservasPendientes.length === 0) {
    return { enviados: 0, ids: [] }
  }

  const ids: string[] = []

  for (const reserva of reservasPendientes) {
    try {
      const locale = (reserva.locale === "en" ? "en" : "es") as "es" | "en"
      const isES = locale === "es"
      const obsNombre = reserva.turno.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
      const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]
      const horaLimite = formatearHoraLimite(reserva.fechaLimiteConfirmacion, locale)

      const confirmarUrl = generarUrlAccion(BASE_URL, reserva.token, "confirmar", locale)
      const anularUrl    = generarUrlAccion(BASE_URL, reserva.token, "anular",    locale)
      const extenderUrl  = generarUrlAccion(BASE_URL, reserva.token, "extender",  locale, 4 * 3600)

      const subject = isES
        ? `Tienes hasta las ${horaLimite} — confirma tu visita a ${obsNombre}`
        : `You have until ${horaLimite} — confirm your visit to ${obsNombre}`

      const html = emailRecordatorioViernesHTML({
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        observatorio: reserva.turno.observatorio,
        fecha: fechaStr,
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        cantidadPersonas: reserva.cantidadPersonas,
        horaLimite,
        confirmarUrl,
        anularUrl,
        extenderUrl,
        locale,
      })

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: reserva.email,
        subject,
        html,
      })

      await prisma.logAgente.create({
        data: {
          tipo: "RECORDATORIO_VIERNES",
          reservaId: reserva.id,
          resultado: `Recordatorio viernes enviado: ${subject}`,
          metadata: {
            resendId: result.data?.id ?? null,
            fechaVisita: fechaStr,
            observatorio: reserva.turno.observatorio,
          },
        },
      })

      ids.push(reserva.shortId)
    } catch (err) {
      console.error(`[recordatorio/viernes] error para reserva ${reserva.shortId}:`, err)

      await prisma.logAgente.create({
        data: {
          tipo: "ERROR",
          reservaId: reserva.id,
          resultado: "ERROR: fallo al enviar recordatorio viernes",
          metadata: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  return { enviados: ids.length, ids }
}
