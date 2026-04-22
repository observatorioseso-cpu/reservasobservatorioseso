"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/navigation"
import { Telescope, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface LandingNavProps {
  homeLabel: string
  myBookingLabel: string
  locale: string
}

export function LandingNav({ homeLabel: _, myBookingLabel, locale }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const altLocale = locale === "es" ? "en" : "es"

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-stone-950/90 backdrop-blur-md border-b border-stone-800/60"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Telescope className="size-5 text-amber-400 transition-transform group-hover:rotate-12" />
          <span className="font-playfair font-bold text-stone-200 text-sm tracking-tight">
            ESO Observatorios
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/mi-reserva"
            className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            {myBookingLabel}
          </Link>
          <Link
            href="/"
            locale={altLocale}
            className="text-xs font-medium uppercase tracking-widest text-stone-600 hover:text-stone-400 transition-colors"
          >
            {altLocale.toUpperCase()}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden p-2 text-stone-400"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sm:hidden bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-6 pb-4 pt-2"
          >
            <Link
              href="/mi-reserva"
              className="block py-2.5 text-sm text-stone-300"
              onClick={() => setOpen(false)}
            >
              {myBookingLabel}
            </Link>
            <Link
              href="/"
              locale={altLocale}
              className="block py-2.5 text-sm text-stone-500"
              onClick={() => setOpen(false)}
            >
              Cambiar a {altLocale.toUpperCase()}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
