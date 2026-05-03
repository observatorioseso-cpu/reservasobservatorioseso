"use client"

import { motion } from "framer-motion"
import { Link } from "@/i18n/navigation"
import { MapPin, Clock, Users, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ObservatoryCardProps {
  slug: "PARANAL" | "LA_SILLA"
  name: string
  region: string
  size: "large" | "small"
  reserveLabel: string
  description: string
  schedule: string
  minAge: string
}

const cardConfig = {
  LA_SILLA: {
    photo: "/images/lasilla-eclipse.jpg",
    photoAlt: "Eclipse solar total sobre el Observatorio La Silla, Región de Coquimbo, Chile",
    year: "HARPS",
    // Warm earth gradient for La Silla (ochre/brown tones of the Atacama terrain)
    photoOverlay:
      "linear-gradient(to top, rgba(107,58,12,0.85) 0%, rgba(74,40,8,0.40) 55%, transparent 100%)",
    tagClass:
      "bg-tierra-500/15 text-tierra-700 border border-tierra-400/30",
    ctaClass:
      "bg-tierra-700 text-arena-50 hover:bg-tierra-600 active:scale-[0.97]",
    fallbackGradient:
      "bg-gradient-to-br from-tierra-700 via-tierra-800 to-tinta-900",
  },
  PARANAL: {
    photo: "/images/paranal-dusk.jpg",
    photoAlt:
      "Los cuatro telescopios VLT del Observatorio Paranal al atardecer del desierto de Atacama",
    year: "VLT",
    // Cool dusk gradient for Paranal (sky-blue/navy of the Atacama twilight)
    photoOverlay:
      "linear-gradient(to top, rgba(30,58,79,0.88) 0%, rgba(21,42,58,0.40) 55%, transparent 100%)",
    tagClass:
      "bg-cielo-500/15 text-cielo-700 border border-cielo-400/30",
    ctaClass:
      "bg-tinta-800 text-arena-50 hover:bg-tinta-700 active:scale-[0.97]",
    fallbackGradient:
      "bg-gradient-to-br from-cielo-800 via-tinta-800 to-tinta-900",
  },
}

export function ObservatoryCard({
  slug,
  name,
  region,
  size,
  reserveLabel,
  description,
  schedule,
  minAge,
}: ObservatoryCardProps) {
  const cfg = cardConfig[slug]

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 55, damping: 18 }}
      className="relative rounded-3xl overflow-hidden bg-white shadow-[0_8px_48px_rgba(26,18,5,0.10)] ring-1 ring-tierra-500/10 flex flex-col"
    >
      {/* Full-card link — accessible, keyboard-navigable */}
      <Link
        href={`/reservar/${slug}`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-tierra-500/60"
        aria-label={`${name} — ${reserveLabel}`}
      />
      {/* ── Photo header ──────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden shrink-0",
          size === "large" ? "h-64 lg:h-72" : "h-52"
        )}
      >
        {/* Real observatory photo */}
        <img
          src={cfg.photo}
          alt={cfg.photoAlt}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />

        {/* Gradient overlay — ensures heading legibility */}
        <div
          className="absolute inset-0"
          style={{ background: cfg.photoOverlay }}
        />

        {/* Observatory name over photo */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 z-10">
          <h3
            className={cn(
              "font-playfair font-black text-white leading-none drop-shadow-md",
              size === "large" ? "text-3xl lg:text-4xl" : "text-2xl"
            )}
          >
            {name}
          </h3>
        </div>

        {/* Year badge — top right, ghosted */}
        <span
          className="absolute top-4 right-4 font-playfair font-black text-white/20 leading-none select-none pointer-events-none z-10"
          style={{ fontSize: size === "large" ? "4rem" : "3rem" }}
          aria-hidden="true"
        >
          {cfg.year}
        </span>
      </div>

      {/* ── Info body ─────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col flex-1",
          size === "large" ? "p-7 lg:p-8" : "p-6"
        )}
      >
        {/* Region tag */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4 w-fit",
            cfg.tagClass
          )}
        >
          <MapPin className="size-3" />
          {region}
        </span>

        {/* Description */}
        <p className="text-tinta-600 text-sm leading-relaxed flex-1 mb-6">
          {description}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-tinta-400 border-t border-tierra-500/10 pt-4">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-tierra-400" />
            {schedule}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-tierra-400" />
            {minAge}
          </span>
        </div>

        {/* CTA — visual only; the overlay link above handles navigation */}
        <div
          aria-hidden="true"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold",
            cfg.ctaClass
          )}
        >
          {reserveLabel}
          <ChevronRight className="size-4" />
        </div>
      </div>
    </motion.div>
  )
}
