import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/adminAuth"

// Node.js runtime required for crypto (createHmac, timingSafeEqual) in adminAuth.
export const runtime = "nodejs"

const intlMiddleware = createMiddleware(routing)

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("eso_admin_session")?.value ?? null
    const session = token ? verifyAdminToken(token) : null

    if (pathname === "/admin") {
      return NextResponse.redirect(
        new URL(session ? "/admin/dashboard" : "/admin/login", request.url)
      )
    }

    if (pathname === "/admin/login" && session) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

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
