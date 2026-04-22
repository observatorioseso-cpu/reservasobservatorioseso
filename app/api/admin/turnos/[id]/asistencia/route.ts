import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

const asistenciaSchema = z.object({
  asistentesReales: z.number().int().min(0).max(500),
})

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

  const parsed = asistenciaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const turno = await prisma.turno.findUnique({ where: { id } })
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
  }

  const turnoActualizado = await prisma.turno.update({
    where: { id },
    data: {
      asistentesReales: parsed.data.asistentesReales,
      asistenciaRegistradaEn: new Date(),
      asistenciaRegistradaPor: admin.email,
    },
  })

  return NextResponse.json(turnoActualizado)
}
