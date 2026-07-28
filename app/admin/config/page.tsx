"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  AlertCircle,
  Save,
  CheckCircle2,
  CalendarCog,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

type ConfigTipo = "number" | "text" | "boolean" | "secret"

interface ConfigMeta {
  label: string
  descripcion: string
  tipo: ConfigTipo
  min?: number
  max?: number
  /** Solo para tipo "secret": qué se muestra bajo el campo cuando ya está puesta. */
  nota?: string
}

const CONFIG_META: Record<string, ConfigMeta> = {
  HORA_CIERRE_VIERNES: {
    label: "Hora de cierre el viernes",
    descripcion:
      "Hora (14-20) en que se cierran las reservas el viernes previo a la visita. Zona horaria: Santiago.",
    tipo: "number",
    min: 14,
    max: 20,
  },
  MAX_PERSONAS_CLIENTE: {
    label: "Max. personas por reserva (cliente)",
    descripcion:
      "Limite de personas que puede reservar un cliente. El admin puede superar este limite.",
    tipo: "number",
    min: 1,
    max: 10,
  },
  EMAIL_CONTACTO: {
    label: "Email de contacto",
    descripcion: "Email que aparece en comunicaciones al cliente.",
    tipo: "text",
  },
  WHATSAPP_ENABLED: {
    label: "WhatsApp habilitado",
    descripcion: "Activa o desactiva el envio de notificaciones por WhatsApp.",
    tipo: "boolean",
  },
  VENTANA_RESERVA_DIAS: {
    label: "Ventana de reserva (dias)",
    descripcion:
      "El sistema mantiene turnos disponibles este numero de dias hacia adelante. " +
      "El cron los genera automaticamente 2 veces al dia. 0 = desactivar generacion automatica.",
    tipo: "number",
    min: 0,
    max: 360,
  },
  BACKUP_ENCRYPTION_KEY: {
    label: "Clave de cifrado de respaldos",
    descripcion:
      "Cifra el respaldo diario antes de subirlo al almacenamiento externo. Sin ella la copia " +
      "se queda dentro de la base de datos. 64 caracteres hexadecimales, generados con " +
      "scripts/generar-clave-backup.mjs.",
    tipo: "secret",
    nota:
      "Guardala tambien en el gestor de contrasenas del equipo. Es la unica forma de restaurar " +
      "un respaldo externo, y cambiarla deja ilegibles los que ya estan subidos.",
  },
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfigEntry {
  clave: string
  valor: string
  descripcion: string | null
  updatedAt: string
  updatedBy: string | null
  /** true si la API oculta el valor. Los secretos llegan siempre con valor "". */
  secreto?: boolean
  /** true si hay un valor guardado, aunque no venga en la respuesta. */
  configurado?: boolean
}

type ConfigMap = Record<string, ConfigEntry>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFechaHoraES(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

interface FieldProps {
  clave: string
  meta: ConfigMeta
  value: string
  entry: ConfigEntry | undefined
  onChange: (clave: string, value: string) => void
}

function ConfigField({ clave, meta, value, entry, onChange }: FieldProps) {
  const inputId = `config-${clave}`

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <label htmlFor={inputId} className="block text-sm font-semibold text-stone-100">
            {meta.label}
          </label>
          <p className="mt-0.5 text-xs text-stone-500">{meta.descripcion}</p>
        </div>
        {entry && (
          <div className="shrink-0 text-right text-xs text-stone-600">
            <span>Actualizado: {formatFechaHoraES(entry.updatedAt)}</span>
            {entry.updatedBy && (
              <span className="ml-1 text-stone-700">por {entry.updatedBy}</span>
            )}
          </div>
        )}
      </div>

      {meta.tipo === "boolean" ? (
        <label className="flex cursor-pointer items-center gap-3" htmlFor={inputId}>
          <div className="relative">
            <input
              id={inputId}
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => onChange(clave, e.target.checked ? "true" : "false")}
              className="sr-only"
              role="switch"
              aria-checked={value === "true"}
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors duration-200 ${
                value === "true" ? "bg-amber-500" : "bg-stone-700"
              }`}
              aria-hidden="true"
            />
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                value === "true" ? "translate-x-5" : "translate-x-0.5"
              }`}
              aria-hidden="true"
            />
          </div>
          <span className="text-sm text-stone-300">
            {value === "true" ? "Habilitado" : "Deshabilitado"}
          </span>
        </label>
      ) : meta.tipo === "number" ? (
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={(e) => onChange(clave, e.target.value)}
          min={meta.min}
          max={meta.max}
          className="w-40 rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      ) : meta.tipo === "secret" ? (
        <div className="space-y-2">
          <input
            id={inputId}
            type="password"
            value={value}
            onChange={(e) => onChange(clave, e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            placeholder={
              entry?.configurado
                ? "Ya guardada. Escribe una nueva solo si quieres reemplazarla."
                : "64 caracteres hexadecimales"
            }
            aria-describedby={`${inputId}-estado`}
            className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 font-mono text-sm text-stone-100 placeholder:font-sans placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p id={`${inputId}-estado`} className="flex items-start gap-1.5 text-xs">
            {entry?.configurado ? (
              <>
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-green-400"
                  aria-hidden="true"
                />
                <span className="text-green-400">
                  Configurada.{" "}
                  <span className="text-stone-500">{meta.nota}</span>
                </span>
              </>
            ) : (
              <>
                <ShieldAlert
                  className="mt-0.5 size-3.5 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span className="text-amber-400">
                  Sin configurar. El respaldo diario se queda dentro de la base de datos.
                </span>
              </>
            )}
          </p>
        </div>
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(clave, e.target.value)}
          className="w-full max-w-sm rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConfigPage() {
  const [entries, setEntries] = useState<ConfigMap>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true)
      setFetchError(null)
      try {
        const res = await fetch("/api/admin/config")
        if (!res.ok) throw new Error("Error al cargar la configuracion.")
        const { data }: { data: ConfigEntry[] } = await res.json()

        const map: ConfigMap = {}
        const vals: Record<string, string> = {}

        // Start with defaults for all known keys
        for (const clave of Object.keys(CONFIG_META)) {
          vals[clave] = ""
        }

        for (const entry of data) {
          map[entry.clave] = entry
          vals[entry.clave] = entry.valor
        }

        setEntries(map)
        setValues(vals)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Error desconocido.")
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  function handleChange(clave: string, value: string) {
    setValues((prev) => ({ ...prev, [clave]: value }))
    setSaveMsg(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)

    try {
      // Un secreto en blanco significa "no lo toques". El navegador nunca recibe
      // el valor guardado, asi que mandarlo vacio lo borraria cada vez que
      // alguien cambie cualquier otra opcion.
      const payload = Object.entries(values)
        .filter(
          ([clave, valor]) =>
            CONFIG_META[clave]?.tipo !== "secret" || valor.trim().length > 0
        )
        .map(([clave, valor]) => ({ clave, valor }))

      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al guardar la configuracion.")
      }

      // Refresh entries to get updated timestamps
      const refreshed = await fetch("/api/admin/config")
      if (refreshed.ok) {
        const { data }: { data: ConfigEntry[] } = await refreshed.json()
        const map: ConfigMap = {}
        for (const entry of data) {
          map[entry.clave] = entry
        }
        setEntries(map)
      }

      // Los secretos no se quedan escritos en el campo despues de guardar. El
      // estado bajo el input pasa a "Configurada" y eso basta como confirmacion.
      setValues((prev) => {
        const limpio = { ...prev }
        for (const [clave, meta] of Object.entries(CONFIG_META)) {
          if (meta.tipo === "secret") limpio[clave] = ""
        }
        return limpio
      })

      setSaveMsg({ text: "Configuracion guardada correctamente.", type: "success" })
    } catch (err) {
      setSaveMsg({
        text: err instanceof Error ? err.message : "Error desconocido.",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerar() {
    setGenerating(true)
    setGenMsg(null)

    try {
      const res = await fetch("/api/admin/turnos/generar", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al generar turnos.")
      }
      const data: { creados: number; laSilla: number; paranal: number } = await res.json()
      setGenMsg({
        text: `${data.creados} turno(s) creado(s) — La Silla: ${data.laSilla}, Paranal: ${data.paranal}.`,
        type: "success",
      })
    } catch (err) {
      setGenMsg({
        text: err instanceof Error ? err.message : "Error desconocido.",
        type: "error",
      })
    } finally {
      setGenerating(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <h2 className="text-xl font-semibold text-stone-100">Configuracion del sistema</h2>

        {/* Error de carga */}
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

        {!loading && !fetchError && (
          <>
            <form onSubmit={handleSave} className="space-y-4">
              {Object.entries(CONFIG_META).map(([clave, meta]) => (
                <ConfigField
                  key={clave}
                  clave={clave}
                  meta={meta}
                  value={values[clave] ?? ""}
                  entry={entries[clave]}
                  onChange={handleChange}
                />
              ))}

              {/* Save message */}
              {saveMsg && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ring-1 ${
                    saveMsg.type === "error"
                      ? "bg-red-500/10 text-red-400 ring-red-500/20"
                      : "bg-green-500/10 text-green-400 ring-green-500/20"
                  }`}
                >
                  {saveMsg.type === "error" ? (
                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  {saveMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md" loading={saving}>
                  <Save className="size-4" aria-hidden="true" />
                  Guardar cambios
                </Button>
              </div>
            </form>

            {/* ── Regenerar calendario ─────────────────────────────────────── */}
            <div className="rounded-xl border border-stone-700 bg-stone-900 p-5">
              <div className="mb-1 flex items-center gap-2">
                <CalendarCog className="size-4 text-amber-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-stone-100">
                  Regenerar calendario ahora
                </h3>
              </div>
              <p className="mb-4 text-xs text-stone-500">
                Crea los turnos de sabados que falten dentro de la ventana configurada. El cron lo
                hace automaticamente 2 veces al dia; usa este boton para forzarlo de inmediato tras
                cambiar la ventana o ante cualquier incidencia.
              </p>

              {genMsg && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ring-1 ${
                    genMsg.type === "error"
                      ? "bg-red-500/10 text-red-400 ring-red-500/20"
                      : "bg-green-500/10 text-green-400 ring-green-500/20"
                  }`}
                >
                  {genMsg.type === "error" ? (
                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  {genMsg.text}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                size="md"
                loading={generating}
                onClick={handleGenerar}
              >
                <CalendarCog className="size-4" aria-hidden="true" />
                Generar turnos faltantes
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}
