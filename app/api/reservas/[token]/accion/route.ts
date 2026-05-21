export const dynamic = "force-dynamic"

/**
 * GET /api/reservas/[token]/accion?a=confirmar|anular&exp=...&sig=...&l=es|en
 *
 * One-click action from the 24h reminder email.
 * Auth: HMAC-signed URL (no password required — the signed URL IS the credential).
 * Idempotent: already-CONFIRMADA / already-ANULADA redirect gracefully.
 */

import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { verificarAccionToken, generarUrlAccion } from "@/lib/accionToken"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

function redir(path: string): NextResponse {
  return NextResponse.redirect(`${BASE_URL}${path}`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)

  const accion = searchParams.get("a") ?? ""
  const exp    = searchParams.get("exp") ?? ""
  const sig    = searchParams.get("sig") ?? ""
  const locale = (searchParams.get("l") === "en" ? "en" : "es") as "es" | "en"

  // 1. Verify signature
  const verificacion = verificarAccionToken(token, accion, exp, sig)

  if (!verificacion.ok) {
    if (verificacion.reason === "expired") {
      return redir(`/${locale}/mi-reserva/${token}?error=link-expirado`)
    }
    return redir(`/${locale}`)
  }

  // 2. Load reservation
  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })

  if (!reserva) {
    return redir(`/${locale}`)
  }

  const fechaStr = reserva.turno.fecha.toISOString().split("T")[0]

  // 3. Handle idempotent cases
  if (reserva.estado === "CONFIRMADA") {
    return redir(`/${locale}/mi-reserva/${token}?ya=confirmada`)
  }
  if (reserva.estado === "ANULADA") {
    return redir(`/${locale}?ya=anulada`)
  }

  // 4a. Confirmar
  if (accion === "confirmar") {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reserva.update({
        where: { id: reserva.id },
        data: { estado: "CONFIRMADA", confirmadaEn: new Date() },
      })
      await tx.logAgente.create({
        data: {
          tipo: "CONFIRMACION",
          reservaId: reserva.id,
          resultado: "Confirmada desde email 24h (one-click)",
          metadata: { via: "email_24h" },
        },
      })
    })

    // Email ESO Email 1 al titular + staff (fire-and-forget)
    import("@/agents/comunicaciones")
      .then(({ enviarEmailConfirmada, notificarStaffConfirmada }) =>
        Promise.allSettled([
          enviarEmailConfirmada({
            reservaId: reserva.id,
            email: reserva.email,
            nombre: reserva.nombre,
            apellido: reserva.apellido,
            shortId: reserva.shortId,
            token: reserva.token,
            observatorio: reserva.observatorio,
            fecha: fechaStr,
            horaInicio: reserva.turno.horaInicio,
            horaFin: reserva.turno.horaFin,
            cantidadPersonas: reserva.cantidadPersonas,
            locale,
          }),
          notificarStaffConfirmada({
            reservaId: reserva.id,
            nombre: `${reserva.nombre} ${reserva.apellido}`,
            shortId: reserva.shortId,
            observatorio: reserva.observatorio,
            fecha: fechaStr,
            horaInicio: reserva.turno.horaInicio,
            horaFin: reserva.turno.horaFin,
            cantidadPersonas: reserva.cantidadPersonas,
            telefono: reserva.telefono ?? null,
            email: reserva.email,
          }),
        ])
      )
      .catch(() => {})

    // Generate PDF in background
    import("@/agents/pdf")
      .then(({ generarPDFPorToken }) =>
        generarPDFPorToken(token).catch(() => {})
      )
      .catch(() => {})

    return redir(`/${locale}/mi-reserva/${token}?confirmada=1`)
  }

  // 4b. Anular
  if (accion === "anular") {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.turno.update({
        where: { id: reserva.turnoId },
        data: { cuposOcupados: { decrement: reserva.cantidadPersonas } },
      })
      await tx.reserva.update({
        where: { id: reserva.id },
        data: { estado: "ANULADA" },
      })
      await tx.logAgente.create({
        data: {
          tipo: "ANULACION",
          reservaId: reserva.id,
          resultado: `Anulada desde email 24h. ${reserva.cantidadPersonas} cupos liberados.`,
          metadata: { via: "email_24h", cantidadPersonas: reserva.cantidadPersonas },
        },
      })
    })

    // Email al titular + staff (fire-and-forget)
    import("@/agents/comunicaciones")
      .then(({ enviarEmailAnulacion, notificarStaffAnulacion }) =>
        Promise.allSettled([
          enviarEmailAnulacion({
            reservaId: reserva.id,
            email: reserva.email,
            nombre: reserva.nombre,
            shortId: reserva.shortId,
            token: reserva.token,
            observatorio: reserva.observatorio,
            fecha: fechaStr,
            horaInicio: reserva.turno.horaInicio,
            horaFin: reserva.turno.horaFin,
            locale,
            motivo: "portal",
          }),
          notificarStaffAnulacion({
            reservaId: reserva.id,
            nombre: `${reserva.nombre} ${reserva.apellido}`,
            shortId: reserva.shortId,
            observatorio: reserva.observatorio,
            fecha: fechaStr,
            horaInicio: reserva.turno.horaInicio,
            horaFin: reserva.turno.horaFin,
            cantidadPersonas: reserva.cantidadPersonas,
            telefono: reserva.telefono ?? null,
            email: reserva.email,
          }),
        ])
      )
      .catch(() => {})

    return redir(`/${locale}?anulada=1`)
  }

  // 4c. Extender (+2 horas, one-time use)
  if (accion === "extender") {
    // One-time use: if already extended, redirect to portal
    const yaExtendida = await prisma.logAgente.findFirst({
      where: { reservaId: reserva.id, tipo: "EXTENSION" },
    })
    if (yaExtendida) {
      return redir(`/${locale}/mi-reserva/${token}?ya=extendida`)
    }

    const nuevaFechaLimite = new Date(reserva.fechaLimiteConfirmacion.getTime() + 2 * 60 * 60 * 1000)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.reserva.update({
        where: { id: reserva.id },
        data: { fechaLimiteConfirmacion: nuevaFechaLimite },
      })
      await tx.logAgente.create({
        data: {
          tipo: "EXTENSION",
          reservaId: reserva.id,
          resultado: "Plazo extendido +2h desde email viernes",
          metadata: {
            via: "email_viernes",
            nuevaFechaLimite: nuevaFechaLimite.toISOString(),
          },
        },
      })
    })

    // Send extension email (fire-and-forget)
    import("@/components/email/templates")
      .then(({ emailExtensionHTML }) =>
        import("@/lib/email").then(({ resend, EMAIL_FROM }) =>
          import("@/lib/confirmacion").then(({ formatearHoraLimite }) => {
            const nuevaHoraLimite = formatearHoraLimite(nuevaFechaLimite, locale)
            const confirmarUrl = generarUrlAccion(BASE_URL, token, "confirmar", locale)
            const anularUrl    = generarUrlAccion(BASE_URL, token, "anular",    locale)
            const html = emailExtensionHTML({
              nombre: reserva.nombre,
              shortId: reserva.shortId,
              observatorio: reserva.observatorio,
              fecha: fechaStr,
              horaInicio: reserva.turno.horaInicio,
              horaFin: reserva.turno.horaFin,
              cantidadPersonas: reserva.cantidadPersonas,
              nuevaHoraLimite,
              confirmarUrl,
              anularUrl,
              locale,
            })
            const subject = locale === "es"
              ? `Tu reserva ESO extendida — ahora tienes hasta las ${nuevaHoraLimite}`
              : `Your ESO booking extended — deadline now ${nuevaHoraLimite}`
            return resend.emails.send({ from: EMAIL_FROM, to: reserva.email, subject, html })
          })
        )
      )
      .catch(() => {})

    return redir(`/${locale}/mi-reserva/${token}?extendida=1`)
  }

  // Fallback (unreachable — verificarAccionToken already filters invalid acciones)
  return redir(`/${locale}`)
}
