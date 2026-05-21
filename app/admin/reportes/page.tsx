"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import {
  BarChart2,
  TrendingUp,
  Users,
  XCircle,
  Clock,
  Telescope,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Semana {
  label: string
  confirmadas: number
  anuladas: number
  pendientes: number
  personas: number
}

interface TurnoRow {
  id: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  capacidadMax: number
  cuposOcupados: number
  asistentesReales: number | null
  confirmadas: number
  anuladas: number
  pendientes: number
}

interface ReporteData {
  mes: string
  kpis: {
    totalReservas: number
    confirmadas: number
    anuladas: number
    pendientes: number
    tasaConversion: number
    personasConfirmadas: number
    personasTotales: number
    turnosTotales: number
    turnosConAsistencia: number
    asistentesRealesTotal: number
  }
  semanas: Semana[]
  porObs: Record<string, { turnos: number; confirmadas: number; anuladas: number; asistentesReales: number }>
  locales: Record<string, number>
  logs: Record<string, number>
  turnos: TurnoRow[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OBS_LABEL: Record<string, string> = {
  LA_SILLA: "La Silla",
  PARANAL:  "Paranal (VLT)",
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const CHART_OPTS_BAR = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#a8a29e", font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: "#78716c" }, grid: { color: "rgba(41,37,36,0.8)" } },
    y: { ticks: { color: "#78716c" }, grid: { color: "rgba(41,37,36,0.8)" } },
  },
} as const

const CHART_OPTS_DONUT = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { color: "#a8a29e", font: { size: 11 }, padding: 12 } } },
} as const

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  warning = false,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  accent?: boolean
  warning?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</span>
        <Icon
          size={18}
          className={accent ? "text-amber-400" : warning ? "text-red-400" : "text-stone-500"}
        />
      </div>
      <p
        className={`text-3xl font-black ${accent ? "text-amber-400" : warning ? "text-red-400" : "text-stone-100"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReportesPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth() + 1)
  const [obs,   setObs]   = useState("all")

  const [data,         setData]         = useState<ReporteData | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const [analisis,     setAnalisis]     = useState<string | null>(null)
  const [loadingIA,    setLoadingIA]    = useState(false)
  const [errorIA,      setErrorIA]      = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setAnalisis(null)
    try {
      const mes = `${year}-${String(month).padStart(2, "0")}`
      const res = await fetch(`/api/admin/reportes?mes=${mes}&obs=${obs}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [year, month, obs])

  useEffect(() => { fetchData() }, [fetchData])

  async function generarAnalisis() {
    if (!data) return
    setLoadingIA(true)
    setErrorIA(null)
    try {
      const res = await fetch("/api/admin/reportes/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: data.mes, datos: data }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      setAnalisis(json.analisis)
    } catch (e) {
      setErrorIA(e instanceof Error ? e.message : "Error al generar análisis")
    } finally {
      setLoadingIA(false)
    }
  }

  const mesLabel = `${MONTHS[month - 1]} ${year}`

  // --- Chart data ---
  const barData = data
    ? {
        labels: data.semanas.map((s) => s.label),
        datasets: [
          {
            label: "Confirmadas",
            data: data.semanas.map((s) => s.confirmadas),
            backgroundColor: "rgba(245,158,11,0.75)",
            borderRadius: 4,
          },
          {
            label: "Anuladas",
            data: data.semanas.map((s) => s.anuladas),
            backgroundColor: "rgba(239,68,68,0.60)",
            borderRadius: 4,
          },
          {
            label: "Pendientes",
            data: data.semanas.map((s) => s.pendientes),
            backgroundColor: "rgba(125,211,252,0.40)",
            borderRadius: 4,
          },
        ],
      }
    : null

  const donutData = data
    ? {
        labels: ["Confirmadas", "Anuladas", "Pendientes"],
        datasets: [
          {
            data: [data.kpis.confirmadas, data.kpis.anuladas, data.kpis.pendientes],
            backgroundColor: [
              "rgba(245,158,11,0.85)",
              "rgba(239,68,68,0.75)",
              "rgba(125,211,252,0.55)",
            ],
            borderColor: ["#f59e0b", "#ef4444", "#7dd3fc"],
            borderWidth: 1,
          },
        ],
      }
    : null

  // --- Year options ---
  const yearOpts: number[] = []
  for (let y = 2024; y <= now.getUTCFullYear() + 1; y++) yearOpts.push(y)

  return (
    <AdminShell>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-100">Reportes</h1>
          <p className="mt-1 text-sm text-stone-500">{mesLabel}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {yearOpts.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los observatorios</option>
            <option value="LA_SILLA">La Silla</option>
            <option value="PARANAL">Paranal (VLT)</option>
          </select>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-stone-900" />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {!loading && data && (
        <>
          {/* KPI Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Total reservas"
              value={data.kpis.totalReservas}
              icon={BarChart2}
            />
            <KpiCard
              label="Confirmadas"
              value={data.kpis.confirmadas}
              sub={`${data.kpis.tasaConversion}% conversión`}
              icon={CheckCircle2}
              accent
            />
            <KpiCard
              label="Anuladas"
              value={data.kpis.anuladas}
              icon={XCircle}
              warning={data.kpis.anuladas > data.kpis.confirmadas}
            />
            <KpiCard
              label="Pendientes"
              value={data.kpis.pendientes}
              icon={Clock}
            />
            <KpiCard
              label="Asistentes reales"
              value={data.kpis.asistentesRealesTotal}
              sub={`${data.kpis.turnosConAsistencia} / ${data.kpis.turnosTotales} turnos`}
              icon={Users}
              accent={data.kpis.turnosConAsistencia > 0}
            />
          </div>

          {/* Charts */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bar chart */}
            <div className="col-span-2 rounded-xl border border-stone-800 bg-stone-900 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-500">
                Reservas por semana
              </p>
              <div className="h-52">
                {barData && <Bar data={barData} options={CHART_OPTS_BAR} />}
              </div>
            </div>

            {/* Donut */}
            <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-500">
                Distribución por estado
              </p>
              <div className="h-52">
                {donutData && <Doughnut data={donutData} options={CHART_OPTS_DONUT} />}
              </div>
            </div>
          </div>

          {/* Por observatorio */}
          {Object.keys(data.porObs).length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(data.porObs).map(([obs, d]) => (
                <div key={obs} className="rounded-xl border border-stone-800 bg-stone-900 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Telescope size={16} className="text-amber-400" />
                    <span className="text-sm font-semibold text-stone-200">{OBS_LABEL[obs] ?? obs}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Turnos",       value: d.turnos },
                      { label: "Confirmadas",  value: d.confirmadas },
                      { label: "Anuladas",     value: d.anuladas },
                      { label: "Asistentes",   value: d.asistentesReales },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs uppercase tracking-widest text-stone-600">{label}</p>
                        <p className="text-xl font-black text-stone-100">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Turnos table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-stone-800 bg-stone-900">
            <div className="border-b border-stone-800 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Detalle de turnos — {mesLabel}
              </p>
            </div>
            <div className="overflow-x-auto">
              {data.turnos.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-stone-600">No hay turnos en este período.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-800 text-xs uppercase tracking-wider text-stone-600">
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Observatorio</th>
                      <th className="px-4 py-3 text-left">Horario</th>
                      <th className="px-4 py-3 text-right">Capacidad</th>
                      <th className="px-4 py-3 text-right">Confirmadas</th>
                      <th className="px-4 py-3 text-right">Anuladas</th>
                      <th className="px-4 py-3 text-right">Pendientes</th>
                      <th className="px-4 py-3 text-right">Asistentes reales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.turnos.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`border-b border-stone-800/50 ${i % 2 === 0 ? "" : "bg-stone-950/30"}`}
                      >
                        <td className="px-4 py-3 font-mono text-stone-300">{t.fecha}</td>
                        <td className="px-4 py-3 text-stone-400">{OBS_LABEL[t.observatorio] ?? t.observatorio}</td>
                        <td className="px-4 py-3 text-stone-400">{t.horaInicio} – {t.horaFin}</td>
                        <td className="px-4 py-3 text-right text-stone-400">{t.capacidadMax}</td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-400">{t.confirmadas}</td>
                        <td className="px-4 py-3 text-right text-red-400">{t.anuladas}</td>
                        <td className="px-4 py-3 text-right text-sky-400">{t.pendientes}</td>
                        <td className="px-4 py-3 text-right">
                          {t.asistentesReales !== null ? (
                            <span className="font-semibold text-stone-100">{t.asistentesReales}</span>
                          ) : (
                            <span className="text-stone-700">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-sm font-semibold text-stone-200">Análisis IA — {mesLabel}</span>
              </div>
              <Button
                onClick={generarAnalisis}
                disabled={loadingIA}
                size="sm"
                variant="secondary"
              >
                {loadingIA ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" />Generando...</>
                ) : analisis ? (
                  "Regenerar"
                ) : (
                  "Generar análisis"
                )}
              </Button>
            </div>

            {errorIA && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={14} />
                {errorIA}
              </div>
            )}

            {!analisis && !loadingIA && !errorIA && (
              <p className="text-sm text-stone-600">
                Haz clic en &ldquo;Generar análisis&rdquo; para obtener un resumen ejecutivo del mes generado por IA.
              </p>
            )}

            {analisis && (
              <div className="prose prose-invert prose-sm max-w-none">
                <MarkdownLite text={analisis} />
              </div>
            )}
          </div>
        </>
      )}
    </AdminShell>
  )
}

// ---------------------------------------------------------------------------
// Minimal markdown renderer (h3, ul, strong, plain paragraphs)
// No external dependency needed for the small output Claude generates.
// ---------------------------------------------------------------------------

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mb-4 space-y-1 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-stone-400">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={i} className="mb-2 mt-5 text-sm font-semibold uppercase tracking-widest text-amber-400 first:mt-0">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={i} className="mb-2 mt-4 text-base font-bold text-stone-200">
          {line.slice(3)}
        </h2>
      )
    } else if (line.match(/^[\-\*•] /)) {
      listItems.push(line.replace(/^[\-\*•] /, ""))
    } else if (line.trim() === "") {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={i} className="mb-3 text-sm leading-relaxed text-stone-400">
          <InlineMarkdown text={line} />
        </p>
      )
    }
  }
  flushList()

  return <>{elements}</>
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-stone-200">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
