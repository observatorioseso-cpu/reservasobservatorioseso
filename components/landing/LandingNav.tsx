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
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const altLocale = locale === "es" ? "en" : "es"

  return (
    <>
      {/* ── Floating pill wrapper ─────────────────────────────── */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

        {/* Pill */}
        <motion.header
          initial={false}
          animate={scrolled ? "scrolled" : "top"}
          variants={{
            top: {
              backgroundColor: "rgba(21, 14, 5, 0.50)",
              backdropFilter: "blur(12px)",
            },
            scrolled: {
              backgroundColor: "rgba(21, 14, 5, 0.92)",
              backdropFilter: "blur(24px) saturate(160%)",
            },
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "mx-auto w-max rounded-full px-5 py-2.5",
            "ring-1 transition-[box-shadow] duration-300",
            scrolled
              ? "ring-ocre-500/20 shadow-[0_4px_32px_rgba(13,8,4,0.6)]"
              : "ring-caliche-700/10"
          )}
        >
          <nav className="flex items-center gap-7">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" aria-label="ESO Observatorios — Inicio">
              {/* Ocre circle badge */}
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ocre-500/15 ring-1 ring-ocre-500/40 transition-all duration-300 group-hover:bg-ocre-500/25 group-hover:ring-ocre-400/60">
                <Telescope className="size-3.5 text-ocre-400 transition-transform duration-500 group-hover:rotate-12" />
              </span>
              <span className="font-playfair text-sm font-semibold text-caliche-100 tracking-tight leading-none">
                ESO Observatorios
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-5">
              <Link
                href="/mi-reserva"
                className="text-sm text-caliche-500 hover:text-caliche-200 transition-colors duration-200"
              >
                {myBookingLabel}
              </Link>

              {/* Language toggle */}
              <Link
                href="/"
                locale={altLocale}
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.18em]",
                  "text-caliche-700 hover:text-caliche-400 transition-colors duration-200",
                  "border border-caliche-700/40 hover:border-caliche-500/60",
                  "rounded-full px-2.5 py-0.5"
                )}
              >
                {altLocale.toUpperCase()}
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-1 text-caliche-500 hover:text-caliche-200 transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
            >
              <motion.div
                animate={{ rotate: open ? 90 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </motion.div>
            </button>
          </nav>
        </motion.header>

        {/* ── Mobile dropdown panel ─────────────────────────────── */}
        {/*    Rounded panel just below the pill, NOT full-screen    */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-panel"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "sm:hidden w-56 rounded-2xl overflow-hidden",
                "bg-atacama-900/95 backdrop-blur-xl",
                "ring-1 ring-caliche-700/20",
                "shadow-[0_8px_40px_rgba(13,8,4,0.7)]"
              )}
            >
              <div className="flex flex-col px-4 py-3 gap-1">
                <Link
                  href="/mi-reserva"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-caliche-300 hover:bg-atacama-800 hover:text-caliche-100 transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <Telescope className="size-3.5 text-ocre-500/70" />
                  {myBookingLabel}
                </Link>

                <div className="h-px bg-caliche-700/15 my-1" />

                <Link
                  href="/"
                  locale={altLocale}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-caliche-500 hover:bg-atacama-800 hover:text-caliche-300 transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] border border-caliche-700/40 rounded-full px-2 py-0.5">
                    {altLocale.toUpperCase()}
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}
