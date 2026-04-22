import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

const PutBodySchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(1).optional(),
  idioma: z.enum(["ES", "EN"]).optional(),
  cantidadPersonas: z.number().int().positive().optional(),
  notaAdmin: z.string().optional(),
  estado: z.enum(["PENDIENTE_CONFIRMACION", "CONFIRMADA", "ANULADA"]).optional(),
  forzarCupos: z.boolean().optional(),
})

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token } = await context.params

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      turno: true,
      acompanantes: true,
      logsAgente: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  return NextResponse.json({ data: reserva })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token } = await context.params

  const body = await request.json()
  const parsed = PutBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const {
    nombre,
    apellido,
    email,
    telefono,
    idioma,
    cantidadPersonas,
    notaAdmin,
    estado,
    forzarCupos,
  } = parsed.data

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  // Build the scalar update object
  const updateData: Prisma.ReservaUpdateInput = {}
  if (nombre !== undefined) updateData.nombre = nombre
  if (apellido !== undefined) updateData.apellido = apellido
  if (email !== undefined) updateData.email = email
  if (telefono !== undefined) updateData.telefono = telefono
  if (idioma !== undefined) updateData.idioma = idioma
  if (notaAdmin !== undefined) updateData.notaAdmin = notaAdmin

  // Handle estado transitions
  if (estado !== undefined) {
    updateData.estado = estado
    if (estado === "CONFIRMADA") {
      updateData.confirmadaEn = new Date()
    } else if (estado === "PENDIENTE_CONFIRMACION") {
      updateData.confirmadaEn = null
    } else if (estado === "ANULADA") {
      updateData.confirmadaEn = null
    }
  }

  // Handle cantidadPersonas — requires transaction for cupos adjustment
  const cantidadCambia =
    cantidadPersonas !== undefined && cantidadPersonas !== reserva.cantidadPersonas

  // Special case: anulación via estado change also needs cupos adjustment
  const anulando = estado === "ANULADA" && reserva.estado !== "ANULADA"

  if (cantidadCambia || anulando) {
    const result = await prisma.$transaction(async (tx) => {
      const turno = await tx.turno.findUniqueOrThrow({ where: { id: reserva.turnoId } })

      let cuposDelta = 0

      if (cantidadCambia && cantidadPersonas !== undefined) {
        const delta = cantidadPersonas - reserva.cantidadPersonas
        if (delta > 0) {
          const cuposLibres = turno.capacidadMax - turno.cuposOcupados
          if (cuposLibres < delta && !forzarCupos) {
            // Throw a recognisable object to surface a 409 outside the transaction
            throw Object.assign(new Error("CUPOS_INSUFICIENTES"), { code: "CUPOS_INSUFICIENTES" })
          }
        }
        cuposDelta += delta
        updateData.cantidadPersonas = cantidadPersonas
      }

      // When anulando, also return current cantidadPersonas from cupos
      if (anulando) {
        const cantidadActual = cantidadPersonas ?? reserva.cantidadPersonas
        // If cantidadCambia already applied delta, the new total is cantidadPersonas;
        // otherwise use current stored value
        const personasALiberar = cantidadCambia && cantidadPersonas !== undefined
          ? cantidadPersonas
          : reserva.cantidadPersonas
        cuposDelta -= personasALiberar
      }

      await tx.turno.update({
        where: { id: reserva.turnoId },
        data: { cuposOcupados: { increment: cuposDelta } },
      })

      return tx.reserva.update({
        where: { token },
        data: updateData,
      })
    })

    return NextResponse.json({ data: result })
  }

  // No cupos adjustment needed — simple update
  if (cantidadPersonas !== undefined) {
    updateData.cantidadPersonas = cantidadPersonas
  }

  const updated = await prisma.reserva.update({
    where: { token },
    data: updateData,
  })

  return NextResponse.json({ data: updated })
}
