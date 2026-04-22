import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * POST /api/mi-reserva/auth
 * Autentica al titular por email + password.
 * Si hay múltiples reservas activas, devuelve la más reciente.
 * Responde siempre con el mismo mensaje genérico para evitar enumeración.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    )
  }

  const { email, password } = parsed.data

  // Buscar reservas activas por email (más reciente primero)
  const reservas = await prisma.reserva.findMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      estado: { not: "ANULADA" },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  if (reservas.length === 0) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    )
  }

  // Verificar password contra todas las reservas (toma la primera que coincide)
  let matchedToken: string | null = null
  for (const reserva of reservas) {
    const valida = await bcrypt.compare(password, reserva.passwordHash)
    if (valida) {
      matchedToken = reserva.token
      break
    }
  }

  if (!matchedToken) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    )
  }

  return NextResponse.json({ token: matchedToken })
}
