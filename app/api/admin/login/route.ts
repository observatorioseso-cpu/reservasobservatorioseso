export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signAdminToken, setAdminCookie } from "@/lib/adminAuth"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "admin-login",
    })
    return ratelimit
  } catch {
    return null
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"

  const rl = getRatelimit()
  if (rl) {
    const { success } = await rl.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente en un minuto." },
        { status: 429 }
      )
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 })
  }

  const { email, password } = body as { email?: unknown; password?: unknown }

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  const admin = await prisma.admin.findUnique({ where: { email } })

  const passwordValid =
    admin !== null && (await bcrypt.compare(password, admin.passwordHash))

  if (!admin || !passwordValid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  const token = signAdminToken({ adminId: admin.id, email: admin.email })
  const response = NextResponse.json({ nombre: admin.nombre, email: admin.email })
  setAdminCookie(response, token)
  return response
}
