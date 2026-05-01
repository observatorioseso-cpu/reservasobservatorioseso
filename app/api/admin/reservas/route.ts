export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obs = searchParams.get("obs")
  const estado = searchParams.get("estado")
  const q = searchParams.get("q")?.trim() || undefined
  const turnoId = searchParams.get("turnoId") || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const skip = (page - 1) * limit

  const where: Prisma.ReservaWhereInput = {}

  if (obs === "LA_SILLA" || obs === "PARANAL") {
    where.observatorio = obs
  }

  if (estado === "PENDIENTE_CONFIRMACION" || estado === "CONFIRMADA" || estado === "ANULADA") {
    where.estado = estado
  }

  if (turnoId) {
    where.turnoId = turnoId
  }

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { apellido: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { shortId: { contains: q, mode: "insensitive" } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        turno: {
          select: {
            fecha: true,
            horaInicio: true,
            horaFin: true,
            observatorio: true,
          },
        },
        _count: {
          select: { acompanantes: true },
        },
      },
    }),
    prisma.reserva.count({ where }),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
