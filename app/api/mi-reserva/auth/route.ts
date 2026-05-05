export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Rate limiting: máx. 5 intentos por IP por minuto (lazy-init para evitar fallo en cold start)
let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "mi-reserva-auth",
    })
    return ratelimit
  } catch {
    return null
  }
}

/**
 * POST /api/mi-reserva/auth
 * Autentica al titular por email + password.
 * Si hay múltiples reservas activas, devuelve la más reciente.
 * Responde siempre con el mismo mensaje genérico para evitar enumeración.
 */
export async function POST(request: Request) {
  // Rate limiting
  const rl = getRatelimit()
  if (rl) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const { success } = await rl.limit(`mi-reserva-auth:${ip}`)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un minuto e intenta nuevamente." },
        { status: 429 }
      )
    }
  }
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
