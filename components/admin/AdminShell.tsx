"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Telescope,
  MessageSquare,
  CalendarOff,
  HardDriveDownload,
  BarChart2,
  Sun,
  Moon,
} from "lucide-react"
import { useAdminTheme } from "@/contexts/adminTheme"
import { AdminChatWidget } from "@/components/admin/AdminChatWidget"

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/turnos",    label: "Turnos",      icon: CalendarDays },
  { href: "/admin/reservas",  label: "Reservas",    icon: Users },
  { href: "/admin/reportes",  label: "Reportes",    icon: BarChart2 },
  { href: "/admin/mensajes",  label: "Mensajes",    icon: MessageSquare },
  { href: "/admin/bloqueos",  label: "Cierres",     icon: CalendarOff },
  { href: "/admin/backup",    label: "Backup",      icon: HardDriveDownload },
  { href: "/admin/config",    label: "Config",      icon: Settings },
] as const

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/turnos":    "Gestión de Turnos",
  "/admin/reservas":  "Gestión de Reservas",
  "/admin/reportes":  "Reportes Operacionales",
  "/admin/mensajes":  "Mensajes de Contacto",
  "/admin/bloqueos":  "Cierres y Alertas de Emergencia",
  "/admin/backup":    "Backup y Recuperación",
  "/admin/config":    "Configuración del Sistema",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + "/")) return title
  }
  return "Panel Admin"
}

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useAdminTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)
  const isLight = theme === "light"

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } finally {
      router.push("/admin/login")
    }
  }

  const pageTitle = getPageTitle(pathname)

  const SidebarContent = () => (
    <nav className="flex h-full flex-col">
      {/* Logo / brand */}
      <div className={[
        "flex h-16 shrink-0 items-center gap-3 px-5",
        isLight ? "border-b border-[#e0c8b8]" : "border-b border-stone-800",
      ].join(" ")}>
        <Telescope className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
        <span className={["text-sm font-semibold tracking-tight", isLight ? "text-tinta-800" : "text-stone-100"].join(" ")}>
          ESO&nbsp;
          <span className="text-amber-500">Admin</span>
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" role="list">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? isLight
                      ? "border-l-2 border-amber-500 bg-[#e8f0e4] pl-[10px] text-tierra-700"
                      : "border-l-2 border-amber-500 bg-amber-500/10 pl-[10px] text-amber-400"
                    : isLight
                      ? "text-tinta-600 hover:bg-[#ede0c8] hover:text-tinta-900"
                      : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Logout */}
      <div className={[
        "shrink-0 px-3 py-4",
        isLight ? "border-t border-[#e0c8b8]" : "border-t border-stone-800",
      ].join(" ")}>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
            isLight
              ? "text-tinta-500 hover:bg-[#ede0c8] hover:text-red-600"
              : "text-stone-400 hover:bg-stone-800 hover:text-red-400",
          ].join(" ")}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {loggingOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </nav>
  )

  const sidebarClass = isLight
    ? "hidden w-64 shrink-0 flex-col border-r border-[#e0c8b8] lg:flex admin-sidebar-monet"
    : "hidden w-64 shrink-0 flex-col border-r border-stone-800 bg-stone-900 lg:flex"

  const headerClass = isLight
    ? "flex h-16 shrink-0 items-center gap-4 border-b border-[#e0c8b8] bg-[#fdfaf2]/90 px-4 backdrop-blur-sm lg:px-6"
    : "flex h-16 shrink-0 items-center gap-4 border-b border-stone-800 bg-stone-950/80 px-4 backdrop-blur-sm lg:px-6"

  const mainClass = isLight
    ? "flex min-h-[100dvh] bg-[#fdfaf2]"
    : "flex min-h-[100dvh] bg-stone-950"

  return (
    <div className={mainClass}>
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className={sidebarClass} aria-label="Navegación del panel">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar drawer ─────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div
            className={["absolute inset-0 backdrop-blur-sm", isLight ? "bg-tinta-900/30" : "bg-stone-950/80"].join(" ")}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className={[
            "absolute inset-y-0 left-0 flex w-64 flex-col border-r",
            isLight ? "border-[#e0c8b8] admin-sidebar-monet" : "border-stone-800 bg-stone-900",
          ].join(" ")}>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={[
                "absolute right-3 top-3 rounded-md p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                isLight ? "text-tinta-500 hover:bg-[#ede0c8] hover:text-tinta-900" : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
              ].join(" ")}
              aria-label="Cerrar menú"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className={headerClass}>
          <button
            type="button"
            className={[
              "rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:hidden",
              isLight ? "text-tinta-500 hover:bg-[#ede0c8] hover:text-tinta-900" : "text-stone-400 hover:bg-stone-800 hover:text-stone-100",
            ].join(" ")}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <h1 className={["text-base font-semibold tracking-tight lg:text-lg", isLight ? "text-tinta-900" : "text-stone-100"].join(" ")}>
            {pageTitle}
          </h1>

          {/* Theme toggle */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggle}
              title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              className={[
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300",
                isLight
                  ? "border border-[#d4b896] bg-[#f5edd8] text-tinta-600 hover:bg-[#ede0c4] hover:text-tinta-800"
                  : "border border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-amber-400",
              ].join(" ")}
            >
              {isLight ? (
                <>
                  <Moon className="size-3.5" aria-hidden="true" />
                  <span>Oscuro</span>
                </>
              ) : (
                <>
                  <Sun className="size-3.5" aria-hidden="true" />
                  <span>Claro</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className={["flex-1 px-4 py-6 lg:px-6 lg:py-8", isLight ? "text-tinta-900" : ""].join(" ")}>
          {children}
        </main>
      </div>

      <AdminChatWidget />
    </div>
  )
}
