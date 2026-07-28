export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { enviarNotificacionCambio } from "@/lib/notificarCambioReserva"

const PutSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  apellido: z.string().min(1).max(120).optional(),
  documento: z.string().max(60).optional().nullable(),
})

const DeleteSchema = z.object({
  notificar: z.boolean().optional().default(false),
})

// ── PUT: editar un acompañante (sin cambio de cupos) ──────────────────────
export async function PUT(
  request: Request,
  context: { params: Promise<{ token: string; id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token, id } = await context.params

  const body = await request.json().catch(() => ({}))
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const reserva = await prisma.reserva.findUnique({ where: { token }, select: { id: true } })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  const acompanante = await prisma.acompanante.findUnique({ where: { id } })
  if (!acompanante || acompanante.reservaId !== reserva.id) {
    return NextResponse.json({ error: "Acompañante no encontrado en esta reserva" }, { status: 404 })
  }

  const { nombre, apellido, documento } = parsed.data
  const data: { nombre?: string; apellido?: string; documento?: string | null } = {}
  if (nombre !== undefined) data.nombre = nombre
  if (apellido !== undefined) data.apellido = apellido
  if (documento !== undefined) data.documento = documento || null

  const actualizado = await prisma.acompanante.update({ where: { id }, data })

  await prisma.logAgente.create({
    data: {
      tipo: "MODIFICACION",
      reservaId: reserva.id,
      resultado: `Admin ${admin.email} editó acompañante: ${actualizado.nombre} ${actualizado.apellido}`,
      metadata: { adminEmail: admin.email, accion: "editar_acompanante", acompananteId: id },
    },
  })

  return NextResponse.json({ data: actualizado })
}

// ── DELETE: quitar un acompañante (libera 1 cupo) ─────────────────────────
// Regla #6: antes de eliminar, se preservan los datos en el LogAgente.
export async function DELETE(
  request: Request,
  context: { params: Promise<{ token: string; id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token, id } = await context.params

  const body = await request.json().catch(() => ({}))
  const { notificar } = DeleteSchema.parse(
    body && typeof body === "object" ? body : {}
  )

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  const acompanante = await prisma.acompanante.findUnique({ where: { id } })
  if (!acompanante || acompanante.reservaId !== reserva.id) {
    return NextResponse.json({ error: "Acompañante no encontrado en esta reserva" }, { status: 404 })
  }

  // Si la nómina está completa (cantidadPersonas = acompañantes + titular),
  // quitar un nombre encoge el grupo y libera un cupo.
  // En una reserva de grupo con nombres pendientes, quitar un nombre solo
  // corrige la nómina: los cupos ya bloqueados se mantienen.
  const acompanantesActuales = await prisma.acompanante.count({
    where: { reservaId: reserva.id },
  })
  const nominaCompleta = reserva.cantidadPersonas === acompanantesActuales + 1
  const delta = nominaCompleta ? 1 : 0
  const nuevaCantidad = Math.max(1, reserva.cantidadPersonas - delta)

  await prisma.$transaction(async (tx) => {
    // Preservar los datos del acompañante en el log ANTES de eliminar (regla #6)
    await tx.logAgente.create({
      data: {
        tipo: "MODIFICACION",
        reservaId: reserva.id,
        resultado: `Admin ${admin.email} quitó acompañante: ${acompanante.nombre} ${acompanante.apellido}`,
        metadata: {
          adminEmail: admin.email,
          accion: "quitar_acompanante",
          cuposLiberados: delta,
          datosEliminados: {
            nombre: acompanante.nombre,
            apellido: acompanante.apellido,
            documento: acompanante.documento,
          },
        },
      },
    })

    await tx.acompanante.delete({ where: { id } })

    if (delta > 0) {
      await tx.turno.update({
        where: { id: reserva.turnoId },
        data: { cuposOcupados: { decrement: delta } },
      })

      await tx.reserva.update({
        where: { token },
        data: { cantidadPersonas: nuevaCantidad },
      })
    }
  })

  if (notificar) {
    void enviarNotificacionCambio(reserva, nuevaCantidad, token)
  }

  return NextResponse.json({ ok: true, cantidadPersonas: nuevaCantidad })
}
