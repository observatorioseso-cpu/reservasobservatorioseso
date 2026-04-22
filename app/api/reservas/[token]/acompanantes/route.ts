import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { modificacionAcompanantesSchema } from "@/lib/schemas"
import { estaDentroDeVentanaModificacion } from "@/lib/confirmacion"

/**
 * PUT /api/reservas/[token]/acompanantes
 *
 * Permite al titular modificar la lista de acompañantes desde el portal cliente.
 * Implementa la Opción 3: gestión granular con ajuste atómico de cupos.
 *
 * Reglas de negocio:
 * - Solo antes de fechaLimiteConfirmacion (viernes 12:00 Santiago)
 * - Solo el titular autenticado con su password de gestión
 * - Total de personas (titular + acompañantes) ≤ 10
 * - Aumento solo si hay cupos disponibles en el turno
 * - Cualquier cambio resetea el estado a PENDIENTE_CONFIRMACION
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Parsear body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  // 2. Validar estructura
  const parsed = modificacionAcompanantesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { password, acompanantes: nuevosAcompanantes } = parsed.data

  // 3. Buscar reserva
  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true, acompanantes: true },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  // 4. Verificar que la reserva no está anulada
  if (reserva.estado === "ANULADA") {
    return NextResponse.json({ error: "Esta reserva ha sido anulada" }, { status: 409 })
  }

  // 5. Verificar ventana de modificación (antes del viernes 12:00)
  if (!estaDentroDeVentanaModificacion(reserva.fechaLimiteConfirmacion)) {
    return NextResponse.json(
      {
        error: "La ventana de modificación ha cerrado",
        detalle: "Solo el equipo ESO puede hacer cambios después del plazo. Escribe a reservas@observatorioseso.cl",
      },
      { status: 403 }
    )
  }

  // 6. Verificar autenticación del titular
  const passwordValida = await bcrypt.compare(password, reserva.passwordHash)
  if (!passwordValida) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
  }

  // 7. Calcular delta de personas
  const nuevaCantidad = nuevosAcompanantes.length + 1 // +1 por el titular
  const delta = nuevaCantidad - reserva.cantidadPersonas // positivo = aumenta, negativo = reduce

  // 8. Verificar límite máximo para clientes
  if (nuevaCantidad > 10) {
    return NextResponse.json(
      {
        error: "Máximo 10 personas por reserva",
        detalle: "Para grupos más grandes, escribe a reservas@observatorioseso.cl",
      },
      { status: 422 }
    )
  }

  // 9. Transacción atómica
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Si aumenta: verificar cupos disponibles en el turno
      if (delta > 0) {
        const turno = await tx.turno.findUnique({ where: { id: reserva.turnoId } })
        if (!turno) throw new Error("TURNO_NOT_FOUND")

        const cuposLibres = turno.capacidadMax - turno.cuposOcupados
        if (cuposLibres < delta) throw new Error("NO_CUPOS")
      }

      // Actualizar cuposOcupados en el turno (delta puede ser 0, positivo o negativo)
      if (delta !== 0) {
        await tx.turno.update({
          where: { id: reserva.turnoId },
          data: { cuposOcupados: { increment: delta } },
        })
      }

      // Reemplazar acompañantes: eliminar los actuales y crear los nuevos
      await tx.acompanante.deleteMany({ where: { reservaId: reserva.id } })

      if (nuevosAcompanantes.length > 0) {
        await tx.acompanante.createMany({
          data: nuevosAcompanantes.map((a) => ({
            reservaId: reserva.id,
            nombre: a.nombre,
            apellido: a.apellido,
            documento: a.documento ?? null,
          })),
        })
      }

      // Actualizar cantidadPersonas y resetear confirmación
      await tx.reserva.update({
        where: { id: reserva.id },
        data: {
          cantidadPersonas: nuevaCantidad,
          estado: "PENDIENTE_CONFIRMACION",
          confirmadaEn: null,
        },
      })

      // Registrar en el log de agentes
      await tx.logAgente.create({
        data: {
          tipo: "MODIFICACION",
          reservaId: reserva.id,
          resultado: `Grupo modificado: ${reserva.cantidadPersonas} → ${nuevaCantidad} personas (delta: ${delta > 0 ? "+" : ""}${delta})`,
          metadata: {
            cantidadAnterior: reserva.cantidadPersonas,
            cantidadNueva: nuevaCantidad,
            delta,
          },
        },
      })
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN"

    if (message === "NO_CUPOS") {
      return NextResponse.json(
        { error: "No hay cupos disponibles para agregar más personas a este turno" },
        { status: 409 }
      )
    }
    if (message === "TURNO_NOT_FOUND") {
      return NextResponse.json({ error: "Error interno: turno no encontrado" }, { status: 500 })
    }

    console.error("[PUT /api/reservas/[token]/acompanantes] Error:", err)
    return NextResponse.json({ error: "Error al modificar la reserva" }, { status: 500 })
  }

  // 10. Regenerar PDF y notificar (async)
  import("@/agents/comunicaciones")
    .then(({ orquestarComunicacionesPostReserva }) =>
      orquestarComunicacionesPostReserva(reserva.id).catch((e) =>
        console.error("[comunicaciones/modificacion] error:", e)
      )
    )
    .catch(() => {})

  return NextResponse.json({
    ok: true,
    cantidadPersonas: nuevosAcompanantes.length + 1,
    estado: "PENDIENTE_CONFIRMACION",
    mensaje: "Grupo actualizado. Recuerda confirmar tu reserva antes del plazo.",
  })
}
