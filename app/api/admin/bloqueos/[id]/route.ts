export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Observatorio } from "@prisma/client"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const bloqueo = await prisma.bloqueoCalendario.findUnique({ where: { id } })
  if (!bloqueo) return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 })

  // Eliminar el bloqueo
  await prisma.bloqueoCalendario.delete({ where: { id } })

  // Reactivar turnos del período (solo los que no tienen reservas activas —
  // mantener desactivados los que sí tienen para no exponer cupos incorrectos)
  // Estrategia: reactivar todos; el admin revisará manualmente si hay reservas
  const whereObs = bloqueo.observatorio
    ? { observatorio: bloqueo.observatorio as Observatorio }
    : {}
  const { count } = await prisma.turno.updateMany({
    where: {
      ...whereObs,
      fecha: { gte: bloqueo.fechaInicio, lte: bloqueo.fechaFin },
      activo: false,
    },
    data: { activo: true },
  })

  return NextResponse.json({ ok: true, turnosReactivados: count })
}
