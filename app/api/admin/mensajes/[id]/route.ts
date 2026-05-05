export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { z } from "zod"

const patchSchema = z.object({
  estado: z.enum(["NUEVO", "LEIDO", "RESPONDIDO", "ARCHIVADO"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  const mensaje = await prisma.mensajeContacto.update({
    where: { id },
    data: { estado: parsed.data.estado },
  }).catch(() => null)

  if (!mensaje) return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 })

  return NextResponse.json(mensaje)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  await prisma.mensajeContacto.delete({ where: { id } }).catch(() => null)

  return NextResponse.json({ ok: true })
}
