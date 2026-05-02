"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, AlertCircle, Telescope } from "lucide-react"
import { TurnoCard } from "./TurnoCard"
import { Spinner } from "@/components/ui/Spinner"
import { cn } from "@/lib/utils"

interface TurnoDisponible {
  id: string
  horaInicio: string
  horaFin: string
  capacidadMax: number
  cuposOcupados: number
  cuposLibres: number
  disponible: boolean
}

interface DisponibilidadPorFecha {
  [fecha: string]: TurnoDisponible[]
}

export interface CalendarioLabels {
  next: string
  seleccionaFecha: string
  sinTurnosDisponibles: string
  turnosDisponibles: string
  conCupos: string
  agotado: string
  mesAnterior: string
  mesSiguiente: string
}

interface CalendarioReservasProps {
  observatorio: "LA_SILLA" | "PARANAL"
  labels: CalendarioLabels
}

const OBS_THEME = {
  LA_SILLA: {
    surface: "bg-tinta-900/50",
    border: "border-tierra-800/30",
    monthBtn: "hover:bg-tierra-900/50 hover:text-tierra-300 focus-visible:ring-tierra-600/50",
    monthText: "text-tierra-400",
    daySelected: "bg-tierra-500 text-arena-50 font-semibold shadow-[0_0_12px_rgba(184,112,32,0.5)]",
    dayHover: "hover:bg-tierra-900/40 hover:text-tierra-200",
    dayText: "text-stone-300",
    dotAvailable: "bg-tierra-400",
    dotAgotado: "bg-red-800/70",
    emptyState: "text-stone-500",
    ctaBtn: "bg-tierra-600 hover:bg-tierra-500 text-arena-50 focus-visible:ring-tierra-500/60",
    legend: "text-stone-500",
    turnoLabel: "text-stone-400",
    panelTitle: "text-tierra-400",
  },
  PARANAL: {
    surface: "bg-cielo-800/15",
    border: "border-cielo-800/30",
    monthBtn: "hover:bg-cielo-900/50 hover:text-cielo-300 focus-visible:ring-cielo-600/50",
    monthText: "text-cielo-400",
    daySelected: "bg-cielo-600 text-white font-semibold shadow-[0_0_12px_rgba(61,110,133,0.6)]",
    dayHover: "hover:bg-cielo-900/40 hover:text-cielo-200",
    dayText: "text-stone-300",
    dotAvailable: "bg-cielo-400",
    dotAgotado: "bg-red-800/70",
    emptyState: "text-stone-500",
    ctaBtn: "bg-cielo-700 hover:bg-cielo-600 text-white focus-visible:ring-cielo-500/60",
    legend: "text-stone-500",
    turnoLabel: "text-stone-400",
    panelTitle: "text-cielo-400",
  },
} as const

const DIAS_SEMANA_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"]
const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function getDiasDelMes(year: number, month: number): Date[] {
  const dias: Date[] = []
  const total = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= total; d++) {
    dias.push(new Date(year, month, d))
  }
  return dias
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0]
}

export function CalendarioReservas({ observatorio, labels }: CalendarioReservasProps) {
  const router = useRouter()
  const theme = OBS_THEME[observatorio]

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null)

  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadPorFecha>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDisponibilidad = useCallback(async (year: number, month: number) => {
    setLoading(true)
    setError(null)
    try {
      const mes = `${year}-${String(month + 1).padStart(2, "0")}`
      const res = await fetch(`/api/disponibilidad?observatorio=${observatorio}&mes=${mes}`)
      if (!res.ok) throw new Error("Error al cargar disponibilidad")
      const data = await res.json()
      setDisponibilidad((prev) => ({ ...prev, ...data }))
    } catch {
      setError("No se pudo cargar la disponibilidad. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }, [observatorio])

  useEffect(() => {
    fetchDisponibilidad(viewYear, viewMonth)
  }, [viewYear, viewMonth, fetchDisponibilidad])

  const prevMonth = () => {
    setSelectedDate(null)
    setSelectedTurnoId(null)
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  const nextMonth = () => {
    setSelectedDate(null)
    setSelectedTurnoId(null)
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const dias = getDiasDelMes(viewYear, viewMonth)
  const primerDia = new Date(viewYear, viewMonth, 1).getDay()
  const blancos = Array.from({ length: primerDia })

  const handleSelectDate = (fecha: string) => {
    setSelectedDate(fecha)
    setSelectedTurnoId(null)
  }

  const handleContinuar = () => {
    if (!selectedDate || !selectedTurnoId) return
    router.push(
      `/reservar/${observatorio.toLowerCase().replace("_", "-")}/registro?turnoId=${selectedTurnoId}&fecha=${selectedDate}`
    )
  }

  const turnosDelDia = selectedDate ? (disponibilidad[selectedDate] ?? []) : []
  const mesActual = `${MESES_ES[viewMonth]} ${viewYear}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* Calendario */}
      <div className={cn("rounded-2xl border p-6", theme.surface, theme.border)}>
        {/* Header mes */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className={cn(
              "rounded-lg p-2 text-stone-400 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2",
              theme.monthBtn
            )}
            aria-label={labels.mesAnterior}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <div className="text-center min-w-0">
            <p
              className={cn("font-playfair font-bold text-stone-100")}
              aria-live="polite"
              aria-atomic="true"
            >
              {mesActual}
            </p>
            {loading && <Spinner size="sm" className="mx-auto mt-1" />}
          </div>
          <button
            onClick={nextMonth}
            className={cn(
              "rounded-lg p-2 text-stone-400 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2",
              theme.monthBtn
            )}
            aria-label={labels.mesSiguiente}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Dias semana */}
        <div className="grid grid-cols-7 mb-2" aria-hidden="true">
          {DIAS_SEMANA_ES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-stone-600">
              {d}
            </div>
          ))}
        </div>

        {/* Grid dias */}
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={mesActual}>
          {blancos.map((_, i) => <div key={`b-${i}`} role="gridcell" />)}
          {dias.map((dia) => {
            const iso = toISODate(dia)
            const turnos = disponibilidad[iso]
            const esPasado = dia < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const tieneCupos = turnos?.some((t) => t.cuposLibres > 0)
            const sinCupos = turnos && !tieneCupos
            const isSelected = selectedDate === iso
            const sinTurno = !turnos

            return (
              <motion.button
                key={iso}
                role="gridcell"
                whileTap={{ scale: esPasado || sinCupos || sinTurno ? 1 : 0.88 }}
                onClick={() => !esPasado && turnos && tieneCupos && handleSelectDate(iso)}
                disabled={esPasado || !turnos || !!sinCupos}
                className={cn(
                  "relative aspect-square rounded-lg text-sm transition-all duration-100",
                  "focus-visible:outline-none focus-visible:ring-2",
                  observatorio === "LA_SILLA"
                    ? "focus-visible:ring-tierra-600/50"
                    : "focus-visible:ring-cielo-600/50",
                  esPasado || sinTurno || sinCupos
                    ? "text-stone-700 cursor-not-allowed"
                    : isSelected
                    ? theme.daySelected
                    : cn(theme.dayText, theme.dayHover)
                )}
                aria-label={`${dia.getDate()} de ${MESES_ES[dia.getMonth()]}`}
                aria-pressed={isSelected}
                aria-disabled={esPasado || !turnos || !!sinCupos}
              >
                {dia.getDate()}
                {/* Indicador de disponibilidad */}
                {tieneCupos && !isSelected && (
                  <span
                    className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full", theme.dotAvailable)}
                    aria-hidden="true"
                  />
                )}
                {sinCupos && (
                  <span
                    className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full", theme.dotAgotado)}
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className={cn("mt-4 flex items-center gap-5 text-xs", theme.legend)} aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", theme.dotAvailable)} />
            {labels.conCupos}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", theme.dotAgotado)} />
            {labels.agotado}
          </span>
        </div>
      </div>

      {/* Panel de turnos */}
      <div className="flex flex-col gap-4">
        <div aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            {!selectedDate ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "rounded-2xl border p-8 text-center flex flex-col items-center gap-3",
                  theme.border,
                  theme.surface
                )}
              >
                <Telescope className={cn("size-8 opacity-30", theme.panelTitle)} aria-hidden="true" />
                <p className={cn("text-sm", theme.emptyState)}>{labels.seleccionaFecha}</p>
              </motion.div>
            ) : turnosDelDia.length === 0 ? (
              <motion.div
                key="noTurnos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "rounded-2xl border p-8 text-center",
                  theme.border,
                  theme.surface
                )}
              >
                <p className={cn("text-sm", theme.emptyState)}>{labels.sinTurnosDisponibles}</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <p className={cn("text-xs font-medium uppercase tracking-widest", theme.panelTitle)}>
                  {labels.turnosDisponibles}
                </p>
                {turnosDelDia.map((turno) => (
                  <TurnoCard
                    key={turno.id}
                    id={turno.id}
                    horaInicio={turno.horaInicio}
                    horaFin={turno.horaFin}
                    cuposLibres={turno.cuposLibres}
                    capacidadMax={turno.capacidadMax}
                    selected={selectedTurnoId === turno.id}
                    onSelect={setSelectedTurnoId}
                    observatorio={observatorio}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        {selectedTurnoId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <button
              onClick={handleContinuar}
              className={cn(
                "w-full rounded-full px-6 py-3 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                theme.ctaBtn
              )}
            >
              {labels.next}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
