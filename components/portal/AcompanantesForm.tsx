"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  Telescope,
  Users,
  User,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface AcompananteLocal {
  id?: string // undefined = nuevo (no persisted)
  nombre: string
  apellido: string
  documento: string
}

export interface AcompanantesFormLabels {
  title: string
  subtitle: string
  backToBooking: string
  holderLabel: string
  companionN: string
  noCompanionsYet: string
  addCompanion: string
  remove: string
  nombreLabel: string
  nombrePlaceholder: string
  apellidoLabel: string
  apellidoPlaceholder: string
  documentoLabel: string
  documentoPlaceholder: string
  totalPersons: string
  maxPersons: string
  passwordLabel: string
  passwordPlaceholder: string
  save: string
  saving: string
  successTitle: string
  successBody: string
  backAfterSuccess: string
  errorInvalidPassword: string
  errorNoCupos: string
  errorWindowClosed: string
  errorMax: string
  errorGeneric: string
  windowClosedTitle: string
  windowClosedBody: string
  cancelledTitle: string
  cancelledBody: string
}

interface AcompanantesFormProps {
  token: string
  titular: { nombre: string; apellido: string }
  acompanantesIniciales: AcompananteLocal[]
  dentroVentana: boolean
  reservaAnulada: boolean
  labels: AcompanantesFormLabels
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function AcompanantesForm({
  token,
  titular,
  acompanantesIniciales,
  dentroVentana,
  reservaAnulada,
  labels,
}: AcompanantesFormProps) {
  const router = useRouter()

  const [companions, setCompanions] = useState<AcompananteLocal[]>(
    acompanantesIniciales.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
      documento: a.documento ?? "",
    }))
  )
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const totalPersons = companions.length + 1 // +1 for holder
  const canAdd = totalPersons < 10

  /* ---- companion field helpers ---- */

  function addCompanion() {
    if (!canAdd) return
    setCompanions((prev) => [...prev, { nombre: "", apellido: "", documento: "" }])
  }

  function removeCompanion(index: number) {
    setCompanions((prev) => prev.filter((_, i) => i !== index))
  }

  function updateCompanion(
    index: number,
    field: keyof AcompananteLocal,
    value: string
  ) {
    setCompanions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  /* ---- submit ---- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation: all nombre + apellido must be non-empty
    for (const c of companions) {
      if (!c.nombre.trim() || !c.apellido.trim()) {
        setError("Completa el nombre y apellido de todos los acompañantes.")
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reservas/${token}/acompanantes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          acompanantes: companions.map((c) => ({
            nombre: c.nombre.trim(),
            apellido: c.apellido.trim(),
            documento: c.documento.trim() || undefined,
          })),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg = data.error as string | undefined
        if (msg?.includes("Contraseña") || res.status === 401) {
          setError(labels.errorInvalidPassword)
        } else if (msg?.includes("cupos") || res.status === 409) {
          setError(labels.errorNoCupos)
        } else if (res.status === 403) {
          setError(labels.errorWindowClosed)
        } else if (res.status === 422 || msg?.includes("10")) {
          setError(labels.errorMax)
        } else {
          setError(labels.errorGeneric)
        }
        return
      }

      setSuccess(true)
    } catch {
      setError(labels.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Success screen                                                     */
  /* ---------------------------------------------------------------- */

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-arena-50 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-3xl bg-white ring-1 ring-tierra-500/20 shadow-xl p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="font-playfair font-black text-tinta-900 text-2xl mb-2">
            {labels.successTitle}
          </h1>
          <p className="text-sm text-tinta-500 font-franklin leading-relaxed mb-8">
            {labels.successBody}
          </p>
          <Link
            href={`/mi-reserva/${token}`}
            className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-tierra-700 text-arena-50 hover:bg-tierra-600 transition-colors font-franklin font-semibold text-sm px-6 py-3"
          >
            {labels.backAfterSuccess}
          </Link>
        </motion.div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Blocked screens (window closed / cancelled)                       */
  /* ---------------------------------------------------------------- */

  if (reservaAnulada) {
    return (
      <div className="min-h-[100dvh] bg-arena-50 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-red-300 p-8 text-center">
          <XCircle className="size-8 text-red-500 mx-auto mb-4" />
          <h1 className="font-playfair font-black text-tinta-900 text-xl mb-2">
            {labels.cancelledTitle}
          </h1>
          <p className="text-sm text-tinta-500 mb-6">{labels.cancelledBody}</p>
          <Link
            href={`/mi-reserva/${token}`}
            className="inline-flex items-center gap-1.5 text-sm text-tierra-600 hover:text-tierra-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {labels.backToBooking}
          </Link>
        </div>
      </div>
    )
  }

  if (!dentroVentana) {
    return (
      <div className="min-h-[100dvh] bg-arena-50 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-stone-200 p-8 text-center">
          <Clock className="size-8 text-tinta-400 mx-auto mb-4" />
          <h1 className="font-playfair font-black text-tinta-900 text-xl mb-2">
            {labels.windowClosedTitle}
          </h1>
          <p className="text-sm text-tinta-500 mb-6">{labels.windowClosedBody}</p>
          <Link
            href={`/mi-reserva/${token}`}
            className="inline-flex items-center gap-1.5 text-sm text-tierra-600 hover:text-tierra-700 transition-colors"
          >
            <ChevronLeft className="size-4" />
            {labels.backToBooking}
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Main form                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-[100dvh] bg-arena-50">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-tinta-950/95 backdrop-blur-sm border-b border-tinta-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href={`/mi-reserva/${token}`}
            className="flex items-center gap-1.5 text-tinta-400 hover:text-tierra-400 transition-colors"
            aria-label={labels.backToBooking}
          >
            <ChevronLeft className="size-4" />
            <Telescope className="size-4 text-tierra-500" />
          </Link>
          <span className="text-sm font-franklin text-tinta-300 hidden sm:block">
            {labels.title}
          </span>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="font-playfair font-black text-tinta-900 text-2xl sm:text-3xl mb-1">
            {labels.title}
          </h1>
          <p className="text-sm text-tinta-500 font-franklin">{labels.subtitle}</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* ── PERSONS LIST ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl bg-white ring-1 ring-tierra-500/15 overflow-hidden"
          >
            {/* Card header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-franklin font-semibold text-tinta-800 text-sm flex items-center gap-2">
                <Users className="size-4 text-tierra-400" />
                <span>
                  {labels.totalPersons.replace("{count}", String(totalPersons))}
                </span>
              </h2>
              <span className="text-xs text-tinta-400">{labels.maxPersons}</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Holder row — read-only */}
              <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-stone-50 border border-stone-200">
                <User className="size-4 text-tierra-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-tinta-400 mb-0.5">{labels.holderLabel}</p>
                  <p className="text-sm font-semibold text-tinta-800 truncate">
                    {titular.nombre} {titular.apellido}
                  </p>
                </div>
              </div>

              {/* Companion rows */}
              <AnimatePresence initial={false}>
                {companions.map((companion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                      {/* Companion header */}
                      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-100">
                        <span className="text-xs font-semibold text-tinta-500 font-franklin">
                          {labels.companionN.replace("{n}", String(index + 1))}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCompanion(index)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors rounded-md px-1.5 py-0.5 hover:bg-red-50"
                          aria-label={`${labels.remove} acompañante ${index + 1}`}
                        >
                          <Trash2 className="size-3" />
                          {labels.remove}
                        </button>
                      </div>

                      {/* Companion fields */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Nombre */}
                        <div>
                          <label
                            htmlFor={`companion-${index}-nombre`}
                            className="block text-xs font-medium text-tinta-600 mb-1"
                          >
                            {labels.nombreLabel} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id={`companion-${index}-nombre`}
                            type="text"
                            placeholder={labels.nombrePlaceholder}
                            value={companion.nombre}
                            onChange={(e) =>
                              updateCompanion(index, "nombre", e.target.value)
                            }
                            required
                            autoComplete="given-name"
                          />
                        </div>

                        {/* Apellido */}
                        <div>
                          <label
                            htmlFor={`companion-${index}-apellido`}
                            className="block text-xs font-medium text-tinta-600 mb-1"
                          >
                            {labels.apellidoLabel} <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id={`companion-${index}-apellido`}
                            type="text"
                            placeholder={labels.apellidoPlaceholder}
                            value={companion.apellido}
                            onChange={(e) =>
                              updateCompanion(index, "apellido", e.target.value)
                            }
                            required
                            autoComplete="family-name"
                          />
                        </div>

                        {/* Documento */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`companion-${index}-documento`}
                            className="block text-xs font-medium text-tinta-600 mb-1"
                          >
                            {labels.documentoLabel}
                          </label>
                          <Input
                            id={`companion-${index}-documento`}
                            type="text"
                            placeholder={labels.documentoPlaceholder}
                            value={companion.documento}
                            onChange={(e) =>
                              updateCompanion(index, "documento", e.target.value)
                            }
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {companions.length === 0 && (
                <p className="text-sm text-tinta-400 italic text-center py-2">
                  {labels.noCompanionsYet}
                </p>
              )}

              {/* Add button */}
              {canAdd && (
                <button
                  type="button"
                  onClick={addCompanion}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-tierra-300 text-tierra-600 hover:border-tierra-400 hover:text-tierra-700 hover:bg-tierra-50 transition-all py-3 text-sm font-medium font-franklin"
                >
                  <Plus className="size-4" />
                  {labels.addCompanion}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── PASSWORD ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl bg-white ring-1 ring-tierra-500/15 p-5"
          >
            <label
              htmlFor="action-password"
              className="block text-sm font-medium text-tinta-700 mb-1.5"
            >
              {labels.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tinta-400 pointer-events-none" />
              <input
                id="action-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={labels.passwordPlaceholder}
                required
                className="w-full rounded-lg border border-stone-300 bg-stone-50 pl-10 pr-10 py-2.5 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-tierra-500/60 focus:border-tierra-500 hover:border-stone-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tinta-400 hover:text-tinta-600 transition-colors"
                aria-label={showPassword ? "Ocultar" : "Mostrar"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </motion.div>

          {/* ── ERROR ──────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SUBMIT ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className={cn(
                "w-full rounded-full bg-tierra-700 text-arena-50 hover:bg-tierra-600",
                "focus-visible:ring-tierra-500/50"
              )}
            >
              {loading ? labels.saving : labels.save}
            </Button>

            <Link
              href={`/mi-reserva/${token}`}
              className="flex items-center justify-center gap-1.5 text-sm text-tinta-500 hover:text-tierra-600 transition-colors py-1"
            >
              <ChevronLeft className="size-3.5" />
              {labels.backToBooking}
            </Link>
          </motion.div>

        </form>

        <div className="h-12" />
      </main>
    </div>
  )
}
