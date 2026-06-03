"use client"

import { use, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CalendarClock,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Button } from "@/components/ui/Button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Observatorio = "LA_SILLA" | "PARANAL"
type EstadoReserva = "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA"
type IdiomaVisita = "ES" | "EN"
type TipoLogAgente =
  | "VALIDACION"
  | "COMUNICACION"
  | "RECORDATORIO"
  | "AUTOANULACION"
  | "PDF"
  | "MODIFICACION"
  | "CONFIRMACION"
  | "ANULACION"
  | "EMAIL"
  | "WHATSAPP"
  | "ERROR"

interface Acompanante {
  id: string
  nombre: string
  apellido: string
  documento: string | null
  esMenor?: boolean
}

const TIPO_VISITANTE_LABELS: Record<string, string> = {
  PERSONAL: "Personal / Familiar",
  COLEGIO: "Colegio",
  INSTITUTO: "Instituto",
  UNIVERSIDAD: "Universidad",
  EMPRESA: "Empresa",
  AGENCIA_VIAJES: "Agencia de viajes",
  OTRO: "Otra",
}

interface LogAgente {
  id: string
  tipo: TipoLogAgente
  resultado: string
  duracionMs: number | null
  createdAt: string
}

interface ReservaDetalle {
  token: string
  shortId: string
  observatorio: Observatorio
  turno: {
    id: string
    fecha: string
    horaInicio: string
    horaFin: string
  }
  estado: EstadoReserva
  fechaLimiteConfirmacion: string
  confirmadaEn: string | null
  nombre: string
  apellido: string
  rutOPasaporte: string
  email: string
  telefono: string
  idioma: IdiomaVisita
  cantidadPersonas: number
  tienesMenores: boolean
  titularEsMenor?: boolean
  tipoVisitante?: string
  organizacion?: string | null
  nacionalidad?: string | null
  ciudadResidencia?: string | null
  infoAdicional?: string | null
  notaAdmin: string | null
  acompanantes: Acompanante[]
  logsAgente: LogAgente[]
  createdAt: string
}

interface EditForm {
  nombre: string
  apellido: string
  email: string
  telefono: string
  cantidadPersonas: string
  idioma: IdiomaVisita
  estado: EstadoReserva
  forzarCupos: boolean
}

interface TurnoOpcion {
  id: string
  observatorio: Observatorio
  fecha: string
  horaInicio: string
  horaFin: string
  tipo: "REGULAR" | "NOCTURNA"
  activo: boolean
  capacidadMax: number
  cuposOcupados: number
  cuposLibres: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBS_LABELS: Record<Observatorio, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal",
}

const LOG_TIPO_LABELS: Record<TipoLogAgente, string> = {
  VALIDACION: "Validacion",
  COMUNICACION: "Comunicacion",
  RECORDATORIO: "Recordatorio",
  AUTOANULACION: "Autoanulacion",
  PDF: "PDF",
  MODIFICACION: "Modificacion",
  CONFIRMACION: "Confirmacion",
  ANULACION: "Anulacion",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  ERROR: "Error",
}

function formatFechaES(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

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
// Sub-components
// ---------------------------------------------------------------------------

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900">
      <div className="border-b border-stone-800 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-stone-100">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-200">{value ?? "—"}</dd>
    </div>
  )
}

function InlineAlert({ message, type }: { message: string; type: "error" | "success" }) {
  const styles =
    type === "error"
      ? "bg-red-500/10 text-red-400 ring-red-500/20"
      : "bg-green-500/10 text-green-400 ring-green-500/20"
  const Icon = type === "error" ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ${styles}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ token: string }>
}

export default function ReservaDetallePage({ params }: PageProps) {
  const { token } = use(params)

  const [reserva, setReserva] = useState<ReservaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Action states
  const [confirmando, setConfirmando] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Nota admin
  const [nota, setNota] = useState("")
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [notaMsg, setNotaMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Edicion inline
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [editMsg, setEditMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Reagendar
  const [reagOpen, setReagOpen] = useState(false)
  const [turnos, setTurnos] = useState<TurnoOpcion[]>([])
  const [turnosLoading, setTurnosLoading] = useState(false)
  const [nuevoTurnoId, setNuevoTurnoId] = useState("")
  const [reagForzar, setReagForzar] = useState(false)
  const [reagNotificar, setReagNotificar] = useState(false)
  const [reagendando, setReagendando] = useState(false)
  const [reagMsg, setReagMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Acompañantes — agregar
  const [addForm, setAddForm] = useState({ nombre: "", apellido: "", documento: "" })
  const [addForzar, setAddForzar] = useState(false)
  const [addNotificar, setAddNotificar] = useState(false)
  const [addingAcomp, setAddingAcomp] = useState(false)
  const [acompMsg, setAcompMsg] = useState<{ text: string; type: "error" | "success" } | null>(null)

  // Acompañantes — editar
  const [editAcompId, setEditAcompId] = useState<string | null>(null)
  const [editAcompForm, setEditAcompForm] = useState({ nombre: "", apellido: "", documento: "" })
  const [savingAcomp, setSavingAcomp] = useState(false)
  const [deletingAcompId, setDeletingAcompId] = useState<string | null>(null)

  const fetchReserva = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}`)
      if (!res.ok) throw new Error("No se pudo cargar la reserva.")
      const { data }: { data: ReservaDetalle } = await res.json()
      setReserva(data)
      setNota(data.notaAdmin ?? "")
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchReserva()
  }, [fetchReserva])

  // Open edit form populated with current data
  function openEdit() {
    if (!reserva) return
    setEditForm({
      nombre: reserva.nombre,
      apellido: reserva.apellido,
      email: reserva.email,
      telefono: reserva.telefono,
      cantidadPersonas: String(reserva.cantidadPersonas),
      idioma: reserva.idioma,
      estado: reserva.estado,
      forzarCupos: false,
    })
    setEditMsg(null)
    setEditOpen(true)
  }

  async function handleConfirmar() {
    setConfirmando(true)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/confirmar`, { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al confirmar.")
      }
      setActionMsg({ text: "Reserva confirmada correctamente.", type: "success" })
      await fetchReserva()
    } catch (err) {
      setActionMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setConfirmando(false)
    }
  }

  async function handleAnular() {
    const motivo = window.prompt("Motivo de anulacion (opcional):")
    if (motivo === null) return // cancelled
    setAnulando(true)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al anular.")
      }
      setActionMsg({ text: "Reserva anulada correctamente.", type: "success" })
      await fetchReserva()
    } catch (err) {
      setActionMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setAnulando(false)
    }
  }

  async function handleGuardarNota() {
    setGuardandoNota(true)
    setNotaMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/nota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al guardar la nota.")
      }
      setNotaMsg({ text: "Nota guardada.", type: "success" })
    } catch (err) {
      setNotaMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setGuardandoNota(false)
    }
  }

  async function handleGuardarEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setGuardandoEdit(true)
    setEditMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editForm.nombre,
          apellido: editForm.apellido,
          email: editForm.email,
          telefono: editForm.telefono,
          cantidadPersonas: parseInt(editForm.cantidadPersonas, 10),
          idioma: editForm.idioma,
          estado: editForm.estado,
          forzarCupos: editForm.forzarCupos,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al guardar los cambios.")
      }
      setEditMsg({ text: "Cambios guardados correctamente.", type: "success" })
      await fetchReserva()
    } catch (err) {
      setEditMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setGuardandoEdit(false)
    }
  }

  function setEdit<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [k]: v } : prev))
  }

  // ── Reagendar ──────────────────────────────────────────────────────────
  const fetchTurnos = useCallback(async () => {
    setTurnosLoading(true)
    try {
      const res = await fetch(`/api/admin/turnos?activo=true`)
      if (!res.ok) throw new Error("Error al cargar turnos.")
      const data: TurnoOpcion[] = await res.json()
      // Solo turnos de hoy en adelante, excluyendo el actual
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const opciones = data
        .filter((t) => new Date(t.fecha) >= hoy && t.id !== reserva?.turno.id)
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
      setTurnos(opciones)
    } catch {
      setTurnos([])
    } finally {
      setTurnosLoading(false)
    }
  }, [reserva?.turno.id])

  function toggleReagendar() {
    if (reagOpen) {
      setReagOpen(false)
      return
    }
    setReagMsg(null)
    setNuevoTurnoId("")
    setReagForzar(false)
    setReagNotificar(false)
    setReagOpen(true)
    fetchTurnos()
  }

  async function handleReagendar(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoTurnoId) return
    setReagendando(true)
    setReagMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/reagendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoTurnoId, forzarCupos: reagForzar, notificar: reagNotificar }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al reagendar.")
      }
      setReagMsg({ text: "Reserva reagendada correctamente.", type: "success" })
      setReagOpen(false)
      await fetchReserva()
    } catch (err) {
      setReagMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setReagendando(false)
    }
  }

  // ── Acompañantes ───────────────────────────────────────────────────────
  async function handleAddAcompanante(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.nombre.trim() || !addForm.apellido.trim()) return
    setAddingAcomp(true)
    setAcompMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/acompanantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: addForm.nombre.trim(),
          apellido: addForm.apellido.trim(),
          documento: addForm.documento.trim() || null,
          forzarCupos: addForzar,
          notificar: addNotificar,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al agregar acompañante.")
      }
      setAcompMsg({ text: "Acompañante agregado.", type: "success" })
      setAddForm({ nombre: "", apellido: "", documento: "" })
      setAddForzar(false)
      await fetchReserva()
    } catch (err) {
      setAcompMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setAddingAcomp(false)
    }
  }

  function startEditAcomp(a: Acompanante) {
    setEditAcompId(a.id)
    setEditAcompForm({ nombre: a.nombre, apellido: a.apellido, documento: a.documento ?? "" })
    setAcompMsg(null)
  }

  async function handleSaveAcomp(id: string) {
    setSavingAcomp(true)
    setAcompMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/acompanantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editAcompForm.nombre.trim(),
          apellido: editAcompForm.apellido.trim(),
          documento: editAcompForm.documento.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al editar acompañante.")
      }
      setEditAcompId(null)
      await fetchReserva()
    } catch (err) {
      setAcompMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setSavingAcomp(false)
    }
  }

  async function handleDeleteAcomp(a: Acompanante) {
    const notificar = window.confirm(
      `¿Quitar a ${a.nombre} ${a.apellido} de la reserva?\n\nAceptar = quitar y notificar al titular por email.\nCancelar para abortar.`
    )
    if (!notificar) return
    setDeletingAcompId(a.id)
    setAcompMsg(null)
    try {
      const res = await fetch(`/api/admin/reservas/${token}/acompanantes/${a.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificar: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al quitar acompañante.")
      }
      setAcompMsg({ text: "Acompañante quitado.", type: "success" })
      await fetchReserva()
    } catch (err) {
      setAcompMsg({ text: err instanceof Error ? err.message : "Error desconocido.", type: "error" })
    } finally {
      setDeletingAcompId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-amber-500" aria-label="Cargando..." />
        </div>
      </AdminShell>
    )
  }

  if (fetchError || !reserva) {
    return (
      <AdminShell>
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {fetchError ?? "No se encontro la reserva."}
        </div>
      </AdminShell>
    )
  }

  const cantidadActual = editForm ? parseInt(editForm.cantidadPersonas, 10) : reserva.cantidadPersonas
  const cuposAumentan = !isNaN(cantidadActual) && cantidadActual > reserva.cantidadPersonas
  const esAnulada = reserva.estado === "ANULADA"

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm text-stone-400">
          <Link href="/admin/reservas" className="hover:text-stone-100 transition-colors">
            Reservas
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span className="font-mono text-sky-300">{reserva.shortId}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Datos del titular */}
            <Card title="Datos del titular">
              <dl className="divide-y divide-stone-800">
                <FieldRow label="Nombre" value={`${reserva.nombre} ${reserva.apellido}`} />
                <FieldRow label="RUT / Pasaporte" value={<span className="font-mono">{reserva.rutOPasaporte}</span>} />
                <FieldRow label="Email" value={<a href={`mailto:${reserva.email}`} className="text-sky-300 hover:text-sky-200">{reserva.email}</a>} />
                <FieldRow label="Telefono" value={reserva.telefono} />
                <FieldRow label="Idioma" value={reserva.idioma === "ES" ? "Espanol" : "Ingles"} />
                <FieldRow label="Nacionalidad" value={reserva.nacionalidad || "—"} />
                <FieldRow label="Ciudad" value={reserva.ciudadResidencia || "—"} />
                <FieldRow label="Tipo de visita" value={reserva.tipoVisitante ? (TIPO_VISITANTE_LABELS[reserva.tipoVisitante] ?? reserva.tipoVisitante) : "—"} />
                {reserva.organizacion && <FieldRow label="Organización" value={reserva.organizacion} />}
                <FieldRow label="Titular menor de edad" value={reserva.titularEsMenor ? "Sí" : "No"} />
                <FieldRow label="Personas" value={reserva.cantidadPersonas} />
                <FieldRow label="Incluye menores" value={reserva.tienesMenores ? "Si" : "No"} />
                {reserva.infoAdicional && <FieldRow label="Info adicional" value={reserva.infoAdicional} />}
                <FieldRow label="Reserva creada" value={formatFechaHoraES(reserva.createdAt)} />
              </dl>
            </Card>

            {/* Acompanantes — gestión */}
            <Card title={`Acompañantes (${reserva.acompanantes.length})`}>
              <div className="space-y-4">
                {acompMsg && <InlineAlert message={acompMsg.text} type={acompMsg.type} />}

                {reserva.acompanantes.length === 0 ? (
                  <p className="text-sm text-stone-500">Sin acompañantes registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-800 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                          <th className="pb-2 pr-4">Nombre</th>
                          <th className="pb-2 pr-4">Apellido</th>
                          <th className="pb-2 pr-4">Documento</th>
                          <th className="pb-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {reserva.acompanantes.map((a) =>
                          editAcompId === a.id ? (
                            <tr key={a.id} className="bg-stone-800/40">
                              <td className="py-2 pr-2">
                                <input
                                  value={editAcompForm.nombre}
                                  onChange={(e) => setEditAcompForm((f) => ({ ...f, nombre: e.target.value }))}
                                  className={inputClass}
                                  aria-label="Nombre del acompañante"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  value={editAcompForm.apellido}
                                  onChange={(e) => setEditAcompForm((f) => ({ ...f, apellido: e.target.value }))}
                                  className={inputClass}
                                  aria-label="Apellido del acompañante"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  value={editAcompForm.documento}
                                  onChange={(e) => setEditAcompForm((f) => ({ ...f, documento: e.target.value }))}
                                  className={inputClass}
                                  placeholder="RUT / Pasaporte"
                                  aria-label="Documento del acompañante"
                                />
                              </td>
                              <td className="py-2 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <Button type="button" variant="primary" size="sm" loading={savingAcomp} onClick={() => handleSaveAcomp(a.id)}>
                                    <Save className="size-3.5" aria-hidden="true" />
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditAcompId(null)} disabled={savingAcomp}>
                                    <X className="size-3.5" aria-hidden="true" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={a.id}>
                              <td className="py-2 pr-4 text-stone-200">
                                {a.nombre}
                                {a.esMenor && (
                                  <span className="ml-2 inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                                    menor
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-stone-200">{a.apellido}</td>
                              <td className="py-2 pr-4 font-mono text-stone-400">{a.documento ?? "—"}</td>
                              <td className="py-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditAcomp(a)}
                                    disabled={esAnulada}
                                    className="rounded-md p-1.5 text-stone-400 hover:bg-stone-700 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-30 disabled:pointer-events-none"
                                    aria-label={`Editar ${a.nombre}`}
                                  >
                                    <Pencil className="size-3.5" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAcomp(a)}
                                    disabled={esAnulada || deletingAcompId === a.id}
                                    className="rounded-md p-1.5 text-stone-400 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-30 disabled:pointer-events-none"
                                    aria-label={`Quitar ${a.nombre}`}
                                  >
                                    {deletingAcompId === a.id ? (
                                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <Trash2 className="size-3.5" aria-hidden="true" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Agregar acompañante */}
                {!esAnulada && (
                  <form onSubmit={handleAddAcompanante} className="space-y-3 border-t border-stone-800 pt-4">
                    <p className="text-xs font-medium text-stone-500">Agregar persona</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        value={addForm.nombre}
                        onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))}
                        placeholder="Nombre"
                        className={inputClass}
                        aria-label="Nombre"
                        required
                      />
                      <input
                        value={addForm.apellido}
                        onChange={(e) => setAddForm((f) => ({ ...f, apellido: e.target.value }))}
                        placeholder="Apellido"
                        className={inputClass}
                        aria-label="Apellido"
                        required
                      />
                      <input
                        value={addForm.documento}
                        onChange={(e) => setAddForm((f) => ({ ...f, documento: e.target.value }))}
                        placeholder="RUT / Pasaporte (opcional)"
                        className={inputClass}
                        aria-label="Documento"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-400">
                        <input type="checkbox" checked={addNotificar} onChange={(e) => setAddNotificar(e.target.checked)} className="size-4 rounded border-stone-600 accent-amber-500" />
                        Notificar al titular
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-amber-400">
                        <input type="checkbox" checked={addForzar} onChange={(e) => setAddForzar(e.target.checked)} className="size-4 rounded border-stone-600 accent-amber-500" />
                        Forzar cupos
                      </label>
                      <Button type="submit" variant="secondary" size="sm" loading={addingAcomp} className="ml-auto">
                        <Plus className="size-4" aria-hidden="true" />
                        Agregar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>

            {/* Log de agente */}
            <Card title="Log de agente">
              {reserva.logsAgente.length === 0 ? (
                <p className="text-sm text-stone-500">Sin entradas de log.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-800 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Resultado</th>
                        <th className="pb-2 pr-4">Duracion</th>
                        <th className="pb-2">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {reserva.logsAgente.slice(0, 20).map((log) => (
                        <tr key={log.id}>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                log.tipo === "ERROR"
                                  ? "bg-red-400/10 text-red-400"
                                  : log.tipo === "CONFIRMACION"
                                  ? "bg-green-400/10 text-green-400"
                                  : "bg-stone-400/10 text-stone-400"
                              }`}
                            >
                              {LOG_TIPO_LABELS[log.tipo]}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-stone-300 max-w-xs truncate" title={log.resultado}>{log.resultado}</td>
                          <td className="py-2 pr-4 tabular-nums text-stone-500">
                            {log.duracionMs != null ? `${log.duracionMs}ms` : "—"}
                          </td>
                          <td className="py-2 tabular-nums text-stone-500 text-xs">
                            {formatFechaHoraES(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Estado y acciones */}
            <Card title="Estado y acciones">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge estado={reserva.estado} />
                  {reserva.confirmadaEn && (
                    <span className="text-xs text-stone-500">
                      {formatFechaHoraES(reserva.confirmadaEn)}
                    </span>
                  )}
                </div>

                {actionMsg && <InlineAlert message={actionMsg.text} type={actionMsg.type} />}

                <div className="flex flex-col gap-2">
                  {reserva.estado !== "CONFIRMADA" && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={confirmando}
                      onClick={handleConfirmar}
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Confirmar
                    </Button>
                  )}
                  {reserva.estado !== "ANULADA" && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={anulando}
                      onClick={handleAnular}
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      Anular
                    </Button>
                  )}
                </div>

                <div className="border-t border-stone-800 pt-3">
                  <p className="mb-1 text-xs font-medium text-stone-500">Turno</p>
                  <p className="text-sm font-medium text-stone-200">{OBS_LABELS[reserva.observatorio]}</p>
                  <p className="text-sm text-stone-400">
                    {formatFechaES(reserva.turno.fecha)} &middot; {reserva.turno.horaInicio}–{reserva.turno.horaFin}
                  </p>
                </div>

                <div className="border-t border-stone-800 pt-3">
                  <p className="mb-1 text-xs font-medium text-stone-500">Limite de confirmacion</p>
                  <p className="text-sm text-stone-400">{formatFechaHoraES(reserva.fechaLimiteConfirmacion)}</p>
                </div>
              </div>
            </Card>

            {/* Reagendar */}
            <Card title="Reagendar visita">
              <div className="space-y-3">
                {reagMsg && <InlineAlert message={reagMsg.text} type={reagMsg.type} />}
                <button
                  type="button"
                  onClick={toggleReagendar}
                  disabled={esAnulada}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:pointer-events-none"
                  aria-expanded={reagOpen}
                >
                  <span className="flex items-center gap-2">
                    <CalendarClock className="size-4" aria-hidden="true" />
                    {reagOpen ? "Cancelar reagendamiento" : "Cambiar fecha / turno"}
                  </span>
                  {reagOpen ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                </button>

                {esAnulada && (
                  <p className="text-xs text-stone-500">No se puede reagendar una reserva anulada.</p>
                )}

                {reagOpen && (
                  <form onSubmit={handleReagendar} className="space-y-3">
                    {turnosLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-5 animate-spin text-amber-500" aria-label="Cargando turnos..." />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="nuevo-turno">
                            Nuevo turno ({reserva.cantidadPersonas} personas)
                          </label>
                          <select
                            id="nuevo-turno"
                            value={nuevoTurnoId}
                            onChange={(e) => setNuevoTurnoId(e.target.value)}
                            className={inputClass}
                            required
                          >
                            <option value="">Selecciona un turno…</option>
                            {turnos.map((t) => (
                              <option key={t.id} value={t.id} disabled={t.cuposLibres < reserva.cantidadPersonas && !reagForzar}>
                                {OBS_LABELS[t.observatorio]} · {formatFechaES(t.fecha)} · {t.horaInicio}
                                {t.tipo === "NOCTURNA" ? " (nocturna)" : ""} — {t.cuposLibres} libres
                              </option>
                            ))}
                          </select>
                          {turnos.length === 0 && (
                            <p className="mt-1 text-xs text-stone-500">No hay turnos futuros disponibles.</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-400">
                            <input type="checkbox" checked={reagNotificar} onChange={(e) => setReagNotificar(e.target.checked)} className="size-4 rounded border-stone-600 accent-amber-500" />
                            Notificar al titular por email
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-amber-400">
                            <input type="checkbox" checked={reagForzar} onChange={(e) => setReagForzar(e.target.checked)} className="size-4 rounded border-stone-600 accent-amber-500" />
                            Forzar cupos (omitir límite de capacidad)
                          </label>
                        </div>

                        <Button type="submit" variant="primary" size="sm" loading={reagendando} disabled={!nuevoTurnoId} className="w-full">
                          <CalendarClock className="size-4" aria-hidden="true" />
                          Reagendar
                        </Button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </Card>

            {/* Nota interna */}
            <Card title="Nota interna">
              <div className="space-y-3">
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={4}
                  placeholder="Agregar nota interna..."
                  className="w-full resize-y rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Nota interna"
                />
                {notaMsg && <InlineAlert message={notaMsg.text} type={notaMsg.type} />}
                <Button
                  variant="secondary"
                  size="sm"
                  loading={guardandoNota}
                  onClick={handleGuardarNota}
                  className="w-full"
                >
                  <Save className="size-4" aria-hidden="true" />
                  Guardar nota
                </Button>
              </div>
            </Card>

            {/* Edicion admin */}
            <Card title="Edicion admin">
              <button
                type="button"
                onClick={() => (editOpen ? setEditOpen(false) : openEdit())}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-expanded={editOpen}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="size-4" aria-hidden="true" />
                  {editOpen ? "Cerrar editor" : "Editar datos"}
                </span>
                {editOpen ? (
                  <ChevronUp className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4" aria-hidden="true" />
                )}
              </button>

              {editOpen && editForm && (
                <form onSubmit={handleGuardarEdit} className="mt-4 space-y-3">
                  {editMsg && <InlineAlert message={editMsg.text} type={editMsg.type} />}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-nombre">
                      Nombre
                    </label>
                    <input
                      id="edit-nombre"
                      type="text"
                      value={editForm.nombre}
                      onChange={(e) => setEdit("nombre", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-apellido">
                      Apellido
                    </label>
                    <input
                      id="edit-apellido"
                      type="text"
                      value={editForm.apellido}
                      onChange={(e) => setEdit("apellido", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-email">
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEdit("email", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-telefono">
                      Telefono
                    </label>
                    <input
                      id="edit-telefono"
                      type="text"
                      value={editForm.telefono}
                      onChange={(e) => setEdit("telefono", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-personas">
                      Cantidad de personas
                    </label>
                    <input
                      id="edit-personas"
                      type="number"
                      min={1}
                      value={editForm.cantidadPersonas}
                      onChange={(e) => setEdit("cantidadPersonas", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-idioma">
                      Idioma
                    </label>
                    <select
                      id="edit-idioma"
                      value={editForm.idioma}
                      onChange={(e) => setEdit("idioma", e.target.value as IdiomaVisita)}
                      className={inputClass}
                    >
                      <option value="ES">Espanol</option>
                      <option value="EN">Ingles</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-400" htmlFor="edit-estado">
                      Estado
                    </label>
                    <select
                      id="edit-estado"
                      value={editForm.estado}
                      onChange={(e) => setEdit("estado", e.target.value as EstadoReserva)}
                      className={inputClass}
                    >
                      <option value="PENDIENTE_CONFIRMACION">Pendiente</option>
                      <option value="CONFIRMADA">Confirmada</option>
                      <option value="ANULADA">Anulada</option>
                    </select>
                  </div>

                  {cuposAumentan && (
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={editForm.forzarCupos}
                        onChange={(e) => setEdit("forzarCupos", e.target.checked)}
                        className="size-4 rounded border-stone-600 accent-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs text-amber-400">
                        Forzar cupos (omitir limite de capacidad)
                      </span>
                    </label>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditOpen(false)}
                      disabled={guardandoEdit}
                      className="flex-1"
                    >
                      <X className="size-4" aria-hidden="true" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={guardandoEdit}
                      className="flex-1"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Guardar
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
