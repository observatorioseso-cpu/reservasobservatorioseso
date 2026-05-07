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
import { formatearFechaLimite } from "@/lib/confirmacion"
import { emailRecordatorioHTML } from "@/components/email/templates"
import { enviarEmailAnulacion } from "@/agents/comunicaciones"
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
      email: true,
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

      // Notificar al titular que su reserva fue anulada automáticamente
      enviarEmailAnulacion({
        reservaId: reserva.id,
        email: reserva.email,
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        token: reserva.token,
        observatorio: reserva.turno.observatorio,
        fecha: reserva.turno.fecha.toISOString().split("T")[0],
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        locale: (reserva.locale as "es" | "en") ?? "es",
        motivo: "auto",
      }).catch((e) => console.error(`[recordatorio/autoanulacion/email] ${reserva.shortId}:`, e))
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
