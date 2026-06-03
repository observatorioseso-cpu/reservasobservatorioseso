export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { enviarNotificacionCambio } from "@/lib/notificarCambioReserva"

const BodySchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(120),
  apellido: z.string().min(1, "Apellido requerido").max(120),
  documento: z.string().max(60).optional().nullable(),
  forzarCupos: z.boolean().optional().default(false),
  notificar: z.boolean().optional().default(false),
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

  const { nombre, apellido, documento, forzarCupos, notificar } = parsed.data

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }
  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "No se pueden agregar personas a una reserva anulada" }, { status: 409 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const turno = await tx.turno.findUniqueOrThrow({ where: { id: reserva.turnoId } })
      const cuposLibres = turno.capacidadMax - turno.cuposOcupados
      const nuevaCantidad = reserva.cantidadPersonas + 1

      if (cuposLibres < 1 && !forzarCupos) {
        throw Object.assign(new Error("CUPOS_INSUFICIENTES"), { code: "CUPOS_INSUFICIENTES" })
      }

      // Límite por reserva del turno (p.ej. nocturna = 4), salvo forzarCupos
      if (
        turno.maxPersonasPorReserva != null &&
        nuevaCantidad > turno.maxPersonasPorReserva &&
        !forzarCupos
      ) {
        throw Object.assign(new Error("LIMITE_POR_RESERVA"), {
          code: "LIMITE_POR_RESERVA",
          max: turno.maxPersonasPorReserva,
        })
      }

      const acompanante = await tx.acompanante.create({
        data: {
          reservaId: reserva.id,
          nombre,
          apellido,
          documento: documento || null,
        },
      })

      await tx.turno.update({
        where: { id: reserva.turnoId },
        data: { cuposOcupados: { increment: 1 } },
      })

      await tx.reserva.update({
        where: { token },
        data: { cantidadPersonas: nuevaCantidad },
      })

      await tx.logAgente.create({
        data: {
          tipo: "MODIFICACION",
          reservaId: reserva.id,
          resultado: `Admin ${admin.email} agregó acompañante: ${nombre} ${apellido}${forzarCupos ? " (cupos forzados)" : ""}`,
          metadata: {
            adminEmail: admin.email,
            accion: "agregar_acompanante",
            acompananteId: acompanante.id,
            documento: documento || null,
            forzarCupos,
          },
        },
      })

      return { acompanante, nuevaCantidad }
    })

    if (notificar) {
      void enviarNotificacionCambio(reserva, result.nuevaCantidad, token)
    }

    return NextResponse.json({ data: result.acompanante, cantidadPersonas: result.nuevaCantidad })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === "CUPOS_INSUFICIENTES") {
      return NextResponse.json(
        { error: "Cupos insuficientes en el turno", code },
        { status: 409 }
      )
    }
    if (code === "LIMITE_POR_RESERVA") {
      const max = (err as { max?: number }).max
      return NextResponse.json(
        { error: `Este turno permite máximo ${max} personas por reserva`, code },
        { status: 409 }
      )
    }
    console.error("[acompanantes POST] Error:", err)
    return NextResponse.json({ error: "Error interno al agregar acompañante" }, { status: 500 })
  }
}
