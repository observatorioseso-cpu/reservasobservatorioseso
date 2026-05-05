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
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "admin-login",
    })
    return ratelimit
  } catch {
    return null
  }
}

// Dummy hash para garantizar tiempo constante cuando el email no existe.
// Se computa en el primer request y se cachea.
let TIMING_DUMMY_HASH: string | null = null
async function getDummyHash(): Promise<string> {
  if (TIMING_DUMMY_HASH) return TIMING_DUMMY_HASH
  TIMING_DUMMY_HASH = await bcrypt.hash("__eso_admin_timing_sentinel__", 12)
  return TIMING_DUMMY_HASH
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"

  const rl = getRatelimit()
  if (rl) {
    const { success } = await rl.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente en 15 minutos." },
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

  // Siempre ejecutar bcrypt.compare para prevenir timing attacks de enumeración de emails.
  const hashToCompare = admin?.passwordHash ?? (await getDummyHash())
  const passwordMatch = await bcrypt.compare(password, hashToCompare)
  const passwordValid = admin !== null && passwordMatch

  if (!admin || !passwordValid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
  }

  const token = signAdminToken({ adminId: admin.id, email: admin.email })
  const response = NextResponse.json({ nombre: admin.nombre, email: admin.email })
  setAdminCookie(response, token)
  return response
}
