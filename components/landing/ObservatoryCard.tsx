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

const accentColors = {
  PARANAL: {
    bg: "from-sky-950/80 to-stone-900",
    border: "border-sky-800/40",
    tag: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    cta: "bg-sky-400 text-stone-950 hover:bg-sky-300",
    glow: "rgba(125,211,252,0.08)",
  },
  LA_SILLA: {
    bg: "from-amber-950/60 to-stone-900",
    border: "border-amber-800/30",
    tag: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    cta: "bg-amber-500 text-stone-950 hover:bg-amber-400",
    glow: "rgba(245,158,11,0.06)",
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
  const colors = accentColors[slug]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={cn(
        "relative rounded-2xl border overflow-hidden",
        "bg-gradient-to-br",
        colors.bg,
        colors.border,
        size === "large" ? "p-8 lg:p-10" : "p-6 lg:p-8"
      )}
      style={{
        boxShadow: `0 0 60px ${colors.glow}`,
      }}
    >
      {/* Background subtle glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${colors.glow.replace("0.0", "0.2")} 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium mb-3", colors.tag)}>
              <MapPin className="size-3" />
              {region}
            </span>
            <h3 className={cn("font-playfair font-black text-stone-100 leading-tight", size === "large" ? "text-3xl lg:text-4xl" : "text-2xl")}>
              {name}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className={cn("text-stone-400 leading-relaxed mb-6", size === "large" ? "text-sm lg:text-base" : "text-sm")}>
          {description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mb-8 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-stone-600" />
            {schedule}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-stone-600" />
            {minAge}
          </span>
        </div>

        {/* CTA */}
        <Link
          href={`/reservar/${slug}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
            colors.cta
          )}
        >
          {reserveLabel}
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </motion.div>
  )
}
