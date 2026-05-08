"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Download,
  Trash2,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDriveDownload,
  Database,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackupStats {
  turnos: number
  reservas: number
  acompanantes: number
  configSistema: number
  bloqueosCalendario: number
  mensajesContacto: number
  logsAgente: number
  admins: number
}

interface BackupJob {
  id: string
  status: "EN_PROGRESO" | "COMPLETADO" | "ERROR"
  triggeredBy: string
  blobUrl: string | null
  sizeBytes: number
  checksum: string
  stats: BackupStats
  error: string | null
  createdAt: string
  completedAt: string | null
}

interface RestoreResult {
  ok: boolean
  restaurados: Record<string, number>
  errores: string[]
  duracionMs: number
  backupTimestamp: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  })
}

function formatSize(bytes: number): string {
  return (bytes / 1024).toFixed(1) + " KB"
}

function truncateEmail(email: string, max = 24): string {
  if (email.length <= max) return email
  return email.slice(0, max) + "…"
}

function formatTriggeredBy(triggeredBy: string): string {
  if (triggeredBy === "cron") return "Automatico (cron)"
  return truncateEmail(triggeredBy)
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: BackupJob["status"] }) {
  if (status === "COMPLETADO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        Completado
      </span>
    )
  }
  if (status === "EN_PROGRESO") {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        En progreso
      </span>
    )
  }
  // ERROR
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
      <AlertCircle className="size-3" aria-hidden="true" />
      Error
    </span>
  )
}

// ---------------------------------------------------------------------------
// Restore panel
// ---------------------------------------------------------------------------

interface RestorePanelProps {
  backup: BackupJob
  onClose: () => void
  onRestored: (result: RestoreResult) => void
}

function RestorePanel({ backup, onClose, onRestored }: RestorePanelProps) {
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RestoreResult | null>(null)

  async function handleRestore() {
    setRestoring(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: backup.id, confirmar: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al restaurar el backup.")
      }
      const data: RestoreResult = await res.json()
      setResult(data)
      onRestored(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="mb-4 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-amber-300">Restaurar desde backup</h3>
          <p className="mt-1 text-xs text-stone-400">
            La restauracion usa estrategia UPSERT — añade y actualiza registros del backup sin
            eliminar datos creados despues. Es segura para recuperar datos perdidos.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-stone-900/60 px-4 py-3 text-xs text-stone-300">
        <div className="mb-2 font-medium text-stone-200">
          Backup del {formatFecha(backup.createdAt)}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-stone-400">
          <span>Reservas: {backup.stats.reservas}</span>
          <span>Turnos: {backup.stats.turnos}</span>
          <span>Acompañantes: {backup.stats.acompanantes}</span>
          <span>Mensajes: {backup.stats.mensajesContacto}</span>
          <span>Config: {backup.stats.configSistema}</span>
          <span>Cierres: {backup.stats.bloqueosCalendario}</span>
          <span>Logs agente: {backup.stats.logsAgente}</span>
          <span>Admins: {backup.stats.admins}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs text-red-400 ring-1 ring-red-500/20">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2.5 text-xs text-green-400 ring-1 ring-green-500/20">
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Restauracion completada en {result.duracionMs} ms
          </div>
          <div className="rounded-lg bg-stone-900/60 px-4 py-3 text-xs text-stone-300">
            <div className="mb-1 font-medium text-stone-200">Registros restaurados</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-stone-400">
              {Object.entries(result.restaurados).map(([key, val]) => (
                <span key={key}>
                  {key}: {val}
                </span>
              ))}
            </div>
          </div>
          {result.errores.length > 0 && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-xs text-red-400 ring-1 ring-red-500/20">
              <div className="mb-1 font-medium">Errores ({result.errores.length})</div>
              <ul className="space-y-0.5">
                {result.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={restoring}
            onClick={handleRestore}
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Confirmar restauracion
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={restoring}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupJob[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ text: string; type: "error" | "success" } | null>(
    null
  )
  const [selectedRestore, setSelectedRestore] = useState<string | null>(null)

  const fetchBackups = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("/api/admin/backup")
      if (!res.ok) throw new Error("Error al cargar los backups.")
      const { data }: { data: BackupJob[] } = await res.json()
      setBackups(data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  async function handleCreate() {
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al crear el backup.")
      }
      setCreateMsg({ text: "Backup creado correctamente.", type: "success" })
      await fetchBackups()
    } catch (err) {
      setCreateMsg({
        text: err instanceof Error ? err.message : "Error desconocido.",
        type: "error",
      })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Eliminar este backup? Esta accion no se puede deshacer.")
    if (!ok) return

    // Optimistic removal
    setBackups((prev) => prev.filter((b) => b.id !== id))
    if (selectedRestore === id) setSelectedRestore(null)

    try {
      const res = await fetch(`/api/admin/backup/${id}`, { method: "DELETE" })
      if (!res.ok) {
        // Revert on failure
        await fetchBackups()
      }
    } catch {
      await fetchBackups()
    }
  }

  function handleDownload(id: string) {
    const a = document.createElement("a")
    a.href = `/api/admin/backup/${id}`
    a.download = ""
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── Section 1: Header + status bar ────────────────────────────────── */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-100">Backup y recuperacion</h2>
            <p className="mt-1 text-sm text-stone-500">
              Backups diarios automaticos a las 03:00 UTC. Retencion: 30 copias.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-sky-500/10 px-4 py-3 text-sm text-sky-400 ring-1 ring-sky-500/20">
            <Database className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              El sistema guarda los datos en Vercel Blob si{" "}
              <code className="rounded bg-sky-500/10 px-1 text-xs">BLOB_READ_WRITE_TOKEN</code> esta
              configurado, o en la base de datos como fallback. Configura{" "}
              <code className="rounded bg-sky-500/10 px-1 text-xs">BLOB_READ_WRITE_TOKEN</code> en
              Vercel → Settings → Environment Variables para habilitar el almacenamiento externo.
            </p>
          </div>
        </div>

        {/* ── Section 2: Historial ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-stone-800 bg-stone-900">
          {/* Section header */}
          <div className="flex items-center justify-between border-b border-stone-800 px-5 py-4">
            <h3 className="text-sm font-semibold text-stone-100">Historial de backups</h3>
            <div className="flex items-center gap-3">
              {createMsg && (
                <span
                  className={`text-xs ${
                    createMsg.type === "error" ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {createMsg.text}
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={creating}
                onClick={handleCreate}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Crear backup ahora
              </Button>
            </div>
          </div>

          {/* Fetch error */}
          {fetchError && (
            <div className="m-5 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
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

          {/* Empty state */}
          {!loading && !fetchError && backups.length === 0 && (
            <div className="m-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-700 py-12 text-center">
              <HardDriveDownload
                className="mb-3 size-8 text-stone-600"
                aria-hidden="true"
              />
              <p className="text-sm text-stone-500">
                No hay backups registrados todavia. Crea el primero manualmente.
              </p>
            </div>
          )}

          {/* Backup list */}
          {!loading && !fetchError && backups.length > 0 && (
            <ul role="list" className="divide-y divide-stone-800">
              {backups.map((backup) => (
                <li key={backup.id}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left info */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={backup.status} />
                        <span className="text-sm font-medium text-stone-200 tabular-nums">
                          {formatFecha(backup.createdAt)}
                        </span>
                        {backup.completedAt && (
                          <span className="text-xs text-stone-600">
                            (completado {formatFecha(backup.completedAt)})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {/* Triggered by */}
                        <span className="text-xs text-stone-400">
                          {formatTriggeredBy(backup.triggeredBy)}
                        </span>

                        {/* Storage type */}
                        {backup.blobUrl ? (
                          <span className="inline-flex items-center gap-1 text-xs text-sky-400">
                            <HardDriveDownload className="size-3" aria-hidden="true" />
                            Blob externo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                            <Database className="size-3" aria-hidden="true" />
                            BD (fallback)
                          </span>
                        )}

                        {/* Stats summary */}
                        <span className="text-xs text-stone-500">
                          {backup.stats.reservas} reservas · {backup.stats.turnos} turnos
                        </span>

                        {/* Size */}
                        <span className="text-xs text-stone-600">
                          {formatSize(backup.sizeBytes)}
                        </span>
                      </div>

                      {/* Error message */}
                      {backup.error && (
                        <p className="text-xs text-red-400">{backup.error}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-1">
                      {/* Download */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(backup.id)}
                        aria-label="Descargar backup"
                        className="px-2"
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(backup.id)}
                        aria-label="Eliminar backup"
                        className="px-2 text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>

                      {/* Restore */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedRestore(
                            selectedRestore === backup.id ? null : backup.id
                          )
                        }
                        aria-label="Restaurar desde este backup"
                        aria-expanded={selectedRestore === backup.id}
                        className="gap-1.5 px-3 text-amber-400 hover:text-amber-300"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Restaurar
                      </Button>
                    </div>
                  </div>

                  {/* ── Section 3: Restore panel (conditional) ────────────── */}
                  {selectedRestore === backup.id && (
                    <div className="border-t border-stone-800 px-5 pb-5">
                      <RestorePanel
                        backup={backup}
                        onClose={() => setSelectedRestore(null)}
                        onRestored={() => {
                          // Keep panel open to show result — close handled inside panel
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
