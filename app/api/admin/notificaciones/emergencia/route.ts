export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

const bodySchema = z.object({
  fecha: z.string().date(),
  observatorio: z.enum(["LA_SILLA", "PARANAL"]).optional(),
  motivo: z.string().min(3).max(500),
  cancelar: z.boolean().default(false),
})

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }) }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { fecha, observatorio, motivo, cancelar } = parsed.data

  const fechaUTC = new Date(fecha + "T00:00:00.000Z")

  // Find all active reservas for the date
  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ["CONFIRMADA", "PENDIENTE_CONFIRMACION"] },
      ...(observatorio ? { observatorio } : {}),
      turno: { fecha: fechaUTC },
    },
    include: { turno: true },
    orderBy: { createdAt: "asc" },
  })

  if (reservas.length === 0) {
    return NextResponse.json({ ok: true, notificadas: 0, canceladas: 0, mensaje: "No hay reservas activas para esa fecha." })
  }

  // Import comunicaciones agent
  const { enviarEmailCierreEmergencia } = await import("@/agents/comunicaciones")

  let notificadas = 0
  let canceladas = 0

  for (const reserva of reservas) {
    try {
      // Cancel if requested
      if (cancelar) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.reserva.update({
            where: { id: reserva.id },
            data: { estado: "ANULADA" },
          })
          await tx.turno.update({
            where: { id: reserva.turnoId },
            data: { cuposOcupados: { decrement: reserva.cantidadPersonas } },
          })
          await tx.logAgente.create({
            data: {
              tipo: "CIERRE_EMERGENCIA",
              reservaId: reserva.id,
              resultado: `Cancelada por cierre de emergencia: ${motivo}`,
              metadata: { motivo, canceladoPor: admin.email },
            },
          })
        })
        canceladas++
      }

      // Send notification (fire-and-forget)
      enviarEmailCierreEmergencia({
        reservaId: reserva.id,
        email: reserva.email,
        nombre: reserva.nombre,
        shortId: reserva.shortId,
        token: reserva.token,
        observatorio: reserva.observatorio,
        fecha,
        horaInicio: reserva.turno.horaInicio,
        horaFin: reserva.turno.horaFin,
        locale: (reserva.locale as "es" | "en") ?? "es",
        motivo,
        cancelada: cancelar,
        // WhatsApp fields
        telefono: reserva.recibirWhatsapp && reserva.whatsappOptIn ? reserva.telefono : undefined,
      }).catch((e) => console.error(`[emergencia/email] ${reserva.shortId}:`, e))

      notificadas++
    } catch (err) {
      console.error(`[emergencia] error en reserva ${reserva.shortId}:`, err)
    }
  }

  return NextResponse.json({ ok: true, notificadas, canceladas })
}
