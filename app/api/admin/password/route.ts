export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

/**
 * Cambio de contraseña del propio admin.
 *
 * Existe para que una contraseña temporal entregada por un canal externo
 * (WhatsApp, llamada) deje de valer apenas la titular ingresa. Exige la
 * contraseña actual, así una sesión robada no basta para tomar la cuenta.
 */

const BodySchema = z
  .object({
    passwordActual: z.string().min(1, "Ingresa tu contraseña actual"),
    passwordNueva: z
      .string()
      .min(10, "La nueva contraseña debe tener al menos 10 caracteres")
      .max(100),
  })
  .refine((d) => d.passwordNueva !== d.passwordActual, {
    message: "La nueva contraseña debe ser distinta de la actual",
    path: ["passwordNueva"],
  })

export async function GET(request: Request): Promise<NextResponse> {
  const sesion = await getAdminFromRequest(request)
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = await prisma.admin.findUnique({
    where: { id: sesion.adminId },
    select: { email: true, nombre: true, debeCambiarPassword: true, ultimoLoginEn: true },
  })
  if (!admin) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })

  return NextResponse.json({ data: admin })
}

export async function PUT(request: Request): Promise<NextResponse> {
  const sesion = await getAdminFromRequest(request)
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    )
  }

  const admin = await prisma.admin.findUnique({ where: { id: sesion.adminId } })
  if (!admin) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })

  const actualValida = await bcrypt.compare(parsed.data.passwordActual, admin.passwordHash)
  if (!actualValida) {
    return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 401 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.passwordNueva, 12)

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash, debeCambiarPassword: false },
  })

  return NextResponse.json({ ok: true })
}
