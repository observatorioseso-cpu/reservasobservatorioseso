export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/reservas/[token]
 * Devuelve los datos de una reserva para el portal cliente.
 * No requiere autenticación — el token es el secret.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      turno: true,
      acompanantes: {
        orderBy: { nombre: "asc" },
      },
    },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  return NextResponse.json({
    id: reserva.id,
    shortId: reserva.shortId,
    token: reserva.token,
    estado: reserva.estado,
    observatorio: reserva.observatorio,
    nombre: reserva.nombre,
    apellido: reserva.apellido,
    email: reserva.email,
    cantidadPersonas: reserva.cantidadPersonas,
    idioma: reserva.idioma,
    fechaLimiteConfirmacion: reserva.fechaLimiteConfirmacion.toISOString(),
    confirmadaEn: reserva.confirmadaEn?.toISOString() ?? null,
    turno: {
      fecha: reserva.turno.fecha.toISOString().split("T")[0],
      horaInicio: reserva.turno.horaInicio,
      horaFin: reserva.turno.horaFin,
    },
    acompanantes: reserva.acompanantes.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      documento: a.documento,
    })),
  })
}
