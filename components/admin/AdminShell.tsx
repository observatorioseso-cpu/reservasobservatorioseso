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
} from "lucide-react"

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/turnos",    label: "Turnos",      icon: CalendarDays },
  { href: "/admin/reservas",  label: "Reservas",    icon: Users },
  { href: "/admin/mensajes",  label: "Mensajes",    icon: MessageSquare },
  { href: "/admin/bloqueos",  label: "Cierres",     icon: CalendarOff },
  { href: "/admin/backup",    label: "Backup",      icon: HardDriveDownload },
  { href: "/admin/config",    label: "Config",      icon: Settings },
] as const

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/turnos":    "Gestión de Turnos",
  "/admin/reservas":  "Gestión de Reservas",
  "/admin/mensajes":  "Mensajes de Contacto",
  "/admin/bloqueos":  "Cierres y Alertas de Emergencia",
  "/admin/backup":    "Backup y Recuperación",
  "/admin/config":    "Configuración del Sistema",
}

function getPageTitle(pathname: string): string {
  // exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // partial match (nested routes)
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Trap scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
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
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-stone-800 px-5">
        <Telescope className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-tight text-stone-100">
          ESO&nbsp;
          <span className="text-amber-500">Admin</span>
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" role="list">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "border-l-2 border-amber-500 bg-amber-500/10 pl-[10px] text-amber-400"
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
      <div className="shrink-0 border-t border-stone-800 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-400 transition-colors duration-150 hover:bg-stone-800 hover:text-red-400 disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {loggingOut ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Desktop sidebar (static) ───────────────────────────────────── */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-stone-800 bg-stone-900 lg:flex"
        aria-label="Navegación del panel"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar drawer ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-stone-800 bg-stone-900">
            {/* Close button inside drawer */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Cerrar menú"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-stone-800 bg-stone-950/80 px-4 backdrop-blur-sm lg:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="rounded-md p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <h1 className="text-base font-semibold tracking-tight text-stone-100 lg:text-lg">
            {pageTitle}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
