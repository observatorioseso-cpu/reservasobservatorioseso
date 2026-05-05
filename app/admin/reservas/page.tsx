"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Observatorio = "LA_SILLA" | "PARANAL"
type EstadoReserva = "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA"

interface ReservaRow {
  token: string
  shortId: string
  nombre: string
  apellido: string
  observatorio: Observatorio
  turno: {
    fecha: string
    horaInicio: string
  }
  cantidadPersonas: number
  estado: EstadoReserva
  fechaLimiteConfirmacion: string | null
}

interface PaginatedResponse {
  data: ReservaRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBS_LABELS: Record<Observatorio, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal",
}

function formatFechaES(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

function ReservasPageInner() {
  const searchParams = useSearchParams()

  const [reservas, setReservas] = useState<ReservaRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [filtroObs, setFiltroObs] = useState<"" | Observatorio>("")
  const [filtroEstado, setFiltroEstado] = useState<"" | EstadoReserva>("")
  const [filtroTurnoId, setFiltroTurnoId] = useState<string>("")

  const debouncedQ = useDebounce(q, 300)
  const abortRef = useRef<AbortController | null>(null)

  // Hydrate filtroTurnoId from URL on mount
  useEffect(() => {
    const tid = searchParams.get("turnoId")
    if (tid) setFiltroTurnoId(tid)
  }, [searchParams])

  const fetchReservas = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedQ) params.set("q", debouncedQ)
      if (filtroObs) params.set("obs", filtroObs)
      if (filtroEstado) params.set("estado", filtroEstado)
      if (filtroTurnoId) params.set("turnoId", filtroTurnoId)
      params.set("page", String(page))
      params.set("limit", String(PAGE_SIZE))

      const res = await fetch(`/api/admin/reservas?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Error al cargar las reservas.")
      const json: PaginatedResponse = await res.json()
      setReservas(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      setFetchError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, filtroObs, filtroEstado, filtroTurnoId, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, filtroObs, filtroEstado, filtroTurnoId])

  useEffect(() => {
    fetchReservas()
  }, [fetchReservas])

  function buildExportUrl() {
    const params = new URLSearchParams({ format: "xlsx" })
    if (debouncedQ) params.set("q", debouncedQ)
    if (filtroObs) params.set("obs", filtroObs)
    if (filtroEstado) params.set("estado", filtroEstado)
    return `/api/export?${params.toString()}`
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-stone-100">Reservas</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(buildExportUrl(), "_blank")}
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar Excel
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Busqueda */}
          <div className="relative flex-1 min-w-52">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, email, shortId..."
              className="w-full rounded-lg border border-stone-700 bg-stone-900 py-2 pl-9 pr-3 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Buscar reservas"
            />
          </div>

          <select
            value={filtroObs}
            onChange={(e) => setFiltroObs(e.target.value as "" | Observatorio)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Filtrar por observatorio"
          >
            <option value="">Todos los observatorios</option>
            <option value="LA_SILLA">La Silla</option>
            <option value="PARANAL">Paranal</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as "" | EstadoReserva)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE_CONFIRMACION">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>

        {/* Turno filter banner */}
        {filtroTurnoId && (
          <div className="flex items-center justify-between rounded-lg bg-sky-500/10 px-4 py-2.5 text-sm text-sky-300 ring-1 ring-sky-500/20">
            <span>Filtrando por turno especifico</span>
            <button
              type="button"
              onClick={() => setFiltroTurnoId("")}
              className="ml-3 rounded p-0.5 hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Quitar filtro de turno"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {fetchError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-amber-500" aria-label="Cargando..." />
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && (
          <>
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="min-w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/60 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Titular</th>
                    <th className="px-4 py-3">Observatorio</th>
                    <th className="px-4 py-3">Fecha visita</th>
                    <th className="px-4 py-3">Turno</th>
                    <th className="px-4 py-3">Personas</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Limite confirm.</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {reservas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-stone-500">
                        No hay reservas con estos filtros.
                      </td>
                    </tr>
                  )}
                  {reservas.map((r) => (
                    <tr key={r.token} className="bg-stone-900 hover:bg-stone-800 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-sky-300">{r.shortId}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-100">
                        {r.nombre} {r.apellido}
                      </td>
                      <td className="px-4 py-3 text-stone-300">{OBS_LABELS[r.observatorio]}</td>
                      <td className="px-4 py-3 tabular-nums text-stone-300">
                        {formatFechaES(r.turno.fecha)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-stone-300">
                        {r.turno.horaInicio}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-stone-300">
                        {r.cantidadPersonas}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge estado={r.estado} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-stone-400">
                        {r.estado === "PENDIENTE_CONFIRMACION" && r.fechaLimiteConfirmacion
                          ? formatFechaES(r.fechaLimiteConfirmacion)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/reservas/${r.token}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-700 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          aria-label={`Ver detalle de ${r.shortId}`}
                        >
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginacion */}
            <div className="flex items-center justify-between text-sm text-stone-400">
              <span>
                {total === 0
                  ? "Sin resultados"
                  : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total} reservas`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-stone-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                  Anterior
                </button>
                <span className="text-xs">
                  Pagina {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 hover:text-stone-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label="Pagina siguiente"
                >
                  Siguiente
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}

export default function ReservasPage() {
  return (
    <Suspense>
      <ReservasPageInner />
    </Suspense>
  )
}
