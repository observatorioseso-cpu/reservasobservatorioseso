"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  ClipboardPaste,
  Trash2,
  Plus,
  KeyRound,
  Copy,
} from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/Button"
import { useAdminTheme } from "@/contexts/adminTheme"
import { parseLista, type ParticipanteParseado } from "@/lib/listaParticipantes"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Observatorio = "LA_SILLA" | "PARANAL"

interface TurnoOption {
  id: string
  observatorio: Observatorio
  fecha: string
  horaInicio: string
  horaFin: string
  capacidadMax: number
  cuposOcupados: number
  cuposLibres: number
  activo: boolean
  tipo: "REGULAR" | "NOCTURNA"
}

type Participante = ParticipanteParseado

const TIPOS_VISITANTE = [
  { value: "COLEGIO", label: "Colegio" },
  { value: "INSTITUTO", label: "Instituto" },
  { value: "UNIVERSIDAD", label: "Universidad" },
  { value: "EMPRESA", label: "Empresa" },
  { value: "AGENCIA_VIAJES", label: "Agencia de viajes" },
  { value: "PERSONAL", label: "Personal" },
  { value: "OTRO", label: "Otra" },
] as const

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NuevaReservaPage() {
  const router = useRouter()
  const { theme } = useAdminTheme()
  const isLight = theme === "light"

  const card = isLight
    ? "bg-white border-stone-300"
    : "bg-stone-900 border-stone-800"
  const label = isLight ? "text-stone-700" : "text-stone-300"
  const heading = isLight ? "text-stone-900" : "text-stone-100"
  const muted = isLight ? "text-stone-600" : "text-stone-400"
  const field = isLight
    ? "border-stone-300 bg-stone-50 text-stone-900 placeholder:text-stone-500"
    : "border-stone-700 bg-stone-950 text-stone-100 placeholder:text-stone-500"

  const [turnos, setTurnos] = useState<TurnoOption[]>([])
  const [cargandoTurnos, setCargandoTurnos] = useState(true)
  const [filtroObs, setFiltroObs] = useState<"" | Observatorio>("")

  const [turnoId, setTurnoId] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [rutOPasaporte, setRut] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [idioma, setIdioma] = useState<"ES" | "EN">("ES")
  const [tipoVisitante, setTipoVisitante] = useState<string>("COLEGIO")
  const [organizacion, setOrganizacion] = useState("")
  const [nacionalidad, setNacionalidad] = useState("")
  const [ciudadResidencia, setCiudad] = useState("")
  const [infoAdicional, setInfo] = useState("")
  const [notaAdmin, setNota] = useState("")

  const [cantidadPersonas, setCantidad] = useState(1)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [textoLista, setTextoLista] = useState("")
  const [todosMenores, setTodosMenores] = useState(false)

  const [estado, setEstado] = useState<"CONFIRMADA" | "PENDIENTE_CONFIRMACION">("CONFIRMADA")
  const [forzarCupos, setForzar] = useState(false)
  const [notificar, setNotificar] = useState(true)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ shortId: string; token: string; passwordGenerada: string | null } | null>(null)

  // Cargar turnos futuros
  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    const params = new URLSearchParams({ desde: hoy })
    fetch(`/api/admin/turnos?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("No se pudieron cargar los turnos"))))
      .then((data: TurnoOption[]) => setTurnos(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargandoTurnos(false))
  }, [])

  const turnosVisibles = useMemo(
    () => (filtroObs ? turnos.filter((t) => t.observatorio === filtroObs) : turnos),
    [turnos, filtroObs]
  )

  const turnoSel = useMemo(() => turnos.find((t) => t.id === turnoId) ?? null, [turnos, turnoId])

  const excedeCupos = turnoSel != null && cantidadPersonas > turnoSel.cuposLibres
  const nombresFaltantes = Math.max(0, cantidadPersonas - 1 - participantes.length)

  const aplicarLista = useCallback(() => {
    const parsed = parseLista(textoLista)
    if (parsed.length === 0) return
    setParticipantes((prev) => [...prev, ...parsed])
    setTextoLista("")
    setCantidad((prev) => Math.max(prev, participantes.length + parsed.length + 1))
  }, [textoLista, participantes.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      const res = await fetch("/api/admin/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId,
          nombre,
          apellido,
          rutOPasaporte,
          email,
          telefono,
          idioma,
          locale: idioma === "EN" ? "en" : "es",
          cantidadPersonas,
          tipoVisitante,
          organizacion: organizacion || null,
          nacionalidad: nacionalidad || null,
          ciudadResidencia: ciudadResidencia || null,
          infoAdicional: infoAdicional || null,
          notaAdmin: notaAdmin || null,
          acompanantes: participantes.map((p) => ({
            nombre: p.nombre,
            apellido: p.apellido,
            documento: p.documento || null,
            esMenor: todosMenores,
          })),
          estado,
          forzarCupos,
          notificar,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo crear la reserva")
      }
      setExito({ shortId: json.shortId, token: json.token, passwordGenerada: json.passwordGenerada })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setEnviando(false)
    }
  }

  // -------------------------------------------------------------------------
  // Pantalla de éxito
  // -------------------------------------------------------------------------

  if (exito) {
    return (
      <AdminShell>
        <div className={`mx-auto max-w-2xl rounded-xl border p-8 ${card}`}>
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-emerald-500" aria-hidden="true" />
            <div className="space-y-5">
              <div>
                <h2 className={`text-xl font-semibold ${heading}`}>Reserva de grupo creada</h2>
                <p className={`mt-1 text-base ${muted}`}>
                  {cantidadPersonas} {cantidadPersonas === 1 ? "persona" : "personas"} ·{" "}
                  {estado === "CONFIRMADA" ? "confirmada" : "pendiente de confirmación"}
                </p>
              </div>

              <div className={`rounded-lg border px-4 py-3 ${field}`}>
                <p className={`text-sm ${muted}`}>Código de reserva</p>
                <p className="font-mono text-lg tracking-wide text-sky-500">{exito.shortId}</p>
              </div>

              {exito.passwordGenerada && (
                <div className="rounded-lg bg-amber-500/10 px-4 py-3 ring-1 ring-amber-500/30">
                  <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <KeyRound className="size-4" aria-hidden="true" />
                    Contraseña temporal para el responsable
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <code className={`font-mono text-lg ${heading}`}>{exito.passwordGenerada}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(exito.passwordGenerada ?? "")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${muted} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      Copiar
                    </button>
                  </div>
                  <p className={`mt-2 text-sm ${muted}`}>
                    Anótala ahora. No se guarda en texto plano y no se puede volver a ver.
                  </p>
                </div>
              )}

              {nombresFaltantes > 0 && (
                <p className={`text-base ${muted}`}>
                  Quedan {nombresFaltantes} nombres por cargar. Los agregas cuando llegue la nómina
                  desde el detalle de la reserva.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.push(`/admin/reservas/${exito.token}`)}>
                  Ver la reserva
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setExito(null)
                    setParticipantes([])
                    setCantidad(1)
                    setNombre("")
                    setApellido("")
                    setRut("")
                    setEmail("")
                    setTelefono("")
                    setOrganizacion("")
                    setNota("")
                  }}
                >
                  Cargar otro grupo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    )
  }

  // -------------------------------------------------------------------------
  // Formulario
  // -------------------------------------------------------------------------

  return (
    <AdminShell>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reservas"
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${muted} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Reservas
          </Link>
        </div>

        <div>
          <h2 className={`text-2xl font-semibold ${heading}`}>Nueva reserva de grupo</h2>
          <p className={`mt-1 text-base ${muted}`}>
            Para buses, colegios y agencias. Sin tope de 10 personas y sin pasar por el sitio
            público.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-base text-red-500 ring-1 ring-red-500/20">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* ---- Turno ---- */}
        <fieldset className={`space-y-4 rounded-xl border p-5 ${card}`}>
          <legend className={`px-2 text-base font-semibold ${heading}`}>Fecha y turno</legend>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Observatorio</span>
              <select
                value={filtroObs}
                onChange={(e) => {
                  setFiltroObs(e.target.value as "" | Observatorio)
                  setTurnoId("")
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              >
                <option value="">Ambos</option>
                <option value="LA_SILLA">La Silla</option>
                <option value="PARANAL">Paranal</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Turno</span>
              <select
                required
                value={turnoId}
                onChange={(e) => setTurnoId(e.target.value)}
                disabled={cargandoTurnos}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              >
                <option value="">
                  {cargandoTurnos ? "Cargando turnos..." : "Selecciona un turno"}
                </option>
                {turnosVisibles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {formatFecha(t.fecha)} · {t.horaInicio}–{t.horaFin} ·{" "}
                    {t.observatorio === "LA_SILLA" ? "La Silla" : "Paranal"} · {t.cuposLibres}{" "}
                    cupos libres
                    {t.activo ? "" : " · INACTIVO"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {turnoSel && (
            <p className={`text-base ${muted}`}>
              Capacidad {turnoSel.capacidadMax} · ocupados {turnoSel.cuposOcupados} · libres{" "}
              <strong className={heading}>{turnoSel.cuposLibres}</strong>
            </p>
          )}
        </fieldset>

        {/* ---- Responsable ---- */}
        <fieldset className={`space-y-4 rounded-xl border p-5 ${card}`}>
          <legend className={`px-2 text-base font-semibold ${heading}`}>
            Responsable del grupo
          </legend>
          <p className={`text-sm ${muted}`}>
            Es quien recibe el correo y gestiona la reserva. El profesor, el guía del bus o el
            contacto de la agencia.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Nombre</span>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Apellido</span>
              <input
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>RUT o pasaporte</span>
              <input
                required
                value={rutOPasaporte}
                onChange={(e) => setRut(e.target.value)}
                placeholder="12.345.678-9"
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Teléfono</span>
              <input
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Correo</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Tipo de visita</span>
              <select
                value={tipoVisitante}
                onChange={(e) => setTipoVisitante(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              >
                {TIPOS_VISITANTE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>
                Organización
              </span>
              <input
                value={organizacion}
                onChange={(e) => setOrganizacion(e.target.value)}
                placeholder="Colegio San Ignacio"
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Nacionalidad</span>
              <input
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>
                Ciudad de residencia
              </span>
              <input
                value={ciudadResidencia}
                onChange={(e) => setCiudad(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              />
            </label>
            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${label}`}>Idioma</span>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value as "ES" | "EN")}
                className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
              >
                <option value="ES">Español</option>
                <option value="EN">English</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* ---- Cupos y lista ---- */}
        <fieldset className={`space-y-4 rounded-xl border p-5 ${card}`}>
          <legend className={`px-2 text-base font-semibold ${heading}`}>Cupos y participantes</legend>

          <label className="block max-w-xs">
            <span className={`mb-1.5 block text-sm font-medium ${label}`}>
              Cupos a bloquear (incluye al responsable)
            </span>
            <input
              required
              type="number"
              min={1}
              max={500}
              value={cantidadPersonas}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={`w-full rounded-lg border px-3 py-2.5 text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
            />
          </label>

          {excedeCupos && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-4 py-3 text-base text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                Pides {cantidadPersonas} cupos y quedan {turnoSel?.cuposLibres}. Marca «forzar
                cupos» más abajo si el grupo entra igual.
              </span>
            </div>
          )}

          {/* Pegar lista */}
          <div className="space-y-2">
            <span className={`block text-sm font-medium ${label}`}>
              Pegar nómina (una persona por línea)
            </span>
            <textarea
              rows={5}
              value={textoLista}
              onChange={(e) => setTextoLista(e.target.value)}
              placeholder={"Juan Pérez, 12.345.678-9\nMaría González, 98.765.432-1\nPedro Soto"}
              className={`w-full rounded-lg border px-3 py-2.5 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={aplicarLista}>
                <ClipboardPaste className="size-4" aria-hidden="true" />
                Agregar {parseLista(textoLista).length || ""} a la lista
              </Button>
              <span className={`text-sm ${muted}`}>
                Acepta copiar y pegar desde Excel. Separa por coma, punto y coma o tabulación.
              </span>
            </div>
          </div>

          {/* Lista cargada */}
          {participantes.length > 0 && (
            <div className={`overflow-hidden rounded-lg border ${isLight ? "border-stone-300" : "border-stone-800"}`}>
              <div
                className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium ${
                  isLight ? "bg-stone-100 text-stone-700" : "bg-stone-800/60 text-stone-300"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Users className="size-4" aria-hidden="true" />
                  {participantes.length} acompañantes cargados
                </span>
                <button
                  type="button"
                  onClick={() => setParticipantes([])}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Vaciar
                </button>
              </div>
              <ul className={`max-h-64 divide-y overflow-y-auto ${isLight ? "divide-stone-200" : "divide-stone-800"}`}>
                {participantes.map((p, i) => (
                  <li key={i} className={`flex items-center gap-3 px-4 py-2 text-base ${heading}`}>
                    <span className={`w-8 shrink-0 tabular-nums text-sm ${muted}`}>{i + 1}</span>
                    <span className="flex-1 truncate">
                      {p.nombre} {p.apellido}
                    </span>
                    <span className={`font-mono text-sm ${muted}`}>{p.documento || "sin documento"}</span>
                    <button
                      type="button"
                      onClick={() => setParticipantes((prev) => prev.filter((_, j) => j !== i))}
                      className={`rounded p-1 ${muted} hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
                      aria-label={`Quitar a ${p.nombre} ${p.apellido}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setParticipantes((prev) => [...prev, { nombre: "", apellido: "", documento: "" }])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Fila vacía
            </Button>
            {nombresFaltantes > 0 && (
              <span className={`text-base ${muted}`}>
                {nombresFaltantes} nombres pendientes. Puedes guardar igual y cargarlos después.
              </span>
            )}
          </div>

          <label className={`flex items-center gap-2.5 text-base ${label}`}>
            <input
              type="checkbox"
              checked={todosMenores}
              onChange={(e) => setTodosMenores(e.target.checked)}
              className="size-4 rounded border-stone-400 accent-amber-500"
            />
            Todo el grupo son menores de edad (curso escolar)
          </label>
        </fieldset>

        {/* ---- Opciones ---- */}
        <fieldset className={`space-y-4 rounded-xl border p-5 ${card}`}>
          <legend className={`px-2 text-base font-semibold ${heading}`}>Opciones</legend>

          <label className="block max-w-sm">
            <span className={`mb-1.5 block text-sm font-medium ${label}`}>Estado inicial</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as typeof estado)}
              className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
            >
              <option value="CONFIRMADA">Confirmada (el grupo ya está cerrado)</option>
              <option value="PENDIENTE_CONFIRMACION">
                Pendiente (reservo los cupos y espero la nómina)
              </option>
            </select>
          </label>

          <label className={`flex items-start gap-2.5 text-base ${label}`}>
            <input
              type="checkbox"
              checked={notificar}
              onChange={(e) => setNotificar(e.target.checked)}
              className="mt-1 size-4 rounded border-stone-400 accent-amber-500"
            />
            <span>Enviar correo al responsable con el código y el enlace de gestión</span>
          </label>

          <label className={`flex items-start gap-2.5 text-base ${label}`}>
            <input
              type="checkbox"
              checked={forzarCupos}
              onChange={(e) => setForzar(e.target.checked)}
              className="mt-1 size-4 rounded border-stone-400 accent-amber-500"
            />
            <span>
              Forzar cupos
              <span className={`block text-sm ${muted}`}>
                Permite pasar la capacidad del turno o usar un turno inactivo. Queda registrado en
                el log.
              </span>
            </span>
          </label>

          <label className="block">
            <span className={`mb-1.5 block text-sm font-medium ${label}`}>
              Nota interna (solo la ve el panel)
            </span>
            <textarea
              rows={2}
              value={notaAdmin}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Bus de la agencia Andes Tour, llegan 20 min antes"
              className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
            />
          </label>

          <label className="block">
            <span className={`mb-1.5 block text-sm font-medium ${label}`}>
              Necesidades especiales o accesibilidad
            </span>
            <textarea
              rows={2}
              value={infoAdicional}
              onChange={(e) => setInfo(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 ${field}`}
            />
          </label>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={enviando} disabled={enviando || !turnoId}>
            {enviando ? "Creando..." : `Crear reserva de ${cantidadPersonas} personas`}
          </Button>
          <Link
            href="/admin/reservas"
            className={`rounded-md px-3 py-2 text-base ${muted} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
          >
            Cancelar
          </Link>
          {cargandoTurnos && <Loader2 className="size-4 animate-spin text-amber-500" aria-hidden="true" />}
        </div>
      </form>
    </AdminShell>
  )
}
