"use client"

/**
 * /admin/bloqueos — Gestión del calendario de cierre y alertas de emergencia
 *
 * Tres secciones:
 * 1. Bloqueos activos — lista con botón de eliminar
 * 2. Crear nuevo bloqueo — formulario de rango de fechas
 * 3. Alerta de emergencia — notificación urgente para una fecha específica
 */

import { useState, useEffect, useCallback } from "react"
import {
  CalendarOff,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  BellRing,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Bloqueo {
  id: string
  observatorio: string | null
  fechaInicio: string
  fechaFin: string
  motivo: string
  creadoPor: string | null
  createdAt: string
}

type ObsFilter = "LA_SILLA" | "PARANAL" | null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function obsLabel(obs: string | null): string {
  if (obs === "LA_SILLA") return "La Silla"
  if (obs === "PARANAL") return "Paranal (VLT)"
  return "Ambos observatorios"
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeedbackBanner({
  msg,
}: {
  msg: { text: string; type: "error" | "success" } | null
}) {
  if (!msg) return null
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ring-1 ${
        msg.type === "error"
          ? "bg-red-500/10 text-red-400 ring-red-500/20"
          : "bg-green-500/10 text-green-400 ring-green-500/20"
      }`}
    >
      {msg.type === "error" ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{msg.text}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BloqueosPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [loadingBloqueos, setLoadingBloqueos] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Create bloqueo form
  const [obs, setObs] = useState<string>("")          // "" = ambos
  const [fechaInicioBloqueo, setFechaInicioBloqueo] = useState("")
  const [fechaFinBloqueo, setFechaFinBloqueo] = useState("")
  const [motivoBloqueo, setMotivoBloqueo] = useState("")
  const [savingBloqueo, setSavingBloqueo] = useState(false)
  const [bloqueoMsg, setBloqueoMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Delete bloqueo
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Emergency notification form
  const [fechaEmergencia, setFechaEmergencia] = useState("")
  const [obsEmergencia, setObsEmergencia] = useState<string>("")  // "" = ambos
  const [motivoEmergencia, setMotivoEmergencia] = useState("")
  const [cancelarEmergencia, setCancelarEmergencia] = useState(false)
  const [sendingEmergencia, setSendingEmergencia] = useState(false)
  const [emergenciaMsg, setEmergenciaMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)
  const [confirmEmergencia, setConfirmEmergencia] = useState(false)

  // ── Fetch bloqueos ────────────────────────────────────────────────────────
  const fetchBloqueos = useCallback(async () => {
    setLoadingBloqueos(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/admin/bloqueos")
      if (!res.ok) throw new Error("Error al cargar bloqueos")
      const { data }: { data: Bloqueo[] } = await res.json()
      setBloqueos(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoadingBloqueos(false)
    }
  }, [])

  useEffect(() => { fetchBloqueos() }, [fetchBloqueos])

  // ── Crear bloqueo ─────────────────────────────────────────────────────────
  async function handleCrearBloqueo(e: React.FormEvent) {
    e.preventDefault()
    setBloqueoMsg(null)
    if (!fechaInicioBloqueo || !fechaFinBloqueo || !motivoBloqueo.trim()) {
      setBloqueoMsg({ text: "Completa todos los campos obligatorios.", type: "error" })
      return
    }
    if (fechaFinBloqueo < fechaInicioBloqueo) {
      setBloqueoMsg({ text: "La fecha de fin debe ser igual o posterior a la fecha de inicio.", type: "error" })
      return
    }

    setSavingBloqueo(true)
    try {
      const res = await fetch("/api/admin/bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observatorio: obs || null,
          fechaInicio: fechaInicioBloqueo,
          fechaFin: fechaFinBloqueo,
          motivo: motivoBloqueo.trim(),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al crear bloqueo")
      }
      const data: { bloqueo: Bloqueo; turnosDesactivados: number } = await res.json()
      setBloqueoMsg({
        text: `Bloqueo creado. ${data.turnosDesactivados} turno(s) desactivado(s).`,
        type: "success",
      })
      setFechaInicioBloqueo("")
      setFechaFinBloqueo("")
      setMotivoBloqueo("")
      setObs("")
      await fetchBloqueos()
    } catch (err) {
      setBloqueoMsg({
        text: err instanceof Error ? err.message : "Error desconocido",
        type: "error",
      })
    } finally {
      setSavingBloqueo(false)
    }
  }

  // ── Eliminar bloqueo ──────────────────────────────────────────────────────
  async function handleEliminarBloqueo(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/bloqueos/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al eliminar bloqueo")
      }
      const data: { turnosReactivados: number } = await res.json()
      setBloqueoMsg({
        text: `Bloqueo eliminado. ${data.turnosReactivados} turno(s) reactivado(s).`,
        type: "success",
      })
      await fetchBloqueos()
    } catch (err) {
      setBloqueoMsg({
        text: err instanceof Error ? err.message : "Error desconocido",
        type: "error",
      })
    } finally {
      setDeletingId(null)
    }
  }

  // ── Enviar alerta de emergencia ───────────────────────────────────────────
  async function handleEmergencia(e: React.FormEvent) {
    e.preventDefault()
    setEmergenciaMsg(null)

    if (!fechaEmergencia || !motivoEmergencia.trim()) {
      setEmergenciaMsg({ text: "Fecha y motivo son obligatorios.", type: "error" })
      return
    }

    if (!confirmEmergencia) {
      setConfirmEmergencia(true)
      return
    }

    setSendingEmergencia(true)
    setConfirmEmergencia(false)
    try {
      const res = await fetch("/api/admin/notificaciones/emergencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fechaEmergencia,
          observatorio: obsEmergencia || undefined,
          motivo: motivoEmergencia.trim(),
          cancelar: cancelarEmergencia,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al enviar notificaciones")
      }
      const data: { notificadas: number; canceladas: number; mensaje?: string } = await res.json()
      const resumen = data.mensaje
        ? data.mensaje
        : `${data.notificadas} titular(es) notificado(s)${cancelarEmergencia ? `, ${data.canceladas} reserva(s) cancelada(s)` : ""}.`
      setEmergenciaMsg({ text: resumen, type: "success" })
      setFechaEmergencia("")
      setObsEmergencia("")
      setMotivoEmergencia("")
      setCancelarEmergencia(false)
    } catch (err) {
      setEmergenciaMsg({
        text: err instanceof Error ? err.message : "Error desconocido",
        type: "error",
      })
    } finally {
      setSendingEmergencia(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-semibold text-stone-100">Cierre y alertas de emergencia</h2>
          <p className="mt-1 text-sm text-stone-500">
            Bloquea períodos completos, gestiona el calendario de cierres y envía alertas urgentes
            a los titulares afectados.
          </p>
        </div>

        {/* ── 1. Bloqueos activos ─────────────────────────────────────────── */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-400">
            <CalendarOff className="size-4" aria-hidden="true" />
            Períodos bloqueados
          </h3>

          <FeedbackBanner msg={bloqueoMsg} />

          {loadError && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {loadError}
            </div>
          )}

          {loadingBloqueos ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-amber-500" aria-label="Cargando..." />
            </div>
          ) : bloqueos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-700 py-8 text-center text-sm text-stone-600">
              No hay períodos bloqueados actualmente.
            </p>
          ) : (
            <ul className="space-y-3">
              {bloqueos.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-stone-800 bg-stone-900 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/20">
                        {obsLabel(b.observatorio)}
                      </span>
                      <span className="text-sm font-medium text-stone-100">
                        {formatFecha(b.fechaInicio)}
                        {b.fechaInicio !== b.fechaFin && (
                          <> — {formatFecha(b.fechaFin)}</>
                        )}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-stone-500">{b.motivo}</p>
                    {b.creadoPor && (
                      <p className="mt-0.5 text-xs text-stone-700">Creado por {b.creadoPor}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deletingId === b.id}
                    onClick={() => handleEliminarBloqueo(b.id)}
                    aria-label={`Eliminar bloqueo ${formatFecha(b.fechaInicio)}`}
                    className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Eliminar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 2. Crear nuevo bloqueo ──────────────────────────────────────── */}
        <section className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-400">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo bloqueo de período
          </h3>

          <form onSubmit={handleCrearBloqueo} className="space-y-4">
            {/* Observatorio */}
            <div>
              <label htmlFor="obs-bloqueo" className="mb-1.5 block text-xs font-semibold text-stone-300">
                Observatorio
              </label>
              <select
                id="obs-bloqueo"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Ambos observatorios</option>
                <option value="LA_SILLA">La Silla</option>
                <option value="PARANAL">Paranal (VLT)</option>
              </select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="inicio-bloqueo" className="mb-1.5 block text-xs font-semibold text-stone-300">
                  Fecha de inicio <span className="text-red-400">*</span>
                </label>
                <input
                  id="inicio-bloqueo"
                  type="date"
                  value={fechaInicioBloqueo}
                  onChange={(e) => setFechaInicioBloqueo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="fin-bloqueo" className="mb-1.5 block text-xs font-semibold text-stone-300">
                  Fecha de fin <span className="text-red-400">*</span>
                </label>
                <input
                  id="fin-bloqueo"
                  type="date"
                  value={fechaFinBloqueo}
                  min={fechaInicioBloqueo}
                  onChange={(e) => setFechaFinBloqueo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label htmlFor="motivo-bloqueo" className="mb-1.5 block text-xs font-semibold text-stone-300">
                Motivo del cierre <span className="text-red-400">*</span>
              </label>
              <input
                id="motivo-bloqueo"
                type="text"
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
                placeholder="Ej: Mantención de instrumentos, período vacacional, visita VIP"
                maxLength={300}
                required
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-600">
                {motivoBloqueo.length}/300 caracteres. Uso interno, no se muestra al público.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" variant="secondary" size="md" loading={savingBloqueo}>
                <CalendarOff className="size-4" aria-hidden="true" />
                Crear bloqueo
              </Button>
            </div>
          </form>
        </section>

        {/* ── 3. Alerta de emergencia ─────────────────────────────────────── */}
        <section className="rounded-xl border border-red-500/20 bg-stone-900 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-red-400">
            <BellRing className="size-4" aria-hidden="true" />
            Alerta de emergencia
          </h3>
          <p className="mb-4 text-xs text-stone-500">
            Notifica de inmediato a todos los titulares con reservas activas en una fecha. Puedes
            solo informar o tambien cancelar sus reservas y liberar los cupos automaticamente.
          </p>

          <form onSubmit={handleEmergencia} className="space-y-4">
            {/* Fecha + Observatorio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha-emergencia" className="mb-1.5 block text-xs font-semibold text-stone-300">
                  Fecha afectada <span className="text-red-400">*</span>
                </label>
                <input
                  id="fecha-emergencia"
                  type="date"
                  value={fechaEmergencia}
                  onChange={(e) => { setFechaEmergencia(e.target.value); setConfirmEmergencia(false) }}
                  required
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="obs-emergencia" className="mb-1.5 block text-xs font-semibold text-stone-300">
                  Observatorio
                </label>
                <select
                  id="obs-emergencia"
                  value={obsEmergencia}
                  onChange={(e) => { setObsEmergencia(e.target.value); setConfirmEmergencia(false) }}
                  className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Ambos observatorios</option>
                  <option value="LA_SILLA">La Silla</option>
                  <option value="PARANAL">Paranal (VLT)</option>
                </select>
              </div>
            </div>

            {/* Motivo visible para el titular */}
            <div>
              <label htmlFor="motivo-emergencia" className="mb-1.5 block text-xs font-semibold text-stone-300">
                Motivo (se incluye en el email y WhatsApp) <span className="text-red-400">*</span>
              </label>
              <textarea
                id="motivo-emergencia"
                value={motivoEmergencia}
                onChange={(e) => { setMotivoEmergencia(e.target.value); setConfirmEmergencia(false) }}
                placeholder="Ej: Condiciones climáticas adversas — viento superior a 15 m/s impide el acceso seguro al observatorio."
                maxLength={500}
                rows={3}
                required
                className="w-full resize-none rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="mt-1 text-xs text-stone-600">{motivoEmergencia.length}/500</p>
            </div>

            {/* Cancelar reservas */}
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-800 p-3 hover:border-stone-700">
              <input
                type="checkbox"
                checked={cancelarEmergencia}
                onChange={(e) => { setCancelarEmergencia(e.target.checked); setConfirmEmergencia(false) }}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-stone-600 bg-stone-800 accent-red-500"
              />
              <span className="text-sm">
                <span className="font-semibold text-stone-200">Cancelar reservas automaticamente</span>
                <span className="block text-xs text-stone-500">
                  Libera los cupos, cambia el estado a ANULADA y registra log CIERRE_EMERGENCIA.
                  Desmarca si solo quieres informar sin cancelar.
                </span>
              </span>
            </label>

            {/* Feedback */}
            <FeedbackBanner msg={emergenciaMsg} />

            {/* Confirmation step */}
            {confirmEmergencia && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  Confirma: se enviaran emails
                  {cancelarEmergencia ? " y se cancelaran las reservas" : ""} para{" "}
                  <strong>{fechaEmergencia}</strong>
                  {obsEmergencia ? ` · ${obsLabel(obsEmergencia)}` : " · ambos observatorios"}.
                  Esta accion no se puede deshacer.
                </span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="danger"
                size="md"
                loading={sendingEmergencia}
              >
                <Send className="size-4" aria-hidden="true" />
                {confirmEmergencia ? "Confirmar y enviar" : "Enviar alerta"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  )
}
