import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/adminAuth"

// Forzar Node.js runtime en el middleware para poder usar
// crypto de Node.js (createHmac, timingSafeEqual) en adminAuth.
export const runtime = "nodejs"

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const isPublic = pathname === "/admin" || pathname === "/admin/login"
    const token = request.cookies.get("eso_admin_session")?.value ?? null
    const session = token ? verifyAdminToken(token) : null

    if (!isPublic && !session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    if (isPublic && session) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/",
  ],
}
