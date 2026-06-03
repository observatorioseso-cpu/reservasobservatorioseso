export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

interface TurnoResumen {
  id: string
  observatorio: string
  horaInicio: string
  horaFin: string
  tipo: string
  activo: boolean
  capacidadMax: number
  cuposOcupados: number
  cuposLibres: number
  numReservas: number
  numPersonas: number
}

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = parseInt(searchParams.get("year") ?? String(now.getUTCFullYear()), 10)
  const month = parseInt(searchParams.get("month") ?? String(now.getUTCMonth() + 1), 10) // 1-12
  const obs = searchParams.get("obs")

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parámetros year/month inválidos" }, { status: 400 })
  }

  const desde = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const hasta = new Date(Date.UTC(year, month, 0, 23, 59, 59)) // día 0 del mes siguiente = último día

  const where: Prisma.TurnoWhereInput = {
    fecha: { gte: desde, lte: hasta },
  }
  if (obs === "LA_SILLA" || obs === "PARANAL") {
    where.observatorio = obs
  }

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    include: {
      reservas: {
        where: { estado: { not: "ANULADA" } },
        select: { cantidadPersonas: true },
      },
    },
  })

  // Agrupar por fecha ISO
  const dias: Record<string, TurnoResumen[]> = {}

  for (const t of turnos) {
    const iso = toISODate(t.fecha)
    const numReservas = t.reservas.length
    const numPersonas = t.reservas.reduce((acc, r) => acc + r.cantidadPersonas, 0)

    const resumen: TurnoResumen = {
      id: t.id,
      observatorio: t.observatorio,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      tipo: t.tipo,
      activo: t.activo,
      capacidadMax: t.capacidadMax,
      cuposOcupados: t.cuposOcupados,
      cuposLibres: t.capacidadMax - t.cuposOcupados,
      numReservas,
      numPersonas,
    }

    if (!dias[iso]) dias[iso] = []
    dias[iso].push(resumen)
  }

  return NextResponse.json({ year, month, dias })
}
