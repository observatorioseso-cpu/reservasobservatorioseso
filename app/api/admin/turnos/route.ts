export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

const crearTurnoSchema = z.object({
  observatorio: z.enum(["LA_SILLA", "PARANAL"]),
  fecha: z.string().date(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  capacidadMax: z.number().int().min(1).max(200),
})

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obs = searchParams.get("obs")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const activoParam = searchParams.get("activo")

  const where: Prisma.TurnoWhereInput = {}

  if (obs === "LA_SILLA" || obs === "PARANAL") {
    where.observatorio = obs
  }

  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) where.fecha.lte = new Date(hasta)
  }

  if (activoParam === "true") {
    where.activo = true
  } else if (activoParam === "false") {
    where.activo = false
  }

  const turnos = await prisma.turno.findMany({
    where,
    include: {
      _count: { select: { reservas: true } },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  })

  const result = turnos.map((t) => ({
    ...t,
    cuposLibres: t.capacidadMax - t.cuposOcupados,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = crearTurnoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { observatorio, fecha, horaInicio, horaFin, capacidadMax } = parsed.data

  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)
  const fechaDate = new Date(fecha)
  if (fechaDate < hoy) {
    return NextResponse.json(
      { error: "La fecha del turno debe ser igual o posterior a hoy" },
      { status: 422 }
    )
  }

  try {
    const turno = await prisma.turno.create({
      data: {
        observatorio,
        fecha: fechaDate,
        horaInicio,
        horaFin,
        capacidadMax,
      },
    })
    return NextResponse.json(turno, { status: 201 })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un turno en esa fecha/hora/observatorio" },
        { status: 409 }
      )
    }
    console.error("[POST /api/admin/turnos] Error:", err)
    return NextResponse.json({ error: "Error al crear el turno" }, { status: 500 })
  }
}
