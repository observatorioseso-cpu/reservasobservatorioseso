export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

const createSchema = z.object({
  observatorio: z.enum(["LA_SILLA", "PARANAL"]).nullable().optional(),
  fechaInicio: z.string().date(),  // "YYYY-MM-DD"
  fechaFin: z.string().date(),
  motivo: z.string().min(3).max(300),
})

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const bloqueos = await prisma.bloqueoCalendario.findMany({
    orderBy: { fechaInicio: "asc" },
  })
  return NextResponse.json({ data: bloqueos })
}

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { observatorio, fechaInicio, fechaFin, motivo } = parsed.data

  if (fechaFin < fechaInicio) {
    return NextResponse.json({ error: "fechaFin debe ser >= fechaInicio" }, { status: 422 })
  }

  const inicio = new Date(fechaInicio + "T00:00:00.000Z")
  const fin    = new Date(fechaFin   + "T00:00:00.000Z")

  // Crear registro de bloqueo
  const bloqueo = await prisma.bloqueoCalendario.create({
    data: {
      observatorio: observatorio ?? null,
      fechaInicio: inicio,
      fechaFin: fin,
      motivo,
      creadoPor: admin.email,
    },
  })

  // Desactivar todos los turnos en el rango
  const whereObs = observatorio ? { observatorio } : {}
  const { count } = await prisma.turno.updateMany({
    where: {
      ...whereObs,
      fecha: { gte: inicio, lte: fin },
      activo: true,
    },
    data: { activo: false },
  })

  return NextResponse.json({ bloqueo, turnosDesactivados: count }, { status: 201 })
}
