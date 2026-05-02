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
    // Hero is ~100dvh — switch to light pill once past the photo section
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.72)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const altLocale = locale === "es" ? "en" : "es"

  return (
    <>
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">

        {/* ── Floating pill — dark on photo, cream on sand sections ── */}
        <motion.header
          initial={false}
          animate={scrolled ? "scrolled" : "top"}
          variants={{
            top: {
              backgroundColor: "rgba(26,18,5,0.62)",
              backdropFilter: "blur(16px) saturate(140%)",
            },
            scrolled: {
              backgroundColor: "rgba(253,250,242,0.94)",
              backdropFilter: "blur(24px) saturate(160%)",
            },
          }}
          transition={{ duration: 0.38, ease: "easeInOut" }}
          className={cn(
            "mx-auto w-max rounded-full px-5 py-2.5 ring-1 transition-[box-shadow] duration-300",
            scrolled
              ? "ring-tierra-500/20 shadow-[0_4px_24px_rgba(139,78,16,0.12)]"
              : "ring-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.45)]"
          )}
        >
          <nav className="flex items-center gap-7">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="ESO Observatorios — Inicio"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300",
                  scrolled
                    ? "bg-tierra-500/15 ring-tierra-600/40 group-hover:bg-tierra-500/25 group-hover:ring-tierra-500/60"
                    : "bg-white/10 ring-white/25 group-hover:bg-white/20 group-hover:ring-white/45"
                )}
              >
                <Telescope
                  className={cn(
                    "size-3.5 transition-transform duration-500 group-hover:rotate-12",
                    scrolled ? "text-tierra-700" : "text-white"
                  )}
                />
              </span>
              <span
                className={cn(
                  "font-playfair text-sm font-semibold tracking-tight leading-none transition-colors duration-300",
                  scrolled ? "text-tinta-900" : "text-white"
                )}
              >
                ESO Observatorios
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-5">
              <Link
                href="/mi-reserva"
                className={cn(
                  "text-sm transition-colors duration-200",
                  scrolled
                    ? "text-tinta-600 hover:text-tinta-900"
                    : "text-white/70 hover:text-white"
                )}
              >
                {myBookingLabel}
              </Link>

              {/* Language toggle */}
              <Link
                href="/"
                locale={altLocale}
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.18em] rounded-full px-2.5 py-0.5 transition-colors duration-200",
                  scrolled
                    ? "text-tinta-500 hover:text-tinta-800 border border-tinta-400/40 hover:border-tinta-500/60"
                    : "text-white/50 hover:text-white/90 border border-white/25 hover:border-white/50"
                )}
              >
                {altLocale.toUpperCase()}
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className={cn(
                "sm:hidden p-1 transition-colors",
                scrolled
                  ? "text-tinta-600 hover:text-tinta-900"
                  : "text-white/70 hover:text-white"
              )}
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

        {/* ── Mobile dropdown — always cream/sand ───────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-panel"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="sm:hidden w-56 rounded-2xl overflow-hidden bg-arena-50/96 backdrop-blur-xl ring-1 ring-tierra-600/15 shadow-[0_8px_40px_rgba(139,78,16,0.18)]"
            >
              <div className="flex flex-col px-4 py-3 gap-1">
                <Link
                  href="/mi-reserva"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-tinta-700 hover:bg-arena-200 hover:text-tinta-900 transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <Telescope className="size-3.5 text-tierra-600/70" />
                  {myBookingLabel}
                </Link>
                <div className="h-px bg-tierra-600/10 my-1" />
                <Link
                  href="/"
                  locale={altLocale}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-tinta-500 hover:bg-arena-200 hover:text-tinta-700 transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] border border-tinta-400/30 rounded-full px-2 py-0.5">
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
