"use client"

import { motion } from "framer-motion"
import { Sun, Sunset, Users, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TurnoCardProps {
  id: string
  horaInicio: string
  horaFin: string
  cuposLibres: number
  capacidadMax: number
  selected: boolean
  onSelect: (id: string) => void
}

export function TurnoCard({
  id,
  horaInicio,
  horaFin,
  cuposLibres,
  capacidadMax,
  selected,
  onSelect,
}: TurnoCardProps) {
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
        "relative w-full rounded-xl border p-5 text-left transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
        agotado
          ? "border-stone-800 bg-stone-900/40 opacity-50 cursor-not-allowed"
          : selected
          ? "border-amber-500/70 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
          : "border-stone-800 bg-stone-900 hover:border-stone-700 hover:bg-stone-800/80"
      )}
    >
      {/* Selected indicator */}
      {selected && !agotado && (
        <CheckCircle2 className="absolute top-4 right-4 size-5 text-amber-400" />
      )}

      <div className="flex items-start gap-4">
        {/* Icono turno */}
        <div className={cn(
          "rounded-lg p-2.5 shrink-0",
          selected ? "bg-amber-500/20" : "bg-stone-800"
        )}>
          {isMañana
            ? <Sun className={cn("size-5", selected ? "text-amber-400" : "text-stone-500")} />
            : <Sunset className={cn("size-5", selected ? "text-amber-400" : "text-stone-500")} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold text-sm",
            selected ? "text-amber-300" : agotado ? "text-stone-600" : "text-stone-200"
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
            className={cn(
              "h-full rounded-full transition-all",
              ocupacion >= 80 ? "bg-red-500/70" : selected ? "bg-amber-500" : "bg-sky-500/60"
            )}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
    </motion.button>
  )
}
