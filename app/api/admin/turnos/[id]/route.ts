import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { EstadoReserva } from "@prisma/client"

const editarTurnoSchema = z.object({
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  capacidadMax: z.number().int().min(1).max(200).optional(),
  activo: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const turno = await prisma.turno.findUnique({
    where: { id },
    include: {
      reservas: {
        where: {
          estado: { not: EstadoReserva.ANULADA },
        },
        select: {
          id: true,
          shortId: true,
          nombre: true,
          apellido: true,
          cantidadPersonas: true,
          estado: true,
          confirmadaEn: true,
        },
      },
      _count: { select: { reservas: true } },
    },
  })

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  return NextResponse.json(turno)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = editarTurnoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { horaFin, capacidadMax, activo } = parsed.data

  const turno = await prisma.turno.findUnique({ where: { id } })
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  if (capacidadMax !== undefined && capacidadMax < turno.cuposOcupados) {
    return NextResponse.json(
      { error: "No puedes reducir la capacidad por debajo de los cupos ya ocupados" },
      { status: 409 }
    )
  }

  const turnoActualizado = await prisma.turno.update({
    where: { id },
    data: {
      ...(horaFin !== undefined && { horaFin }),
      ...(capacidadMax !== undefined && { capacidadMax }),
      ...(activo !== undefined && { activo }),
    },
  })

  return NextResponse.json(turnoActualizado)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const turno = await prisma.turno.findUnique({
    where: { id },
    include: {
      reservas: {
        where: { estado: EstadoReserva.CONFIRMADA },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  if (turno.reservas.length > 0) {
    return NextResponse.json(
      { error: "No se puede desactivar: hay reservas confirmadas en este turno" },
      { status: 409 }
    )
  }

  await prisma.turno.update({
    where: { id },
    data: { activo: false },
  })

  return NextResponse.json({ ok: true })
}
