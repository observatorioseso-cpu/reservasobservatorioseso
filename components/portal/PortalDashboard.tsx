"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Users,
  MapPin,
  Telescope,
  ChevronLeft,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Globe,
  User,
  Mail,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

type Estado = "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA" | "AUSENTE"

interface Acompanante {
  id: string
  nombre: string
  apellido: string
  documento: string | null
}

interface ReservaData {
  id: string
  token: string
  shortId: string
  estado: Estado
  observatorio: string
  nombre: string
  apellido: string
  email: string
  cantidadPersonas: number
  idioma: string
  fechaLimiteConfirmacion: string
  confirmadaEn: string | null
  turno: { fecha: string; horaInicio: string; horaFin: string }
  acompanantes: Acompanante[]
}

export interface PortalDashboardLabels {
  confirm: string
  cancel: string
  cancelConfirm: string
  changeDate: string
  yes: string
  no: string
  heroObservatoryLabel: string
  bookingCodeLabel: string
  deadlineTitle: string
  deadlineBody: string
  deadlineConfirmBefore: string
  deadlinePassed: string
  deadlinePassedBody: string
  detailsTitle: string
  detailsObservatory: string
  detailsDate: string
  detailsGroup: string
  detailsLanguage: string
  detailsConfirmedOn: string
  detailsHolder: string
  companions: string
  companionsCount: string
  companionsNone: string
  companionsManage: string
  companionsAdd: string
  actionWindowClosed: string
  actionWindowClosedBody: string
  statusConfirmed: string
  statusPending: string
  statusCancelled: string
  statusAbsent: string
  statusConfirmedMsg: string
  statusCancelledMsg: string
  statusCancelledContact: string
  passwordActionLabel: string
  person: string
  persons: string
  langSpanish: string
  langEnglish: string
  errorConnection: string
  logout: string
}

interface PortalDashboardProps {
  reserva: ReservaData
  fechaLimiteFormateada: string
  labels: PortalDashboardLabels
}

/* ------------------------------------------------------------------ */
/* Static config maps                                                   */
/* ------------------------------------------------------------------ */

const OBS_NAMES: Record<string, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal (VLT)",
}

const OBS_HERO_IMAGE: Record<string, string> = {
  LA_SILLA: "/images/lasilla-sunset.jpg",
  PARANAL: "/images/paranal-dusk.jpg",
}

/* Status badge classes per state */
const STATUS_BADGE: Record<Estado, string> = {
  PENDIENTE_CONFIRMACION:
    "text-amber-700 bg-amber-100/90 border border-amber-400/60",
  CONFIRMADA:
    "text-emerald-700 bg-emerald-100/90 border border-emerald-400/60",
  ANULADA:
    "text-red-600 bg-red-100/90 border border-red-400/60",
  AUSENTE:
    "text-tinta-600 bg-arena-100/90 border border-tinta-400/40",
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatDate(isoDate: string, locale: "es" | "en" = "es"): string {
  const d = new Date(isoDate + "T12:00:00Z") // noon UTC avoids TZ drift
  return d.toLocaleDateString(locale === "es" ? "es-CL" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function PortalDashboard({
  reserva,
  fechaLimiteFormateada,
  labels,
}: PortalDashboardProps) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const dentroVentana = new Date() < new Date(reserva.fechaLimiteConfirmacion)
  const nombreObs = OBS_NAMES[reserva.observatorio] ?? reserva.observatorio
  const heroImage = OBS_HERO_IMAGE[reserva.observatorio] ?? "/images/lasilla-sunset.jpg"
  const statusBadge = STATUS_BADGE[reserva.estado] ?? STATUS_BADGE.PENDIENTE_CONFIRMACION

  const numPersonas = reserva.cantidadPersonas
  const personasLabel =
    numPersonas === 1
      ? `1 ${labels.person}`
      : `${numPersonas} ${labels.persons}`

  const idiomaLabel =
    reserva.idioma === "EN" ? labels.langEnglish : labels.langSpanish

  const fechaFormateada = formatDate(reserva.turno.fecha)

  function getStatusLabel(): string {
    switch (reserva.estado) {
      case "CONFIRMADA":
        return labels.statusConfirmed
      case "ANULADA":
        return labels.statusCancelled
      case "AUSENTE":
        return labels.statusAbsent
      default:
        return labels.statusPending
    }
  }

  function getStatusIcon() {
    switch (reserva.estado) {
      case "CONFIRMADA":
        return <CheckCircle2 className="size-4" />
      case "ANULADA":
        return <XCircle className="size-4" />
      case "AUSENTE":
        return <XCircle className="size-4" />
      default:
        return <Clock className="size-4" />
    }
  }

  /* API handlers */
  const handleConfirmar = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/reservas/${reserva.token}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error ?? labels.errorConnection)
        return
      }
      router.refresh()
      setConfirmando(false)
      setPassword("")
    } catch {
      setActionError(labels.errorConnection)
    } finally {
      setLoading(false)
    }
  }

  const handleAnular = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/reservas/${reserva.token}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error ?? labels.errorConnection)
        return
      }
      router.refresh()
      setAnulando(false)
      setPassword("")
    } catch {
      setActionError(labels.errorConnection)
    } finally {
      setLoading(false)
    }
  }

  function openConfirmar() {
    setConfirmando(true)
    setAnulando(false)
    setActionError(null)
    setPassword("")
  }

  function openAnular() {
    setAnulando(true)
    setConfirmando(false)
    setActionError(null)
    setPassword("")
  }

  function closePanels() {
    setConfirmando(false)
    setAnulando(false)
    setPassword("")
    setActionError(null)
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                             */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-[100dvh] bg-arena-50">
      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-tinta-950/95 backdrop-blur-sm border-b border-tinta-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-tinta-400 hover:text-tierra-400 transition-colors shrink-0"
            aria-label="Volver al inicio"
          >
            <ChevronLeft className="size-4" />
            <Telescope className="size-4 text-tierra-500" />
          </Link>

          <span className="text-tinta-400 text-sm font-franklin hidden sm:block">
            Mi reserva
          </span>

          <div className="ml-auto flex items-center gap-3">
            <code className="text-xs font-mono text-tinta-300 bg-tinta-900 px-2.5 py-1 rounded-full border border-tinta-800">
              {reserva.shortId}
            </code>
            <Link
              href="/mi-reserva"
              className="text-xs font-franklin text-tinta-500 hover:text-tierra-400 transition-colors"
            >
              {labels.logout}
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section
        className="relative min-h-[300px] sm:min-h-[360px] flex flex-col justify-end"
        style={{ backgroundImage: `url('${heroImage}')`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-label={`Foto del Observatorio ${nombreObs}`}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(12,10,9,0.92) 0%, rgba(12,10,9,0.5) 50%, rgba(12,10,9,0.2) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 pt-20">
          {/* Observatory label */}
          <p className="text-xs font-franklin font-semibold uppercase tracking-widest text-tierra-400 mb-2">
            {labels.heroObservatoryLabel} — {nombreObs}
          </p>

          {/* Booking code */}
          <p className="text-xs font-mono text-tinta-400 mb-3">
            {labels.bookingCodeLabel}: {reserva.shortId}
          </p>

          {/* Status badge — big and prominent */}
          <div className="mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold font-franklin",
                statusBadge
              )}
            >
              {getStatusIcon()}
              {getStatusLabel()}
            </span>
          </div>

          {/* Date — large */}
          <h1 className="font-playfair font-black text-arena-50 text-3xl sm:text-4xl leading-tight capitalize mb-1">
            {fechaFormateada}
          </h1>

          {/* Time slot */}
          <p className="text-lg font-franklin text-tinta-300">
            {reserva.turno.horaInicio} – {reserva.turno.horaFin}
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── COUNTDOWN / DEADLINE CARD ─────────────────────────── */}
        {reserva.estado === "PENDIENTE_CONFIRMACION" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            {dentroVentana ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
                <div className="flex gap-3 mb-4">
                  <div className="shrink-0 mt-0.5">
                    <Clock className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-franklin font-semibold text-amber-800 text-base">
                      {labels.deadlineTitle}
                    </h2>
                    <p className="text-sm text-amber-700 mt-0.5">
                      {labels.deadlineBody}
                    </p>
                    <p className="text-sm text-amber-700 mt-2 font-medium">
                      {labels.deadlineConfirmBefore}: <span className="font-semibold">{fechaLimiteFormateada}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full rounded-xl bg-amber-600 text-white hover:bg-amber-500 focus-visible:ring-amber-500/50"
                  onClick={openConfirmar}
                >
                  <CheckCircle2 className="size-4" />
                  {labels.confirm}
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5 sm:p-6 flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="size-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-franklin font-semibold text-red-700 text-base">
                    {labels.deadlinePassed}
                  </h2>
                  <p className="text-sm text-red-600 mt-0.5">
                    {labels.deadlinePassedBody}{" "}
                    <a
                      href="mailto:reservas@observatorioseso.cl"
                      className="underline underline-offset-2 hover:text-red-800 transition-colors"
                    >
                      reservas@observatorioseso.cl
                    </a>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DETAILS CARD ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl bg-white ring-1 ring-tierra-500/15 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="font-playfair font-bold text-tinta-900 text-lg">
              {labels.detailsTitle}
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {/* Observatory */}
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-tierra-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsObservatory}</p>
                <p className="text-tinta-800 font-semibold">{nombreObs}</p>
              </div>
            </div>

            {/* Date and slot */}
            <div className="flex items-start gap-3">
              <Calendar className="size-4 text-tierra-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsDate}</p>
                <p className="text-tinta-800 font-semibold capitalize">{fechaFormateada}</p>
                <p className="text-tinta-400 text-xs mt-0.5">
                  {reserva.turno.horaInicio} – {reserva.turno.horaFin}
                </p>
              </div>
            </div>

            {/* Group size */}
            <div className="flex items-start gap-3">
              <Users className="size-4 text-tierra-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsGroup}</p>
                <p className="text-tinta-800 font-semibold">{personasLabel}</p>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-start gap-3">
              <Globe className="size-4 text-tierra-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsLanguage}</p>
                <p className="text-tinta-800 font-semibold">{idiomaLabel}</p>
              </div>
            </div>

            {/* Holder */}
            <div className="flex items-start gap-3">
              <User className="size-4 text-tierra-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsHolder}</p>
                <p className="text-tinta-800 font-semibold">{reserva.nombre} {reserva.apellido}</p>
                <p className="text-tinta-400 text-xs mt-0.5 flex items-center gap-1">
                  <Mail className="size-3 shrink-0" />
                  {reserva.email}
                </p>
              </div>
            </div>

            {/* Confirmed on — only if confirmed */}
            {reserva.confirmadaEn && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-tinta-400 text-xs font-medium mb-0.5">{labels.detailsConfirmedOn}</p>
                  <p className="text-tinta-800 font-semibold">
                    {new Date(reserva.confirmadaEn).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── COMPANIONS CARD ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="rounded-2xl bg-white ring-1 ring-tierra-500/15 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-playfair font-bold text-tinta-900 text-lg flex items-center gap-2">
              <Users className="size-4 text-tierra-400" />
              {reserva.acompanantes.length > 0
                ? labels.companionsCount.replace("{count}", String(reserva.acompanantes.length))
                : labels.companions}
            </h2>
            {dentroVentana && reserva.estado !== "ANULADA" && (
              <Link
                href={`/mi-reserva/${reserva.token}/acompanantes`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-tierra-600 hover:text-tierra-700 transition-colors"
              >
                <UserPlus className="size-3.5" />
                {reserva.acompanantes.length > 0 ? labels.companionsManage : labels.companionsAdd}
              </Link>
            )}
          </div>

          <div className="p-5">
            {reserva.acompanantes.length === 0 ? (
              <p className="text-sm text-tinta-400 italic">{labels.companionsNone}</p>
            ) : (
              <ul className="space-y-2.5">
                {reserva.acompanantes.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between text-sm border-b border-stone-100 last:border-0 pb-2.5 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-tinta-300 shrink-0" />
                      <span className="text-tinta-800 font-medium">
                        {a.nombre} {a.apellido}
                      </span>
                    </div>
                    {a.documento && (
                      <span className="text-xs text-tinta-400 font-mono">{a.documento}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        {/* ── ACTIONS SECTION ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="space-y-4"
        >
          {/* CONFIRMED state */}
          {reserva.estado === "CONFIRMADA" && (
            <>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">{labels.statusConfirmedMsg}</p>
              </div>
              {dentroVentana && (
                <button
                  onClick={openAnular}
                  className="w-full text-sm text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-1.5 py-2"
                >
                  <XCircle className="size-4" />
                  {labels.cancel}
                </button>
              )}
            </>
          )}

          {/* PENDING state + inside window */}
          {reserva.estado === "PENDIENTE_CONFIRMACION" && dentroVentana && (
            <div className="flex gap-3">
              <button
                onClick={openAnular}
                className="flex-1 text-sm text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 py-2.5"
              >
                <XCircle className="size-4" />
                {labels.cancel}
              </button>
            </div>
          )}

          {/* CANCELLED state */}
          {reserva.estado === "ANULADA" && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-5">
              <div className="flex gap-3 mb-2">
                <XCircle className="size-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800 font-semibold">{labels.statusCancelledMsg}</p>
              </div>
              <p className="text-xs text-red-600 pl-8">
                {labels.statusCancelledContact}
              </p>
            </div>
          )}

          {/* Window closed (not cancelled) */}
          {!dentroVentana && reserva.estado !== "ANULADA" && reserva.estado !== "CONFIRMADA" && (
            <div className="rounded-2xl bg-stone-100 border border-stone-200 px-5 py-5">
              <div className="flex gap-3 mb-1">
                <Clock className="size-5 text-tinta-400 mt-0.5 shrink-0" />
                <p className="text-sm text-tinta-700 font-semibold">{labels.actionWindowClosed}</p>
              </div>
              <p className="text-xs text-tinta-500 pl-8">
                {labels.actionWindowClosedBody}{" "}
                <a
                  href="mailto:reservas@observatorioseso.cl"
                  className="underline underline-offset-2 hover:text-tinta-700 transition-colors"
                >
                  reservas@observatorioseso.cl
                </a>
              </p>
            </div>
          )}
        </motion.div>

        {/* ── PASSWORD ACTION PANEL ─────────────────────────────── */}
        <AnimatePresence>
          {(confirmando || anulando) && (
            <motion.div
              key="password-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "rounded-2xl border p-5 sm:p-6 space-y-4",
                anulando
                  ? "border-red-300 bg-red-50"
                  : "border-amber-300 bg-amber-50"
              )}
            >
              {anulando && (
                <div className="flex items-start gap-2 text-sm text-red-700 font-medium">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-500" />
                  {labels.cancelConfirm}
                </div>
              )}

              <div>
                <label
                  htmlFor="action-password"
                  className="block text-sm font-medium text-stone-700 mb-1.5"
                >
                  {labels.passwordActionLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tinta-400 pointer-events-none" />
                  <input
                    id="action-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-stone-50 pl-10 pr-10 py-2.5 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-tierra-500/60 focus:border-tierra-500 hover:border-stone-400 transition-colors"
                    autoFocus
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
              </div>

              {actionError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {actionError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant={anulando ? "danger" : "primary"}
                  size="md"
                  loading={loading}
                  onClick={anulando ? handleAnular : handleConfirmar}
                  className={cn(
                    "flex-1 rounded-xl",
                    !anulando && "bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-500/50"
                  )}
                >
                  {labels.yes}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={closePanels}
                  className="flex-1 rounded-xl border border-stone-300 bg-white text-tinta-700 hover:bg-stone-50"
                >
                  {labels.no}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom spacing */}
        <div className="h-8" />
      </main>
    </div>
  )
}
