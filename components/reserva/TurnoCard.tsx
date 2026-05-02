"use client"

import { motion } from "framer-motion"
import { Sun, Sunset, Users, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CARD_THEME = {
  LA_SILLA: {
    selectedBorder: "border-tierra-500/70",
    selectedBg: "bg-tierra-900/30",
    selectedGlow: "shadow-[0_0_20px_rgba(184,112,32,0.15)]",
    selectedIcon: "text-tierra-400",
    iconBg: "bg-tierra-900/60",
    idleBorder: "border-stone-800",
    idleBg: "bg-stone-900",
    horaText: "text-tierra-300",
    checkIcon: "text-tierra-400",
  },
  PARANAL: {
    selectedBorder: "border-cielo-500/70",
    selectedBg: "bg-cielo-900/30",
    selectedGlow: "shadow-[0_0_20px_rgba(63,110,133,0.20)]",
    selectedIcon: "text-cielo-400",
    iconBg: "bg-cielo-900/50",
    idleBorder: "border-stone-800",
    idleBg: "bg-stone-900",
    horaText: "text-cielo-300",
    checkIcon: "text-cielo-400",
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

  const progressColor = ocupacion >= 80
    ? "bg-red-500/70"
    : selected
    ? observatorio === "LA_SILLA"
      ? "bg-tierra-500"
      : "bg-cielo-500"
    : "bg-sky-500/60"

  return (
    <motion.button
      whileTap={{ scale: agotado ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => !agotado && onSelect(id)}
      disabled={agotado}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-xl border p-5 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        observatorio === "LA_SILLA"
          ? "focus-visible:ring-tierra-600/50"
          : "focus-visible:ring-cielo-600/50",
        agotado
          ? "border-stone-800 bg-stone-900/40 opacity-50 cursor-not-allowed"
          : selected
          ? cn(theme.selectedBorder, theme.selectedBg, theme.selectedGlow)
          : cn(theme.idleBorder, theme.idleBg, "hover:border-stone-700 hover:bg-stone-800/80")
      )}
    >
      {/* Selected indicator */}
      {selected && !agotado && (
        <CheckCircle2 className={cn("absolute top-4 right-4 size-5", theme.checkIcon)} />
      )}

      <div className="flex items-start gap-4">
        {/* Icono turno */}
        <div className={cn(
          "rounded-lg p-2.5 shrink-0",
          selected ? theme.iconBg : "bg-stone-800"
        )}>
          {isMañana
            ? <Sun className={cn("size-5", selected ? theme.selectedIcon : "text-stone-500")} />
            : <Sunset className={cn("size-5", selected ? theme.selectedIcon : "text-stone-500")} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-sm",
            selected ? theme.horaText : agotado ? "text-stone-600" : "text-stone-200"
          )}>
            {horaInicio} – {horaFin}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {isMañana ? "Turno mañana" : "Turno tarde"}
          </p>
        </div>
      </div>

      {/* Cupos */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1 text-xs text-stone-500">
            <Users className="size-3" />
            {agotado ? "Sin cupos" : `${cuposLibres} cupos libres`}
          </span>
          <span className="text-xs text-stone-600">{ocupacion}% ocupado</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-stone-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
    </motion.button>
  )
}
