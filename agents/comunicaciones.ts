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
import { emailConfirmacionHTML } from "@/components/email/templates"

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
