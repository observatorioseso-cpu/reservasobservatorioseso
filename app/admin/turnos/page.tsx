"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Plus,
  Pencil,
  ClipboardList,
  PowerOff,
  Loader2,
  AlertCircle,
  X,
  Check,
  Users,
  Trash2,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Observatorio = "LA_SILLA" | "PARANAL"

interface Turno {
  id: string
  observatorio: Observatorio
  fecha: string
  horaInicio: string
  horaFin: string
  capacidadMax: number
  cuposOcupados: number
  activo: boolean
  asistentesReales: number | null
}

interface NuevoTurnoForm {
  observatorio: Observatorio
  fecha: string
  horaInicio: string
  horaFin: string
  capacidadMax: string
}

interface AsistenciaForm {
  asistentes: string
}

interface EditarTurnoForm {
  horaFin: string
  capacidadMax: string
  activo: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBS_LABELS: Record<Observatorio, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal",
}

function formatFechaES(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00")
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function OcupacionBar({ ocupados, max }: { ocupados: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((ocupados / max) * 100)) : 0
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-green-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-700">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-stone-400">{pct}%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de nuevo turno
// ---------------------------------------------------------------------------

interface ModalNuevoTurnoProps {
  onClose: () => void
  onCreated: () => void
}

function ModalNuevoTurno({ onClose, onCreated }: ModalNuevoTurnoProps) {
  const [form, setForm] = useState<NuevoTurnoForm>({
    observatorio: "LA_SILLA",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    capacidadMax: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof NuevoTurnoForm>(k: K, v: NuevoTurnoForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fecha || !form.horaInicio || !form.horaFin || !form.capacidadMax) {
      setError("Completa todos los campos.")
      return
    }
    if (parseInt(form.capacidadMax, 10) < 1) {
      setError("La capacidad máxima debe ser al menos 1.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observatorio: form.observatorio,
          fecha: form.fecha,
          horaInicio: form.horaInicio,
          horaFin: form.horaFin,
          capacidadMax: parseInt(form.capacidadMax, 10),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al crear el turno.")
      }
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nuevo-titulo"
    >
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="modal-nuevo-titulo" className="text-lg font-semibold text-stone-100">
            Nuevo turno
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="obs">
              Observatorio
            </label>
            <select
              id="obs"
              value={form.observatorio}
              onChange={(e) => set("observatorio", e.target.value as Observatorio)}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="LA_SILLA">La Silla</option>
              <option value="PARANAL">Paranal</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="fecha">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="horaInicio">
                Hora inicio
              </label>
              <input
                id="horaInicio"
                type="time"
                value={form.horaInicio}
                onChange={(e) => set("horaInicio", e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="horaFin">
                Hora fin
              </label>
              <input
                id="horaFin"
                type="time"
                value={form.horaFin}
                onChange={(e) => set("horaFin", e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="capacidadMax">
              Capacidad maxima
            </label>
            <input
              id="capacidadMax"
              type="number"
              min={1}
              value={form.capacidadMax}
              onChange={(e) => set("capacidadMax", e.target.value)}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ej: 50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Crear turno
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de asistencia
// ---------------------------------------------------------------------------

interface ModalAsistenciaProps {
  turnoId: string
  onClose: () => void
  onSaved: () => void
}

function ModalAsistencia({ turnoId, onClose, onSaved }: ModalAsistenciaProps) {
  const [form, setForm] = useState<AsistenciaForm>({ asistentes: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = parseInt(form.asistentes, 10)
    if (isNaN(n) || n < 0) {
      setError("Ingresa un numero valido de asistentes.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/turnos/${turnoId}/asistencia`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asistentesReales: n }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al registrar asistencia.")
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-asistencia-titulo"
    >
      <div className="w-full max-w-sm rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="modal-asistencia-titulo" className="text-lg font-semibold text-stone-100">
            Registrar asistencia
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="asistentes">
              Asistentes reales
            </label>
            <input
              id="asistentes"
              type="number"
              min={0}
              value={form.asistentes}
              onChange={(e) => setForm({ asistentes: e.target.value })}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de editar turno
// ---------------------------------------------------------------------------

interface ModalEditarTurnoProps {
  turno: Turno
  onClose: () => void
  onSaved: () => void
}

function ModalEditarTurno({ turno, onClose, onSaved }: ModalEditarTurnoProps) {
  const [form, setForm] = useState<EditarTurnoForm>({
    horaFin: turno.horaFin,
    capacidadMax: String(turno.capacidadMax),
    activo: turno.activo,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cap = parseInt(form.capacidadMax, 10)
    if (isNaN(cap) || cap < 1) { setError("Capacidad mínima: 1."); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horaFin: form.horaFin || undefined,
          capacidadMax: cap,
          activo: form.activo,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al guardar.")
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-labelledby="modal-editar-titulo">
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="modal-editar-titulo" className="text-lg font-semibold text-stone-100">
            Editar turno
          </h2>
          <button type="button" onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
            aria-label="Cerrar">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Turno info */}
        <div className="mb-4 rounded-lg bg-stone-800/50 px-4 py-3 text-sm">
          <p className="font-medium text-stone-200">{OBS_LABELS[turno.observatorio]}</p>
          <p className="text-stone-400">{formatFechaES(turno.fecha)} · {turno.horaInicio}–{turno.horaFin}</p>
          <p className="mt-1 text-xs text-stone-500">{turno.cuposOcupados} cupos ocupados de {turno.capacidadMax}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="edit-horaFin">
              Hora fin
            </label>
            <input id="edit-horaFin" type="time" value={form.horaFin}
              onChange={(e) => setForm((p) => ({ ...p, horaFin: e.target.value }))}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-300" htmlFor="edit-capacidad">
              Capacidad máxima
            </label>
            <input id="edit-capacidad" type="number" min={turno.cuposOcupados || 1} value={form.capacidadMax}
              onChange={(e) => setForm((p) => ({ ...p, capacidadMax: e.target.value }))}
              className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            {turno.cuposOcupados > 0 && (
              <p className="mt-1 text-xs text-stone-500">
                Mínimo: {turno.cuposOcupados} (cupos ya ocupados)
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input type="checkbox" checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                className="sr-only" role="switch" aria-checked={form.activo} />
              <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${form.activo ? "bg-amber-500" : "bg-stone-700"}`} aria-hidden="true" />
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${form.activo ? "translate-x-5" : "translate-x-0.5"}`} aria-hidden="true" />
            </div>
            <span className="text-sm text-stone-300">{form.activo ? "Turno activo" : "Turno inactivo"}</span>
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filtroObs, setFiltroObs] = useState<"" | Observatorio>("")
  const [filtroActivo, setFiltroActivo] = useState<"" | "true" | "false">("")
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalAsistencia, setModalAsistencia] = useState<string | null>(null)
  const [modalEditar, setModalEditar] = useState<Turno | null>(null)
  const [desactivandoId, setDesactivandoId] = useState<string | null>(null)
  const [cleanupState, setCleanupState] = useState<{
    loading: boolean
    result: { eliminados: number; omitidos: number; detalle: string } | null
    error: string | null
  }>({ loading: false, result: null, error: null })

  const fetchTurnos = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams()
      if (filtroObs) params.set("observatorio", filtroObs)
      if (filtroActivo !== "") params.set("activo", filtroActivo)
      const res = await fetch(`/api/admin/turnos?${params.toString()}`)
      if (!res.ok) throw new Error("Error al cargar los turnos.")
      const data = await res.json()
      setTurnos(Array.isArray(data) ? data : data.turnos ?? [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [filtroObs, filtroActivo])

  useEffect(() => {
    fetchTurnos()
  }, [fetchTurnos])

  async function handleDesactivar(id: string) {
    if (!window.confirm("¿Desactivar este turno? Las reservas existentes no seran afectadas.")) return
    setDesactivandoId(id)
    try {
      const res = await fetch(`/api/admin/turnos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al desactivar el turno.")
      await fetchTurnos()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setDesactivandoId(null)
    }
  }

  async function handleCleanupDomingos() {
    if (
      !window.confirm(
        "¿Eliminar los turnos de Paranal que cayeron en domingo?\n\nSolo se eliminarán turnos SIN reservas activas. Esta acción no se puede deshacer."
      )
    )
      return
    setCleanupState({ loading: true, result: null, error: null })
    try {
      const res = await fetch("/api/admin/cleanup-domingos", { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setCleanupState({ loading: false, result: null, error: json.error ?? "Error al limpiar." })
        return
      }
      setCleanupState({
        loading: false,
        result: { eliminados: json.eliminados, omitidos: json.omitidos, detalle: json.detalle },
        error: null,
      })
      if (json.eliminados > 0) await fetchTurnos()
    } catch {
      setCleanupState({ loading: false, result: null, error: "Error de conexión." })
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-stone-100">Turnos</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCleanupDomingos}
              disabled={cleanupState.loading}
              title="Purga turnos de Paranal en domingo que se crearon por error en el seed antiguo. Paranal nunca opera los domingos."
            >
              {cleanupState.loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Purgar datos erróneos
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalNuevo(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo turno
            </Button>
          </div>
        </div>

        {/* Cleanup result banner */}
        {cleanupState.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {cleanupState.error}
          </div>
        )}
        {cleanupState.result && (
          <div className="flex items-start justify-between gap-3 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400 ring-1 ring-green-500/20">
            <div className="flex items-start gap-2">
              <Check className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="font-medium">
                  {cleanupState.result.eliminados} turno{cleanupState.result.eliminados !== 1 ? "s" : ""} eliminado{cleanupState.result.eliminados !== 1 ? "s" : ""}
                  {cleanupState.result.omitidos > 0 && ` · ${cleanupState.result.omitidos} omitido${cleanupState.result.omitidos !== 1 ? "s" : ""} (tienen reservas)`}
                </span>
                <p className="text-xs text-green-500 mt-0.5">{cleanupState.result.detalle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCleanupState({ loading: false, result: null, error: null })}
              className="shrink-0 rounded p-0.5 hover:bg-green-500/20"
              aria-label="Cerrar"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
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
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value as "" | "true" | "false")}
            className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

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
          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="min-w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                  <th className="px-4 py-3">Observatorio</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">Ocupacion</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                      No hay turnos con estos filtros.
                    </td>
                  </tr>
                )}
                {turnos.map((t) => (
                  <tr key={t.id} className="bg-stone-900 hover:bg-stone-800 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-100">
                      {OBS_LABELS[t.observatorio]}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-300">
                      {formatFechaES(t.fecha)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-300">
                      {t.horaInicio}–{t.horaFin}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-stone-300">
                      {t.cuposOcupados}/{t.capacidadMax}
                    </td>
                    <td className="px-4 py-3">
                      <OcupacionBar ocupados={t.cuposOcupados} max={t.capacidadMax} />
                    </td>
                    <td className="px-4 py-3">
                      {t.activo ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                          <Check className="size-3" aria-hidden="true" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-400/10 px-2.5 py-1 text-xs font-medium text-stone-400 ring-1 ring-inset ring-stone-400/20">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/reservas?turnoId=${t.id}`}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-700 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          aria-label="Ver reservas de este turno"
                          title="Ver reservas"
                        >
                          <Users className="size-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setModalEditar(t)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-700 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          aria-label="Editar turno"
                          title="Editar"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalAsistencia(t.id)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-700 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          aria-label="Registrar asistencia"
                          title="Asistencia"
                        >
                          <ClipboardList className="size-4" aria-hidden="true" />
                        </button>
                        {t.activo && (
                          <button
                            type="button"
                            onClick={() => handleDesactivar(t.id)}
                            disabled={desactivandoId === t.id}
                            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-700 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                            aria-label="Desactivar turno"
                            title="Desactivar"
                          >
                            {desactivandoId === t.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <PowerOff className="size-4" aria-hidden="true" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalNuevo && (
        <ModalNuevoTurno onClose={() => setModalNuevo(false)} onCreated={fetchTurnos} />
      )}
      {modalAsistencia && (
        <ModalAsistencia
          turnoId={modalAsistencia}
          onClose={() => setModalAsistencia(null)}
          onSaved={fetchTurnos}
        />
      )}
      {modalEditar && (
        <ModalEditarTurno
          turno={modalEditar}
          onClose={() => setModalEditar(null)}
          onSaved={fetchTurnos}
        />
      )}
    </AdminShell>
  )
}
