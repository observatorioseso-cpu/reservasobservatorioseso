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
    const token = request.cookies.get("eso_admin_session")?.value ?? null
    const session = token ? verifyAdminToken(token) : null

    // /admin (raíz) — siempre redirigir
    if (pathname === "/admin") {
      return NextResponse.redirect(
        new URL(session ? "/admin/dashboard" : "/admin/login", request.url)
      )
    }

    // /admin/login — si ya tiene sesión, ir al dashboard
    if (pathname === "/admin/login" && session) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // Rutas protegidas — requerir sesión
    if (pathname !== "/admin/login" && !session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
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
