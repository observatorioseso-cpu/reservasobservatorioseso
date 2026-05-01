export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { estaDentroDeVentanaModificacion } from "@/lib/confirmacion"
import { z } from "zod"

const bodySchema = z.object({
  password: z.string().min(1),
})

/**
 * POST /api/reservas/[token]/anular
 * El titular anula su reserva desde el portal.
 * Solo disponible antes del fechaLimiteConfirmacion.
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
    return NextResponse.json({ error: "Esta reserva ya fue anulada" }, { status: 409 })
  }

  if (!estaDentroDeVentanaModificacion(reserva.fechaLimiteConfirmacion)) {
    return NextResponse.json(
      {
        error: "La ventana de modificación ha cerrado",
        detalle: "Escribe a reservas@observatorioseso.cl para asistencia.",
      },
      { status: 403 }
    )
  }

  const passwordValida = await bcrypt.compare(parsed.data.password, reserva.passwordHash)
  if (!passwordValida) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Liberar cupos
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
        resultado: `Anulada desde portal. ${reserva.cantidadPersonas} cupos liberados.`,
        metadata: { via: "portal", cantidadPersonas: reserva.cantidadPersonas },
      },
    })
  })

  return NextResponse.json({
    ok: true,
    estado: "ANULADA",
    mensaje: "Reserva anulada. Los cupos han sido liberados.",
  })
}
