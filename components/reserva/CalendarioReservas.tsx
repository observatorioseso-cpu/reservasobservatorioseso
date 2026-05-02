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

// ---------------------------------------------------------------------------
// Tema claro por observatorio
// La Silla: paleta cálida arena/tierra (crema, ocre, marrón dorado)
// Paranal:  paleta fría stone/cielo (blanco neutro, azul cielo, tinta oscura)
// ---------------------------------------------------------------------------

const OBS_THEME = {
  LA_SILLA: {
    // Tarjeta del calendario
    cardBg: "bg-white",
    cardRing: "ring-1 ring-tierra-500/15 shadow-sm",
    // Navegación del mes
    monthText: "text-tinta-900",
    monthBtn: [
      "text-tinta-500 hover:text-tierra-700 hover:bg-arena-100",
      "focus-visible:ring-tierra-500/40",
    ].join(" "),
    // Cabecera días semana
    weekday: "text-tinta-300",
    // Días normales con cupos
    dayText: "text-tinta-700",
    dayHover: "hover:bg-arena-100 hover:text-tierra-700",
    // Día seleccionado
    daySelected:
      "bg-tierra-600 text-arena-50 font-semibold shadow-[0_2px_8px_rgba(107,58,12,0.30)]",
    // Días sin turno o pasados
    dayDisabled: "text-tinta-200 cursor-not-allowed",
    // Días agotados
    dayAgotado: "text-tinta-300 cursor-not-allowed",
    // Dots de disponibilidad
    dotAvailable: "bg-tierra-500",
    dotAgotado: "bg-red-400/70",
    // Focus ring en días
    dayRing: "focus-visible:ring-tierra-500/40",
    // Panel vacío / sin turnos
    panelBg: "bg-arena-50 ring-1 ring-tierra-500/12",
    panelEmpty: "text-tinta-400",
    panelIcon: "text-tierra-400",
    panelTitle: "text-tierra-600",
    // Error
    errorBorder: "border-red-300/60",
    errorBg: "bg-red-50",
    errorText: "text-red-600",
    // Leyenda
    legend: "text-tinta-300",
    // CTA
    cta: "bg-tierra-700 hover:bg-tierra-600 text-arena-50 focus-visible:ring-tierra-600/40",
  },
  PARANAL: {
    // Tarjeta del calendario
    cardBg: "bg-white",
    cardRing: "ring-1 ring-cielo-500/15 shadow-sm",
    // Navegación del mes
    monthText: "text-stone-900",
    monthBtn: [
      "text-stone-500 hover:text-cielo-700 hover:bg-cielo-100/60",
      "focus-visible:ring-cielo-500/40",
    ].join(" "),
    // Cabecera días semana
    weekday: "text-stone-300",
    // Días normales con cupos
    dayText: "text-stone-700",
    dayHover: "hover:bg-cielo-100/50 hover:text-cielo-700",
    // Día seleccionado
    daySelected:
      "bg-cielo-700 text-white font-semibold shadow-[0_2px_8px_rgba(43,80,106,0.30)]",
    // Días sin turno o pasados
    dayDisabled: "text-stone-200 cursor-not-allowed",
    // Días agotados
    dayAgotado: "text-stone-300 cursor-not-allowed",
    // Dots de disponibilidad
    dotAvailable: "bg-cielo-500",
    dotAgotado: "bg-red-400/70",
    // Focus ring en días
    dayRing: "focus-visible:ring-cielo-500/40",
    // Panel vacío / sin turnos
    panelBg: "bg-stone-50 ring-1 ring-cielo-500/12",
    panelEmpty: "text-stone-400",
    panelIcon: "text-cielo-500",
    panelTitle: "text-cielo-600",
    // Error
    errorBorder: "border-red-300/60",
    errorBg: "bg-red-50",
    errorText: "text-red-600",
    // Leyenda
    legend: "text-stone-300",
    // CTA (mismo que ObservatoryCard Paranal en landing)
    cta: "bg-tinta-800 hover:bg-tinta-700 text-arena-50 focus-visible:ring-tinta-700/40",
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
  // Produce YYYY-MM-DD en zona local (no UTC) para coincidir con la key del calendario
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
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

  const fetchDisponibilidad = useCallback(
    async (year: number, month: number) => {
      setLoading(true)
      setError(null)
      try {
        const mes = `${year}-${String(month + 1).padStart(2, "0")}`
        const res = await fetch(
          `/api/disponibilidad?observatorio=${observatorio}&mes=${mes}`
        )
        if (!res.ok) throw new Error("Error al cargar disponibilidad")
        const data = await res.json()
        setDisponibilidad((prev) => ({ ...prev, ...data }))
      } catch {
        setError("No se pudo cargar la disponibilidad. Intenta de nuevo.")
      } finally {
        setLoading(false)
      }
    },
    [observatorio]
  )

  useEffect(() => {
    fetchDisponibilidad(viewYear, viewMonth)
  }, [viewYear, viewMonth, fetchDisponibilidad])

  const prevMonth = () => {
    setSelectedDate(null)
    setSelectedTurnoId(null)
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    setSelectedDate(null)
    setSelectedTurnoId(null)
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
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

  const todayISO = toISODate(today)
  const turnosDelDia = selectedDate ? (disponibilidad[selectedDate] ?? []) : []
  const mesActual = `${MESES_ES[viewMonth]} ${viewYear}`

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

      {/* ── Calendario ── */}
      <div className={cn("rounded-2xl p-5 sm:p-6", theme.cardBg, theme.cardRing)}>

        {/* Navegación mes */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className={cn(
              "rounded-lg p-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2",
              theme.monthBtn
            )}
            aria-label={labels.mesAnterior}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          <div className="text-center">
            <p
              className={cn("font-playfair font-bold text-lg", theme.monthText)}
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
              "rounded-lg p-2 transition-colors",
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
            className={cn(
              "mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
              theme.errorBorder,
              theme.errorBg,
              theme.errorText
            )}
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Cabecera días de semana */}
        <div className="grid grid-cols-7 mb-1" aria-hidden="true">
          {DIAS_SEMANA_ES.map((d) => (
            <div
              key={d}
              className={cn("py-2 text-center text-[11px] font-semibold uppercase tracking-wider", theme.weekday)}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={mesActual}>
          {blancos.map((_, i) => (
            <div key={`b-${i}`} role="gridcell" aria-hidden="true" />
          ))}

          {dias.map((dia) => {
            const iso = toISODate(dia)
            const turnos = disponibilidad[iso]
            const esPasado = iso < todayISO
            const tieneCupos = turnos?.some((t) => t.cuposLibres > 0)
            const sinCupos = turnos && !tieneCupos
            const sinTurno = !turnos
            const isSelected = selectedDate === iso
            const isToday = iso === todayISO
            const isDisabled = esPasado || sinTurno || !!sinCupos

            return (
              <motion.button
                key={iso}
                role="gridcell"
                whileTap={{ scale: isDisabled ? 1 : 0.88 }}
                onClick={() => !isDisabled && tieneCupos && handleSelectDate(iso)}
                disabled={isDisabled}
                className={cn(
                  "relative aspect-square rounded-lg text-sm transition-all duration-100",
                  "focus-visible:outline-none focus-visible:ring-2",
                  theme.dayRing,
                  isSelected
                    ? theme.daySelected
                    : esPasado || sinTurno
                    ? theme.dayDisabled
                    : sinCupos
                    ? theme.dayAgotado
                    : cn(theme.dayText, theme.dayHover),
                  // Hoy: subrayado sutil si no está seleccionado
                  isToday && !isSelected && "underline decoration-dotted underline-offset-2"
                )}
                aria-label={`${dia.getDate()} de ${MESES_ES[dia.getMonth()]}${isToday ? ", hoy" : ""}`}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
              >
                {dia.getDate()}

                {/* Dot disponible */}
                {tieneCupos && !isSelected && (
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full",
                      theme.dotAvailable
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Dot agotado */}
                {sinCupos && (
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full",
                      theme.dotAgotado
                    )}
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Leyenda */}
        <div
          className={cn("mt-4 flex items-center gap-5 text-xs", theme.legend)}
          aria-hidden="true"
        >
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

      {/* ── Panel de turnos ── */}
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
                  "rounded-2xl p-8 text-center flex flex-col items-center gap-3",
                  theme.panelBg
                )}
              >
                <Telescope
                  className={cn("size-8 opacity-25", theme.panelIcon)}
                  aria-hidden="true"
                />
                <p className={cn("text-sm leading-relaxed", theme.panelEmpty)}>
                  {labels.seleccionaFecha}
                </p>
              </motion.div>
            ) : turnosDelDia.length === 0 ? (
              <motion.div
                key="noTurnos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "rounded-2xl p-8 text-center",
                  theme.panelBg
                )}
              >
                <p className={cn("text-sm", theme.panelEmpty)}>
                  {labels.sinTurnosDisponibles}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-widest",
                    theme.panelTitle
                  )}
                >
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

        {/* CTA continuar */}
        {selectedTurnoId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <button
              onClick={handleContinuar}
              className={cn(
                "w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2",
                theme.cta
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
