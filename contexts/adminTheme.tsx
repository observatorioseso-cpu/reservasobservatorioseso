"use client"

import { createContext, useContext, useState, useEffect } from "react"

export type AdminTheme = "dark" | "light"

interface AdminThemeCtx {
  theme: AdminTheme
  toggle: () => void
}

const Ctx = createContext<AdminThemeCtx>({ theme: "dark", toggle: () => {} })

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as AdminTheme | null
    if (stored === "light" || stored === "dark") setTheme(stored)
    setMounted(true)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      localStorage.setItem("admin-theme", next)
      return next
    })
  }

  if (!mounted) {
    return (
      <div data-admin-theme="light" className="contents">
        {children}
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme} className="contents">
        {children}
      </div>
    </Ctx.Provider>
  )
}

export const useAdminTheme = () => useContext(Ctx)
