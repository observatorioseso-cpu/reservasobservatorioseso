export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token } = await context.params

  const reserva = await prisma.reserva.findUnique({ where: { token } })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  if (reserva.estado === "CONFIRMADA") {
    return NextResponse.json({ error: "La reserva ya está confirmada" }, { status: 409 })
  }

  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "No se puede confirmar una reserva anulada" }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.reserva.update({
      where: { token },
      data: {
        estado: "CONFIRMADA",
        confirmadaEn: new Date(),
      },
    })

    await tx.logAgente.create({
      data: {
        tipo: "CONFIRMACION",
        reservaId: reserva.id,
        resultado: `Admin ${admin.email} confirmó la reserva`,
        metadata: { adminEmail: admin.email },
      },
    })
  })

  return NextResponse.json({ ok: true })
}
