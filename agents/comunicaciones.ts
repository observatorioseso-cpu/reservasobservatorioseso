/**
 * Agente 2: Comunicaciones post-reserva
 *
 * Orquesta (sin LLM) en este orden:
 * 1. Enviar email de confirmación (Resend)
 * 2. Enviar WhatsApp si el titular lo autorizó (Meta Business Cloud API)
 * 3. Generar PDF de la reserva (stub — agente PDF separado)
 *
 * Activación: async, después de POST /api/reservas y PUT /acompanantes y POST /confirmar
 */

import { prisma } from "@/lib/prisma"
import { resend, EMAIL_FROM } from "@/lib/email"
import { formatearFechaLimite } from "@/lib/confirmacion"
import {
  emailConfirmacionHTML,
  emailAnulacionHTML,
  emailCierreEmergenciaHTML,
} from "@/components/email/templates"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

export async function orquestarComunicacionesPostReserva(reservaId: string): Promise<void> {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { turno: true },
  })

  if (!reserva) {
    console.error(`[comunicaciones] reserva ${reservaId} no encontrada`)
    return
  }

  const portalUrl = `${BASE_URL}/${reserva.locale}/mi-reserva/${reserva.token}`
  const fechaLimite = formatearFechaLimite(
    reserva.fechaLimiteConfirmacion,
    reserva.locale as "es" | "en"
  )

  const emailPromise = enviarEmailConfirmacion({
    reservaId,
    email: reserva.email,
    nombre: reserva.nombre,
    apellido: reserva.apellido,
    shortId: reserva.shortId,
    token: reserva.token,
    observatorio: reserva.observatorio,
    fecha: reserva.turno.fecha.toISOString().split("T")[0],
    horaInicio: reserva.turno.horaInicio,
    horaFin: reserva.turno.horaFin,
    cantidadPersonas: reserva.cantidadPersonas,
    fechaLimite,
    portalUrl,
    locale: reserva.locale as "es" | "en",
  })

  const whatsappPromise =
    reserva.recibirWhatsapp && reserva.whatsappOptIn && reserva.telefono
      ? enviarWhatsapp({
          telefono: reserva.telefono,
          nombre: reserva.nombre,
          shortId: reserva.shortId,
          observatorio: reserva.observatorio,
          fecha: reserva.turno.fecha.toISOString().split("T")[0],
          horaInicio: reserva.turno.horaInicio,
          portalUrl,
        })
      : Promise.resolve()

  await Promise.allSettled([emailPromise, whatsappPromise])
}

// ─── Email ───────────────────────────────────────────────────────────────────

interface EmailConfirmacionParams {
  reservaId: string
  email: string
  nombre: string
  apellido: string
  shortId: string
  token: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  fechaLimite: string
  portalUrl: string
  locale: "es" | "en"
}

async function enviarEmailConfirmacion(params: EmailConfirmacionParams): Promise<void> {
  const obsNombre = params.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const isES = params.locale === "es"

  const subject = isES
    ? `Reserva registrada — ${obsNombre} · ${params.fecha}`
    : `Booking confirmed — ${obsNombre} · ${params.fecha}`

  const html = emailConfirmacionHTML({
    nombre: params.nombre,
    apellido: params.apellido,
    shortId: params.shortId,
    token: params.token,
    observatorio: params.observatorio,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    cantidadPersonas: params.cantidadPersonas,
    fechaLimite: params.fechaLimite,
    portalUrl: params.portalUrl,
    locale: params.locale,
  })

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.email,
      subject,
      html,
    })

    await prisma.logAgente.create({
      data: {
        tipo: "EMAIL",
        reservaId: params.reservaId,
        resultado: `Email enviado: ${subject}`,
        metadata: { resendId: result.data?.id ?? null },
      },
    })
  } catch (err) {
    console.error(`[comunicaciones/email] error para ${params.reservaId}:`, err)
    await prisma.logAgente.create({
      data: {
        tipo: "EMAIL",
        reservaId: params.reservaId,
        resultado: "ERROR: fallo al enviar email",
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      },
    })
  }
}

// ─── Email de anulación ───────────────────────────────────────────────────────

interface EmailAnulacionParams {
  reservaId: string
  email: string
  nombre: string
  shortId: string
  token: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  locale: "es" | "en"
  motivo: "portal" | "auto"
}

export async function enviarEmailAnulacion(params: EmailAnulacionParams): Promise<void> {
  const obsNombre = params.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const isES = params.locale === "es"
  const portalUrl = `${BASE_URL}/${params.locale}/mi-reserva/${params.token}`

  const subject = isES
    ? `Reserva anulada — ${obsNombre} · ${params.fecha}`
    : `Booking cancelled — ${obsNombre} · ${params.fecha}`

  const html = emailAnulacionHTML({
    nombre: params.nombre,
    shortId: params.shortId,
    observatorio: params.observatorio,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    portalUrl,
    locale: params.locale,
    motivo: params.motivo,
  })

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.email,
      subject,
      html,
    })

    await prisma.logAgente.create({
      data: {
        tipo: "EMAIL",
        reservaId: params.reservaId,
        resultado: `Email anulación enviado: ${subject}`,
        metadata: { resendId: result.data?.id ?? null, motivo: params.motivo },
      },
    })
  } catch (err) {
    console.error(`[comunicaciones/anulacion] error para ${params.reservaId}:`, err)
    await prisma.logAgente.create({
      data: {
        tipo: "ERROR",
        reservaId: params.reservaId,
        resultado: "ERROR: fallo al enviar email de anulación",
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      },
    })
  }
}

// ─── WhatsApp (Meta Business Cloud API) ──────────────────────────────────────

interface WhatsappParams {
  telefono: string
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  portalUrl: string
}

// ─── Email de cierre de emergencia ───────────────────────────────────────────

export interface EmailCierreEmergenciaParams {
  reservaId: string
  email: string
  nombre: string
  shortId: string
  token: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  locale: "es" | "en"
  motivo: string
  cancelada: boolean
  telefono?: string | null // present only if whatsapp opt-in is active
}

export async function enviarEmailCierreEmergencia(
  params: EmailCierreEmergenciaParams
): Promise<void> {
  const obsNombre = params.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const isES = params.locale === "es"
  const portalUrl = `${BASE_URL}/${params.locale}/mi-reserva/${params.token}`

  const subject = isES
    ? params.cancelada
      ? `Visita cancelada — ${obsNombre} · ${params.fecha}`
      : `Aviso importante — ${obsNombre} · ${params.fecha}`
    : params.cancelada
      ? `Visit cancelled — ${obsNombre} · ${params.fecha}`
      : `Important notice — ${obsNombre} · ${params.fecha}`

  const html = emailCierreEmergenciaHTML({
    nombre: params.nombre,
    shortId: params.shortId,
    observatorio: params.observatorio,
    fecha: params.fecha,
    horaInicio: params.horaInicio,
    horaFin: params.horaFin,
    portalUrl,
    locale: params.locale,
    motivo: params.motivo,
    cancelada: params.cancelada,
  })

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.email,
      subject,
      html,
    })

    await prisma.logAgente.create({
      data: {
        tipo: "EMAIL",
        reservaId: params.reservaId,
        resultado: `Email cierre emergencia enviado: ${subject}`,
        metadata: { resendId: result.data?.id ?? null, motivo: params.motivo },
      },
    })
  } catch (err) {
    console.error(`[comunicaciones/emergencia] error para ${params.reservaId}:`, err)
    await prisma.logAgente.create({
      data: {
        tipo: "ERROR",
        reservaId: params.reservaId,
        resultado: "ERROR: fallo al enviar email de cierre de emergencia",
        metadata: { error: err instanceof Error ? err.message : "unknown" },
      },
    })
  }

  // WhatsApp notification if opted in
  if (params.telefono) {
    await enviarWhatsappEmergencia({
      telefono: params.telefono,
      nombre: params.nombre,
      shortId: params.shortId,
      observatorio: params.observatorio,
      fecha: params.fecha,
      horaInicio: params.horaInicio,
      motivo: params.motivo,
      cancelada: params.cancelada,
    }).catch((e) =>
      console.error(`[comunicaciones/emergencia/whatsapp] ${params.shortId}:`, e)
    )
  }
}

// ─── WhatsApp de cierre de emergencia ────────────────────────────────────────

interface WhatsappEmergenciaParams {
  telefono: string
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  motivo: string
  cancelada: boolean
}

async function enviarWhatsappEmergencia(params: WhatsappEmergenciaParams): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    console.warn("[comunicaciones/whatsapp/emergencia] WHATSAPP_TOKEN o PHONE_NUMBER_ID no configurados")
    return
  }

  const obsNombre = params.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const telefono = params.telefono.replace(/[\s\+\-\(\)]/g, "")
  const templateName = params.cancelada ? "visita_cancelada_emergencia" : "aviso_cierre_emergencia"

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefono,
          type: "template",
          template: {
            name: templateName,
            language: { code: "es_CL" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: params.nombre },
                  { type: "text", text: params.shortId },
                  { type: "text", text: `${obsNombre} · ${params.fecha} ${params.horaInicio}` },
                  { type: "text", text: params.motivo },
                ],
              },
            ],
          },
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error(`[comunicaciones/whatsapp/emergencia] error ${res.status}:`, body)
    }
  } catch (err) {
    console.error("[comunicaciones/whatsapp/emergencia] error de red:", err)
  }
}

async function enviarWhatsapp(params: WhatsappParams): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    console.warn("[comunicaciones/whatsapp] WHATSAPP_TOKEN o PHONE_NUMBER_ID no configurados")
    return
  }

  const obsNombre = params.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const telefono = params.telefono.replace(/[\s\+\-\(\)]/g, "")

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefono,
          type: "template",
          template: {
            name: "reserva_confirmacion",
            language: { code: "es_CL" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: params.nombre },
                  { type: "text", text: params.shortId },
                  { type: "text", text: `${obsNombre} · ${params.fecha} ${params.horaInicio}` },
                  { type: "text", text: params.portalUrl },
                ],
              },
            ],
          },
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error(`[comunicaciones/whatsapp] error ${res.status}:`, body)
    }
  } catch (err) {
    console.error("[comunicaciones/whatsapp] error de red:", err)
  }
}
