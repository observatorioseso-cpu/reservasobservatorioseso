"use client"

import { motion } from "framer-motion"
import { Sun, Sunset, Users, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Tema claro por observatorio
// ---------------------------------------------------------------------------

const CARD_THEME = {
  LA_SILLA: {
    idleRing: "ring-1 ring-tierra-500/15 bg-white",
    idleHover: "hover:ring-tierra-400/30 hover:shadow-sm",
    idleHora: "text-tinta-800",
    idleLabel: "text-tinta-400",
    idleIconBg: "bg-arena-100",
    idleIcon: "text-tierra-400",
    selectedRing: "ring-2 ring-tierra-600/40 bg-arena-100/70",
    selectedGlow: "shadow-[0_2px_16px_rgba(107,58,12,0.12)]",
    selectedHora: "text-tierra-700",
    selectedLabel: "text-tierra-500",
    selectedIconBg: "bg-tierra-100/80",
    selectedIcon: "text-tierra-600",
    checkIcon: "text-tierra-600",
    progressTrack: "bg-arena-200/80",
    progressSelected: "bg-tierra-500",
    progressHigh: "bg-red-400/70",
    progressIdle: "bg-cielo-400/50",
    cuposText: "text-tinta-500",
    ocupText: "text-tinta-300",
    agotadoRing: "ring-1 ring-stone-200 bg-stone-50",
    agotadoText: "text-stone-300",
    focusRing: "focus-visible:ring-tierra-500/40",
  },
  PARANAL: {
    idleRing: "ring-1 ring-cielo-500/15 bg-white",
    idleHover: "hover:ring-cielo-400/30 hover:shadow-sm",
    idleHora: "text-stone-800",
    idleLabel: "text-stone-400",
    idleIconBg: "bg-cielo-100/60",
    idleIcon: "text-cielo-500",
    selectedRing: "ring-2 ring-cielo-600/40 bg-cielo-100/50",
    selectedGlow: "shadow-[0_2px_16px_rgba(43,80,106,0.12)]",
    selectedHora: "text-cielo-700",
    selectedLabel: "text-cielo-500",
    selectedIconBg: "bg-cielo-100",
    selectedIcon: "text-cielo-600",
    checkIcon: "text-cielo-600",
    progressTrack: "bg-stone-100",
    progressSelected: "bg-cielo-500",
    progressHigh: "bg-red-400/70",
    progressIdle: "bg-cielo-300/60",
    cuposText: "text-stone-500",
    ocupText: "text-stone-300",
    agotadoRing: "ring-1 ring-stone-200 bg-stone-50",
    agotadoText: "text-stone-300",
    focusRing: "focus-visible:ring-cielo-500/40",
  },
} as const

interface TurnoCardProps {
  id: string
  horaInicio: string
  horaFin: string
  cuposLibres: number
  capacidadMax: number
  selected: boolean
  onSelect: (id: string) => void
  observatorio: "LA_SILLA" | "PARANAL"
}

export function TurnoCard({
  id,
  horaInicio,
  horaFin,
  cuposLibres,
  capacidadMax,
  selected,
  onSelect,
  observatorio,
}: TurnoCardProps) {
  const theme = CARD_THEME[observatorio]
  const isMañana = parseInt(horaInicio) < 12
  const agotado = cuposLibres === 0
  const ocupacion = Math.round(((capacidadMax - cuposLibres) / capacidadMax) * 100)

  return (
    <motion.button
      whileTap={{ scale: agotado ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => !agotado && onSelect(id)}
      disabled={agotado}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-xl p-5 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        theme.focusRing,
        agotado
          ? cn(theme.agotadoRing, "opacity-50 cursor-not-allowed")
          : selected
          ? cn(theme.selectedRing, theme.selectedGlow)
          : cn(theme.idleRing, theme.idleHover)
      )}
    >
      {/* Check seleccionado */}
      {selected && !agotado && (
        <CheckCircle2
          className={cn("absolute top-4 right-4 size-5", theme.checkIcon)}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3.5">
        {/* Icono turno */}
        <div
          className={cn(
            "rounded-lg p-2.5 shrink-0",
            agotado
              ? "bg-stone-100"
              : selected
              ? theme.selectedIconBg
              : theme.idleIconBg
          )}
        >
          {isMañana ? (
            <Sun
              className={cn(
                "size-5",
                agotado ? theme.agotadoText : selected ? theme.selectedIcon : theme.idleIcon
              )}
              aria-hidden="true"
            />
          ) : (
            <Sunset
              className={cn(
                "size-5",
                agotado ? theme.agotadoText : selected ? theme.selectedIcon : theme.idleIcon
              )}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold text-sm",
              agotado ? theme.agotadoText : selected ? theme.selectedHora : theme.idleHora
            )}
          >
            {horaInicio} – {horaFin}
          </p>
          <p
            className={cn(
              "text-xs mt-0.5",
              agotado ? theme.agotadoText : selected ? theme.selectedLabel : theme.idleLabel
            )}
          >
            {isMañana ? "Turno mañana" : "Turno tarde"}
          </p>
        </div>
      </div>

      {/* Cupos y barra */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              agotado ? theme.agotadoText : theme.cuposText
            )}
          >
            <Users className="size-3" aria-hidden="true" />
            {agotado ? "Sin cupos disponibles" : `${cuposLibres} cupos disponibles`}
          </span>
          <span className={cn("text-xs", theme.ocupText)}>
            {ocupacion}% ocupado
          </span>
        </div>
        <div className={cn("h-1.5 rounded-full overflow-hidden", theme.progressTrack)}>
          <div
            className={cn(
              "h-full rounded-full transition-all",
              ocupacion >= 80
                ? theme.progressHigh
                : selected
                ? theme.progressSelected
                : theme.progressIdle
            )}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
    </motion.button>
  )
}
