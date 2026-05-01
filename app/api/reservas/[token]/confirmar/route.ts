export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { estaDentroDeVentanaModificacion } from "@/lib/confirmacion"
import { z } from "zod"

const bodySchema = z.object({
  password: z.string().min(1),
})

/**
 * POST /api/reservas/[token]/confirmar
 * El titular confirma su asistencia desde el portal.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 })
  }

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "Esta reserva ha sido anulada" }, { status: 409 })
  }

  if (reserva.estado === "CONFIRMADA") {
    return NextResponse.json({
      ok: true,
      estado: "CONFIRMADA",
      confirmadaEn: reserva.confirmadaEn?.toISOString(),
      mensaje: "Tu reserva ya estaba confirmada.",
    })
  }

  if (!estaDentroDeVentanaModificacion(reserva.fechaLimiteConfirmacion)) {
    return NextResponse.json(
      {
        error: "La ventana de confirmación ha cerrado",
        detalle: "Escribe a reservas@observatorioseso.cl para asistencia.",
      },
      { status: 403 }
    )
  }

  const passwordValida = await bcrypt.compare(parsed.data.password, reserva.passwordHash)
  if (!passwordValida) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
  }

  const actualizada = await prisma.reserva.update({
    where: { id: reserva.id },
    data: {
      estado: "CONFIRMADA",
      confirmadaEn: new Date(),
    },
  })

  await prisma.logAgente.create({
    data: {
      tipo: "CONFIRMACION",
      reservaId: reserva.id,
      resultado: "Reserva confirmada desde portal cliente",
      metadata: { via: "portal" },
    },
  })

  // Notificar al titular (email/WhatsApp) — async, no bloquea
  import("@/agents/comunicaciones")
    .then(({ orquestarComunicacionesPostReserva }) =>
      orquestarComunicacionesPostReserva(reserva.id).catch((e) =>
        console.error("[comunicaciones/confirmacion] error:", e)
      )
    )
    .catch(() => {})

  // Post-confirmación: generar PDF en background (no bloquea la respuesta)
  import("@/agents/pdf")
    .then(({ generarPDFPorToken }) =>
      generarPDFPorToken(token).catch((e: unknown) =>
        console.error("[pdf] error generando PDF:", e)
      )
    )
    .catch(() => {})

  return NextResponse.json({
    ok: true,
    estado: "CONFIRMADA",
    confirmadaEn: actualizada.confirmadaEn?.toISOString(),
    mensaje: "Reserva confirmada. ¡Nos vemos en el observatorio!",
  })
}
