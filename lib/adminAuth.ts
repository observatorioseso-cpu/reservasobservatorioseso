import { createHmac, timingSafeEqual } from "crypto"
import type { NextResponse } from "next/server"

const COOKIE_NAME = "eso_admin_session"
const EXPIRY_MS = 8 * 60 * 60 * 1000

function getSecret(): string {
  const s = process.env.ADMIN_SECRET_KEY
  if (!s) throw new Error("[adminAuth] ADMIN_SECRET_KEY no está configurado")
  return s
}

export function signAdminToken(payload: { adminId: string; email: string }): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + EXPIRY_MS })
  const payloadB64 = Buffer.from(data).toString("base64url")
  const mac = createHmac("sha256", getSecret()).update(payloadB64).digest("hex")
  return `${payloadB64}.${mac}`
}

export function verifyAdminToken(token: string): { adminId: string; email: string } | null {
  try {
    const [payloadB64, mac] = token.split(".")
    if (!payloadB64 || !mac) return null
    const expectedMac = createHmac("sha256", getSecret()).update(payloadB64).digest("hex")
    const macBuf = Buffer.from(mac, "hex")
    const expectedBuf = Buffer.from(expectedMac, "hex")
    if (macBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(macBuf, expectedBuf)) return null
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString())
    if (Date.now() > data.exp) return null
    return { adminId: data.adminId, email: data.email }
  } catch {
    return null
  }
}

export function setAdminCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: EXPIRY_MS / 1000,
  })
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
}

export async function getAdminFromRequest(
  request: Request
): Promise<{ adminId: string; email: string } | null> {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const cookieToken = parseCookie(cookieHeader, COOKIE_NAME)
  const headerToken = request.headers.get("x-admin-token")
  const token = cookieToken ?? headerToken
  if (!token) return null
  return verifyAdminToken(token)
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}
