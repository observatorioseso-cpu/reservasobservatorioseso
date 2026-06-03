"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  CalendarDays,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Observatorio = "LA_SILLA" | "PARANAL"

interface TurnoResumen {
  id: string
  observatorio: Observatorio
  horaInicio: string
  horaFin: string
  tipo: "REGULAR" | "NOCTURNA"
  activo: boolean
  capacidadMax: number
  cuposOcupados: number
  cuposLibres: number
  numReservas: number
  numPersonas: number
}

interface CalendarioResponse {
  year: number
  month: number
  dias: Record<string, TurnoResumen[]>
}

interface ReservaDia {
  token: string
  shortId: string
  nombre: string
  apellido: string
  observatorio: Observatorio
  turno: { fecha: string; horaInicio: string }
  cantidadPersonas: number
  estado: "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBS_LABELS: Record<Observatorio, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal",
}
const OBS_SHORT: Record<Observatorio, string> = {
  LA_SILLA: "LS",
  PARANAL: "PAR",
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function formatFechaLarga(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarioPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth() + 1) // 1-12
  const [obs, setObs] = useState<"" | Observatorio>("")

  const [dias, setDias] = useState<Record<string, TurnoResumen[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayReservas, setDayReservas] = useState<ReservaDia[]>([])
  const [dayLoading, setDayLoading] = useState(false)

  const fetchCalendario = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) })
      if (obs) params.set("obs", obs)
      const res = await fetch(`/api/admin/calendario?${params.toString()}`)
      if (!res.ok) throw new Error("Error al cargar el calendario.")
      const json: CalendarioResponse = await res.json()
      setDias(json.dias ?? {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [year, month, obs])

  useEffect(() => {
    fetchCalendario()
  }, [fetchCalendario])

  const fetchDayReservas = useCallback(async (iso: string) => {
    setDayLoading(true)
    try {
      const params = new URLSearchParams({ fecha: iso, limit: "100" })
      if (obs) params.set("obs", obs)
      const res = await fetch(`/api/admin/reservas?${params.toString()}`)
      if (!res.ok) throw new Error("Error al cargar reservas del día.")
      const json = await res.json()
      setDayReservas(json.data ?? [])
    } catch {
      setDayReservas([])
    } finally {
      setDayLoading(false)
    }
  }, [obs])

  function selectDay(iso: string) {
    setSelectedDate(iso)
    fetchDayReservas(iso)
  }

  function prevMonth() {
    setSelectedDate(null)
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    setSelectedDate(null)
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  function goToday() {
    setSelectedDate(null)
    setYear(now.getUTCFullYear())
    setMonth(now.getUTCMonth() + 1)
  }

  // Export del mes completo (rango desde día 1 a último día)
  function exportMes(modo: "reservas" | "personas") {
    const desde = isoDate(year, month, 1)
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const hasta = isoDate(year, month, lastDay)
    const params = new URLSearchParams({ desde, hasta, format: "xlsx", modo })
    if (obs) params.set("obs", obs)
    window.open(`/api/export?${params.toString()}`, "_blank")
  }

  function exportDia(iso: string, modo: "reservas" | "personas") {
    const params = new URLSearchParams({ desde: iso, hasta: iso, format: "xlsx", modo })
    if (obs) params.set("obs", obs)
    window.open(`/api/export?${params.toString()}`, "_blank")
  }

  // ── Grid layout ──────────────────────────────────────────────────────────
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() // 0=Dom..6=Sáb
  const leadingBlanks = (firstWeekday + 6) % 7 // Lunes primero
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const todayIso = isoDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate())

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header / controles */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <h2 className="min-w-44 text-center text-xl font-semibold text-stone-100">
              {MESES[month - 1]} {year}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-stone-700 bg-stone-900 p-2 text-stone-300 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Hoy
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={obs}
              onChange={(e) => {
                setObs(e.target.value as "" | Observatorio)
                setSelectedDate(null)
              }}
              className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Filtrar por observatorio"
            >
              <option value="">Ambos observatorios</option>
              <option value="LA_SILLA">La Silla</option>
              <option value="PARANAL">Paranal</option>
            </select>
            <Button variant="secondary" size="sm" onClick={() => exportMes("reservas")}>
              <Download className="size-4" aria-hidden="true" />
              Exportar mes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportMes("personas")}>
              <Download className="size-4" aria-hidden="true" />
              Lista pasajeros (mes)
            </Button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-sky-500/30 ring-1 ring-sky-500/40" />
            Turno regular
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-amber-500/30 ring-1 ring-amber-500/40" />
            Turno nocturno
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded bg-stone-700 ring-1 ring-stone-600" />
            Inactivo
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-amber-500" aria-label="Cargando..." />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-800">
            {/* Cabecera días de la semana */}
            <div className="grid grid-cols-7 border-b border-stone-800 bg-stone-900/60">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 bg-stone-900">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`blank-${idx}`} className="min-h-24 border-b border-r border-stone-800/60 bg-stone-950/30" />
                }
                const iso = isoDate(year, month, day)
                const turnos = dias[iso] ?? []
                const isToday = iso === todayIso
                const isSelected = iso === selectedDate

                return (
                  <button
                    type="button"
                    key={iso}
                    onClick={() => turnos.length > 0 && selectDay(iso)}
                    disabled={turnos.length === 0}
                    className={[
                      "min-h-24 border-b border-r border-stone-800/60 p-1.5 text-left align-top transition-colors",
                      turnos.length > 0 ? "cursor-pointer hover:bg-stone-800/60" : "cursor-default",
                      isSelected ? "bg-amber-500/10 ring-1 ring-inset ring-amber-500/40" : "",
                    ].join(" ")}
                    aria-label={`${day} — ${turnos.length} turno(s)`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          "inline-flex size-6 items-center justify-center rounded-full text-xs",
                          isToday ? "bg-amber-500 font-bold text-stone-950" : "text-stone-400",
                        ].join(" ")}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="mt-1 space-y-1">
                      {turnos.map((t) => {
                        const color = !t.activo
                          ? "bg-stone-700/60 text-stone-400 ring-stone-600"
                          : t.tipo === "NOCTURNA"
                            ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
                            : "bg-sky-500/15 text-sky-300 ring-sky-500/30"
                        return (
                          <div
                            key={t.id}
                            className={`flex items-center justify-between gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${color}`}
                            title={`${OBS_LABELS[t.observatorio]} ${t.horaInicio} · ${t.numPersonas}/${t.capacidadMax} personas`}
                          >
                            <span className="truncate">
                              {OBS_SHORT[t.observatorio]} {t.horaInicio}
                            </span>
                            <span className="tabular-nums">{t.numPersonas}/{t.capacidadMax}</span>
                          </div>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Panel del día seleccionado */}
        {selectedDate && (
          <div className="rounded-xl border border-stone-800 bg-stone-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold capitalize text-stone-100">
                <CalendarDays className="size-4 text-amber-500" aria-hidden="true" />
                {formatFechaLarga(selectedDate)}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => exportDia(selectedDate, "personas")}>
                  <Download className="size-4" aria-hidden="true" />
                  Lista pasajeros
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Cerrar panel del día"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              {dayLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-amber-500" aria-label="Cargando..." />
                </div>
              ) : dayReservas.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-500">
                  No hay reservas para este día con el filtro actual.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-800 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Titular</th>
                        <th className="px-3 py-2">Observatorio</th>
                        <th className="px-3 py-2">Turno</th>
                        <th className="px-3 py-2">Personas</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {dayReservas.map((r) => (
                        <tr key={r.token} className="hover:bg-stone-800/60">
                          <td className="px-3 py-2 font-mono text-xs text-sky-300">{r.shortId}</td>
                          <td className="px-3 py-2 text-stone-100">{r.nombre} {r.apellido}</td>
                          <td className="px-3 py-2 text-stone-300">{OBS_LABELS[r.observatorio]}</td>
                          <td className="px-3 py-2 tabular-nums text-stone-300">{r.turno.horaInicio}</td>
                          <td className="px-3 py-2 tabular-nums text-stone-300">{r.cantidadPersonas}</td>
                          <td className="px-3 py-2"><StatusBadge estado={r.estado} /></td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/admin/reservas/${r.token}`}
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              <ExternalLink className="size-3.5" aria-hidden="true" />
                              Detalle
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-stone-500">
                    {dayReservas.length} reserva(s) ·{" "}
                    {dayReservas.reduce((acc, r) => acc + (r.estado !== "ANULADA" ? r.cantidadPersonas : 0), 0)} personas activas
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
