export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const querySchema = z.object({
  observatorio: z.enum(["LA_SILLA", "PARANAL"]),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Formato esperado: YYYY-MM"),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = querySchema.safeParse({
    observatorio: searchParams.get("observatorio"),
    mes: searchParams.get("mes"),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { observatorio, mes } = parsed.data
  const [year, month] = mes.split("-").map(Number)

  // Rango del mes completo en UTC (los turnos se guardan como UTC midnight)
  const inicio = new Date(Date.UTC(year, month - 1, 1))
  const fin = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  const turnosRaw = await prisma.turno.findMany({
    where: {
      observatorio,
      fecha: { gte: inicio, lte: fin },
      activo: true,
    },
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      capacidadMax: true,
      cuposOcupados: true,
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  })

  // Paranal only operates on Saturdays; filter out any legacy Sunday turnos
  const turnos = observatorio === "PARANAL"
    ? turnosRaw.filter((t) => t.fecha.getUTCDay() === 6)
    : turnosRaw

  type TurnoDisponible = {
    id: string
    horaInicio: string
    horaFin: string
    capacidadMax: number
    cuposOcupados: number
    cuposLibres: number
    disponible: boolean
  }

  // Agrupar por fecha ISO para el calendario
  const porFecha = turnos.reduce<Record<string, TurnoDisponible[]>>(
    (acc, turno) => {
      const key = turno.fecha.toISOString().split("T")[0]
      if (!acc[key]) acc[key] = []
      acc[key].push({
        id: turno.id,
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        capacidadMax: turno.capacidadMax,
        cuposOcupados: turno.cuposOcupados,
        cuposLibres: turno.capacidadMax - turno.cuposOcupados,
        disponible: turno.capacidadMax - turno.cuposOcupados > 0,
      })
      return acc
    },
    {}
  )

  return NextResponse.json(porFecha, {
    headers: {
      // Nunca cachear disponibilidad — debe ser siempre en tiempo real
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
