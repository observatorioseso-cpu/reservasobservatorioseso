export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { calcularFechaLimiteConfirmacion } from "@/lib/confirmacion"
import { enviarNotificacionCambio } from "@/lib/notificarCambioReserva"

const BodySchema = z.object({
  nuevoTurnoId: z.string().min(1),
  forzarCupos: z.boolean().optional().default(false),
  notificar: z.boolean().optional().default(false),
})

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

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

  const { nuevoTurnoId, forzarCupos, notificar } = parsed.data

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }
  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "No se puede reagendar una reserva anulada" }, { status: 409 })
  }
  if (reserva.turnoId === nuevoTurnoId) {
    return NextResponse.json({ error: "La reserva ya está en ese turno" }, { status: 409 })
  }

  const nuevoTurno = await prisma.turno.findUnique({ where: { id: nuevoTurnoId } })
  if (!nuevoTurno) {
    return NextResponse.json({ error: "Turno destino no encontrado" }, { status: 404 })
  }
  if (!nuevoTurno.activo) {
    return NextResponse.json({ error: "El turno destino está inactivo" }, { status: 409 })
  }

  const turnoAnteriorId = reserva.turnoId
  const nuevaFechaLimite = calcularFechaLimiteConfirmacion(nuevoTurno.fecha)

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-leer turno destino dentro de la transacción para cupos frescos
      const destino = await tx.turno.findUniqueOrThrow({ where: { id: nuevoTurnoId } })
      const cuposLibres = destino.capacidadMax - destino.cuposOcupados

      if (cuposLibres < reserva.cantidadPersonas && !forzarCupos) {
        throw Object.assign(new Error("CUPOS_INSUFICIENTES"), { code: "CUPOS_INSUFICIENTES" })
      }

      // Liberar cupos del turno anterior
      await tx.turno.update({
        where: { id: turnoAnteriorId },
        data: { cuposOcupados: { decrement: reserva.cantidadPersonas } },
      })

      // Ocupar cupos en el turno destino
      await tx.turno.update({
        where: { id: nuevoTurnoId },
        data: { cuposOcupados: { increment: reserva.cantidadPersonas } },
      })

      const actualizada = await tx.reserva.update({
        where: { token },
        data: {
          turnoId: nuevoTurnoId,
          observatorio: destino.observatorio,
          fechaLimiteConfirmacion: nuevaFechaLimite,
        },
        include: { turno: true },
      })

      await tx.logAgente.create({
        data: {
          tipo: "MODIFICACION",
          reservaId: reserva.id,
          resultado:
            `Admin ${admin.email} reagendó la reserva: ` +
            `${reserva.turno.observatorio} ${toISODate(reserva.turno.fecha)} ${reserva.turno.horaInicio} → ` +
            `${destino.observatorio} ${toISODate(destino.fecha)} ${destino.horaInicio}` +
            (forzarCupos ? " (cupos forzados)" : ""),
          metadata: {
            adminEmail: admin.email,
            turnoAnteriorId,
            nuevoTurnoId,
            forzarCupos,
            notificado: notificar,
          },
        },
      })

      return actualizada
    })

    // Email opcional de notificación al titular (fire-and-forget)
    if (notificar) {
      enviarNotificacionCambio(result, result.cantidadPersonas, token)
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    if ((err as { code?: string }).code === "CUPOS_INSUFICIENTES") {
      return NextResponse.json(
        { error: "Cupos insuficientes en el turno destino", code: "CUPOS_INSUFICIENTES" },
        { status: 409 }
      )
    }
    console.error("[reagendar] Error:", err)
    return NextResponse.json({ error: "Error interno al reagendar" }, { status: 500 })
  }
}
