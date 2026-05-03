"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mail,
  Users,
  Phone,
  Building2,
  CalendarDays,
  Telescope,
  Archive,
  CheckCheck,
  Eye,
  Trash2,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TipoConsulta = "GENERAL" | "GRUPAL"
type EstadoMensaje = "NUEVO" | "LEIDO" | "RESPONDIDO" | "ARCHIVADO"

interface MensajeRow {
  id: string
  tipo: TipoConsulta
  estado: EstadoMensaje
  nombre: string
  email: string
  telefono: string | null
  mensaje: string
  organizacion: string | null
  numPersonas: number | null
  observatorio: string | null
  fechasPref: string | null
  createdAt: string
}

interface PaginatedResponse {
  data: MensajeRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ESTADO_LABEL: Record<EstadoMensaje, string> = {
  NUEVO: "Nuevo",
  LEIDO: "Leído",
  RESPONDIDO: "Respondido",
  ARCHIVADO: "Archivado",
}

const ESTADO_CLS: Record<EstadoMensaje, string> = {
  NUEVO: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  LEIDO: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  RESPONDIDO: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  ARCHIVADO: "bg-stone-500/15 text-stone-400 ring-1 ring-stone-500/30",
}

const TIPO_LABEL: Record<TipoConsulta, string> = {
  GENERAL: "General",
  GRUPAL: "Grupal",
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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
// Estado badge
// ---------------------------------------------------------------------------

function EstadoBadge({ estado }: { estado: EstadoMensaje }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_CLS[estado])}>
      {ESTADO_LABEL[estado]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Detail drawer
// ---------------------------------------------------------------------------

function MensajeDetail({
  msg,
  onEstadoChange,
  onClose,
}: {
  msg: MensajeRow
  onEstadoChange: (id: string, estado: EstadoMensaje) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)

  async function cambiarEstado(estado: EstadoMensaje) {
    setSaving(true)
    await onEstadoChange(msg.id, estado)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" role="dialog" aria-modal="true" aria-label="Detalle del mensaje">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-stone-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-800 bg-stone-900 px-6 py-4">
          <div className="flex items-center gap-2">
            <EstadoBadge estado={msg.estado} />
            <span className="text-xs text-stone-400">
              {TIPO_LABEL[msg.tipo]} · {formatFecha(msg.createdAt)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-6">
          {/* Contact */}
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-stone-100">{msg.nombre}</h2>
            <div className="flex flex-col gap-1.5 text-sm text-stone-400">
              <a href={`mailto:${msg.email}`} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                <Mail className="size-3.5 shrink-0" />
                {msg.email}
              </a>
              {msg.telefono && (
                <span className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  {msg.telefono}
                </span>
              )}
            </div>
          </div>

          {/* Group details */}
          {msg.tipo === "GRUPAL" && (
            <div className="rounded-xl border border-stone-800 bg-stone-800/50 p-4 space-y-2">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Datos del grupo</p>
              {msg.organizacion && (
                <div className="flex items-center gap-2 text-sm text-stone-300">
                  <Building2 className="size-3.5 shrink-0 text-stone-500" />
                  {msg.organizacion}
                </div>
              )}
              {msg.numPersonas && (
                <div className="flex items-center gap-2 text-sm text-stone-300">
                  <Users className="size-3.5 shrink-0 text-stone-500" />
                  {msg.numPersonas} personas
                </div>
              )}
              {msg.observatorio && (
                <div className="flex items-center gap-2 text-sm text-stone-300">
                  <Telescope className="size-3.5 shrink-0 text-stone-500" />
                  {msg.observatorio === "LA_SILLA" ? "La Silla" : msg.observatorio === "PARANAL" ? "Paranal" : msg.observatorio}
                </div>
              )}
              {msg.fechasPref && (
                <div className="flex items-start gap-2 text-sm text-stone-300">
                  <CalendarDays className="size-3.5 shrink-0 mt-0.5 text-stone-500" />
                  <span>{msg.fechasPref}</span>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Mensaje</p>
            <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap">{msg.mensaje}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 border-t border-stone-800 bg-stone-900 px-6 py-4">
          <p className="text-xs text-stone-500 mb-3">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {(["LEIDO", "RESPONDIDO", "ARCHIVADO"] as EstadoMensaje[])
              .filter((e) => e !== msg.estado)
              .map((estado) => {
                const Icon = estado === "LEIDO" ? Eye : estado === "RESPONDIDO" ? CheckCheck : Archive
                return (
                  <button
                    key={estado}
                    onClick={() => cambiarEstado(estado)}
                    disabled={saving}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    )}
                  >
                    {saving ? <Loader2 className="size-3 animate-spin" /> : <Icon className="size-3" />}
                    {ESTADO_LABEL[estado]}
                  </button>
                )
              })}
          </div>
        </div>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

export default function MensajesPage() {
  const [mensajes, setMensajes] = useState<MensajeRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [tipoFilter, setTipoFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [selected, setSelected] = useState<MensajeRow | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const fetchMensajes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (debouncedSearch) params.set("q", debouncedSearch)
      if (tipoFilter) params.set("tipo", tipoFilter)
      if (estadoFilter) params.set("estado", estadoFilter)

      const res = await fetch(`/api/admin/mensajes?${params}`)
      if (!res.ok) throw new Error("Error al cargar mensajes")

      const data: PaginatedResponse = await res.json()
      setMensajes(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError("No se pudieron cargar los mensajes. Recarga la página.")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, tipoFilter, estadoFilter])

  useEffect(() => {
    void fetchMensajes()
  }, [fetchMensajes])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, tipoFilter, estadoFilter])

  async function handleEstadoChange(id: string, estado: EstadoMensaje) {
    const res = await fetch(`/api/admin/mensajes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    })
    if (!res.ok) return

    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, estado } : m)))
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este mensaje? Esta acción es irreversible.")) return
    const res = await fetch(`/api/admin/mensajes/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setMensajes((prev) => prev.filter((m) => m.id !== id))
    if (selected?.id === id) setSelected(null)
    setTotal((t) => t - 1)
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-500 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por nombre, email o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-stone-800 pl-9 pr-4 py-2 text-sm text-stone-100 placeholder:text-stone-500 ring-1 ring-stone-700 focus:outline-none focus:ring-amber-500 transition-shadow"
              aria-label="Buscar mensajes"
            />
          </div>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="rounded-lg bg-stone-800 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-700 focus:outline-none focus:ring-amber-500"
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            <option value="GENERAL">General</option>
            <option value="GRUPAL">Grupal</option>
          </select>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="rounded-lg bg-stone-800 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-700 focus:outline-none focus:ring-amber-500"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="NUEVO">Nuevo</option>
            <option value="LEIDO">Leído</option>
            <option value="RESPONDIDO">Respondido</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>

          <span className="text-xs text-stone-500 ml-auto">
            {total} mensaje{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-stone-500" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-500">
            <Mail className="size-10 mb-3 opacity-30" />
            <p className="text-sm">No hay mensajes con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-stone-800">
            <table className="min-w-full divide-y divide-stone-800 text-sm">
              <thead className="bg-stone-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider">Remitente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider hidden md:table-cell">Mensaje</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-stone-400 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-stone-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 bg-stone-950">
                {mensajes.map((msg) => (
                  <tr
                    key={msg.id}
                    className={cn(
                      "transition-colors hover:bg-stone-900/60 cursor-pointer",
                      msg.estado === "NUEVO" && "bg-amber-500/5"
                    )}
                    onClick={() => setSelected(msg)}
                  >
                    <td className="px-4 py-3">
                      <EstadoBadge estado={msg.estado} />
                    </td>
                    <td className="px-4 py-3 text-stone-300">
                      {TIPO_LABEL[msg.tipo]}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-100">{msg.nombre}</p>
                      <p className="text-xs text-stone-500">{msg.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-xs">
                      <p className="text-stone-400 truncate">{msg.mensaje}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-stone-500 text-xs">
                      {formatFecha(msg.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {msg.estado === "NUEVO" && (
                          <button
                            onClick={() => handleEstadoChange(msg.id, "LEIDO")}
                            title="Marcar como leído"
                            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-800 hover:text-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(msg.id)}
                          title="Eliminar mensaje"
                          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-800 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-stone-400 ring-1 ring-stone-800 hover:bg-stone-800 hover:text-stone-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-amber-500"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-stone-400 ring-1 ring-stone-800 hover:bg-stone-800 hover:text-stone-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-amber-500"
                aria-label="Página siguiente"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selected && (
        <MensajeDetail
          msg={selected}
          onEstadoChange={handleEstadoChange}
          onClose={() => setSelected(null)}
        />
      )}
    </AdminShell>
  )
}
