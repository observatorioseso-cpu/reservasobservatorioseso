import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

const BodySchema = z.object({
  motivo: z.string().optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token } = await context.params

  const body = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const { motivo } = parsed.data

  const reserva = await prisma.reserva.findUnique({ where: { token } })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "La reserva ya está anulada" }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.reserva.update({
      where: { token },
      data: {
        estado: "ANULADA",
        confirmadaEn: null,
      },
    })

    await tx.turno.update({
      where: { id: reserva.turnoId },
      data: { cuposOcupados: { decrement: reserva.cantidadPersonas } },
    })

    await tx.logAgente.create({
      data: {
        tipo: "ANULACION",
        reservaId: reserva.id,
        resultado: `Admin ${admin.email} anuló la reserva${motivo ? ". Motivo: " + motivo : ""}`,
        metadata: { adminEmail: admin.email, motivo: motivo ?? null },
      },
    })
  })

  return NextResponse.json({ ok: true })
}
