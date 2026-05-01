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
  LA_SILLA: {
    outerShell: "bg-white/5 ring-1 ring-white/5",
    gradient: "bg-gradient-to-br from-ocre-600/30 via-atacama-800 to-atacama-900",
    border: "border border-ocre-500/25",
    tag: "bg-ocre-400/10 text-ocre-300 border border-ocre-400/20",
    cta: "bg-ocre-400 text-atacama-950 hover:bg-ocre-300",
    glow: "rgba(212,153,58,0.08)",
    glowRadial: "rgba(184,112,32,0.15)",
    decorator: {
      text: "1969",
      className: "text-ocre-600/20",
    },
  },
  PARANAL: {
    outerShell: "bg-white/5 ring-1 ring-white/5",
    gradient: "bg-gradient-to-br from-cielo-500/15 via-atacama-800 to-atacama-950",
    border: "border border-cielo-400/20",
    tag: "bg-cielo-400/10 text-cielo-300 border border-cielo-400/20",
    cta: "bg-cielo-400 text-atacama-950 hover:bg-cielo-300",
    glow: "rgba(127,175,192,0.06)",
    glowRadial: "rgba(90,143,165,0.12)",
    decorator: {
      text: "VLT",
      className: "text-cielo-500/15",
    },
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
      className={cn(
        "rounded-3xl p-1",
        colors.outerShell
      )}
      style={{
        boxShadow: `0 0 80px ${colors.glow}`,
      }}
    >
      {/* Inner core */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(1.5rem-0.25rem)]",
          colors.gradient,
          colors.border,
          size === "large" ? "p-8 lg:p-10" : "p-6 lg:p-8"
        )}
      >
        {/* Glow radial background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${colors.glowRadial} 0%, transparent 65%)`,
          }}
        />

        {/* Decorator number / text — floating in upper right corner */}
        <span
          className={cn(
            "absolute top-4 right-5 text-6xl font-black select-none pointer-events-none leading-none font-playfair",
            colors.decorator.className
          )}
          aria-hidden="true"
        >
          {colors.decorator.text}
        </span>

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="mb-5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-3",
                colors.tag
              )}
            >
              <MapPin className="size-3" />
              {region}
            </span>
            <h3
              className={cn(
                "font-playfair font-black text-caliche-50 leading-tight",
                size === "large" ? "text-3xl lg:text-4xl" : "text-2xl"
              )}
            >
              {name}
            </h3>
          </div>

          {/* Description */}
          <p
            className={cn(
              "text-caliche-500 leading-relaxed mb-6",
              size === "large" ? "text-sm lg:text-base" : "text-sm"
            )}
          >
            {description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mb-8 text-xs text-caliche-700">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-caliche-700" />
              {schedule}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-caliche-700" />
              {minAge}
            </span>
          </div>

          {/* CTA */}
          <Link
            href={`/reservar/${slug}`}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
              colors.cta
            )}
          >
            {reserveLabel}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
