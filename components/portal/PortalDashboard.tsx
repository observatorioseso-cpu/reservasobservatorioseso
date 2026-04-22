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
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
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

interface Labels {
  confirm: string
  cancel: string
  cancelConfirm: string
  changeDate: string
  back: string
  yes: string
  no: string
}

interface PortalDashboardProps {
  reserva: ReservaData
  fechaLimiteFormateada: string
  labels: Labels
}

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; icon: React.ReactNode }> = {
  PENDIENTE_CONFIRMACION: {
    label: "Pendiente de confirmación",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    icon: <Clock className="size-4" />,
  },
  CONFIRMADA: {
    label: "Confirmada",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    icon: <CheckCircle2 className="size-4" />,
  },
  ANULADA: {
    label: "Anulada",
    color: "text-red-400 bg-red-400/10 border-red-400/30",
    icon: <XCircle className="size-4" />,
  },
  AUSENTE: {
    label: "No se presentó",
    color: "text-stone-400 bg-stone-400/10 border-stone-400/30",
    icon: <XCircle className="size-4" />,
  },
}

const OBS_NAMES: Record<string, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal (VLT)",
}

export function PortalDashboard({ reserva, fechaLimiteFormateada, labels }: PortalDashboardProps) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmarAnular, setConfirmarAnular] = useState(false)

  const estadoConfig = ESTADO_CONFIG[reserva.estado] ?? ESTADO_CONFIG.PENDIENTE_CONFIRMACION
  const dentroVentana = new Date() < new Date(reserva.fechaLimiteConfirmacion)
  const nombreObs = OBS_NAMES[reserva.observatorio] ?? reserva.observatorio

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
      if (!res.ok) { setActionError(data.error); return }
      router.refresh()
      setConfirmando(false)
      setPassword("")
    } catch {
      setActionError("Error de conexión. Intenta de nuevo.")
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
      if (!res.ok) { setActionError(data.error); return }
      router.refresh()
      setAnulando(false)
      setPassword("")
    } catch {
      setActionError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 transition-colors"
        >
          <ChevronLeft className="size-4" />
          <Telescope className="size-4 text-amber-400" />
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
            {reserva.shortId}
          </p>
          <h1 className="font-playfair font-black text-stone-100 text-xl">
            {reserva.nombre} {reserva.apellido}
          </h1>
        </div>
        <div className="ml-auto">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            estadoConfig.color
          )}>
            {estadoConfig.icon}
            {estadoConfig.label}
          </span>
        </div>
      </header>

      {/* Detalles de la reserva */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 mb-5">
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="size-4 text-stone-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-stone-500 text-xs mb-0.5">Observatorio</p>
              <p className="text-stone-200 font-medium">{nombreObs}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="size-4 text-stone-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-stone-500 text-xs mb-0.5">Fecha y turno</p>
              <p className="text-stone-200 font-medium">{reserva.turno.fecha}</p>
              <p className="text-stone-400 text-xs">{reserva.turno.horaInicio} – {reserva.turno.horaFin}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="size-4 text-stone-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-stone-500 text-xs mb-0.5">Grupo</p>
              <p className="text-stone-200 font-medium">
                {reserva.cantidadPersonas} persona{reserva.cantidadPersonas !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {reserva.confirmadaEn && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Confirmada el</p>
                <p className="text-stone-200 font-medium">
                  {new Date(reserva.confirmadaEn).toLocaleDateString("es-CL")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Plazo de confirmación */}
        {reserva.estado === "PENDIENTE_CONFIRMACION" && (
          <div className={cn(
            "mt-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-2",
            dentroVentana
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-red-800/40 bg-red-950/20 text-red-400"
          )}>
            {dentroVentana
              ? <Clock className="size-4 shrink-0 mt-0.5" />
              : <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            }
            <span>
              {dentroVentana
                ? `Confirma antes de: ${fechaLimiteFormateada}`
                : "El plazo de confirmación ha cerrado. Escribe a reservas@observatorioseso.cl"
              }
            </span>
          </div>
        )}
      </div>

      {/* Acompañantes */}
      {reserva.acompanantes.length > 0 && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 flex items-center gap-2">
              <Users className="size-4 text-stone-600" />
              Acompañantes
            </h2>
            {dentroVentana && reserva.estado !== "ANULADA" && (
              <Link
                href={`/mi-reserva/${reserva.token}/acompanantes`}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                <UserPlus className="size-3.5" />
                Gestionar
              </Link>
            )}
          </div>
          <ul className="space-y-2">
            {reserva.acompanantes.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-300">{a.nombre} {a.apellido}</span>
                {a.documento && (
                  <span className="text-xs text-stone-600">{a.documento}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones — solo si está dentro de la ventana */}
      {dentroVentana && reserva.estado !== "ANULADA" && (
        <div className="space-y-3">
          {reserva.estado !== "CONFIRMADA" && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => { setConfirmando(true); setAnulando(false); setActionError(null) }}
            >
              <CheckCircle2 className="size-4" />
              {labels.confirm}
            </Button>
          )}

          <Button
            variant="ghost"
            size="md"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30"
            onClick={() => { setAnulando(true); setConfirmando(false); setActionError(null) }}
          >
            <XCircle className="size-4" />
            {labels.cancel}
          </Button>
        </div>
      )}

      {/* Panel de acción con password */}
      <AnimatePresence>
        {(confirmando || anulando) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              "mt-4 rounded-2xl border p-5 space-y-4",
              anulando
                ? "border-red-800/40 bg-red-950/20"
                : "border-stone-800 bg-stone-900/80"
            )}
          >
            {anulando && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                {labels.cancelConfirm}
              </div>
            )}

            <FormField label="Contraseña de gestión" htmlFor="action-password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-500 pointer-events-none" />
                <Input
                  id="action-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {actionError && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" />
                {actionError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant={anulando ? "danger" : "primary"}
                size="md"
                loading={loading}
                onClick={anulando ? handleAnular : handleConfirmar}
                className="flex-1"
              >
                {labels.yes}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => { setConfirmando(false); setAnulando(false); setPassword(""); setActionError(null) }}
                className="flex-1"
              >
                {labels.no}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
