"use client"

import { useState, useId } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  Users,
  Telescope,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tipo = "GENERAL" | "GRUPAL"
type Status = "idle" | "loading" | "success" | "error"

interface FieldError {
  [key: string]: string
}

// ---------------------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------------------

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-tinta-700 mb-1"
    >
      {children}
      {required && (
        <span className="ml-0.5 text-tierra-600" aria-hidden="true">
          {" "}*
        </span>
      )}
    </label>
  )
}

const inputCls = cn(
  "w-full rounded-xl bg-stone-50 text-stone-900 ring-1 ring-stone-200",
  "py-2.5 px-3.5 text-sm placeholder:text-stone-400",
  "focus:outline-none focus:ring-2 focus:ring-tierra-500",
  "transition-shadow duration-150",
  "aria-[invalid=true]:ring-red-400 aria-[invalid=true]:bg-red-50/30"
)

function FieldErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600" role="alert">
      <AlertCircle className="size-3 shrink-0" />
      {msg}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ContactForm() {
  const t = useTranslations("contacto.form")
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  const [tipo, setTipo] = useState<Tipo>("GENERAL")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})

  const tomorrow = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()

  function clearErrors() {
    setFieldErrors({})
    setErrorMsg("")
  }

  // ---------------------------------------------------------------------------
  // Client-side validation
  // ---------------------------------------------------------------------------

  function validate(form: HTMLFormElement): FieldError | null {
    const errs: FieldError = {}
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? ""

    const nombre = get("nombre")
    const email = get("email")
    const mensaje = get("mensaje")

    if (nombre.length < 2) errs.nombre = t("errorNombre")
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t("errorEmail")

    if (tipo === "GENERAL") {
      if (mensaje.length < 20) errs.mensaje = t("errorMensajeMin")
      if (mensaje.length > 2000) errs.mensaje = t("errorMensajeMax")
    }

    if (tipo === "GRUPAL") {
      const organizacion = get("organizacion")
      const numPersonas = parseInt(get("numPersonas"), 10)
      const fechaPref1 = get("fechaPref1")

      if (organizacion.length < 2) errs.organizacion = t("errorOrganizacion")
      if (isNaN(numPersonas) || numPersonas < 11) errs.numPersonas = t("errorNumPersonas")
      if (!fechaPref1) errs.fechaPref1 = t("errorFechaPref1")
    }

    return Object.keys(errs).length > 0 ? errs : null
  }

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearErrors()

    const form = e.currentTarget

    const errs = validate(form)
    if (errs) {
      setFieldErrors(errs)
      const firstKey = Object.keys(errs)[0]
      const el = form.elements.namedItem(firstKey) as HTMLElement | null
      el?.focus()
      return
    }

    setStatus("loading")

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? ""

    const basePayload = {
      tipo,
      website: get("website"),
      nombre: get("nombre"),
      email: get("email"),
      telefono: get("telefono") || undefined,
    }

    let payload: Record<string, unknown>

    if (tipo === "GENERAL") {
      payload = { ...basePayload, mensaje: get("mensaje") }
    } else {
      const fechas: string[] = []
      const f1 = get("fechaPref1")
      const f2 = get("fechaPref2")
      const f3 = get("fechaPref3")
      if (f1) fechas.push(f1)
      if (f2) fechas.push(f2)
      if (f3) fechas.push(f3)

      payload = {
        ...basePayload,
        organizacion: get("organizacion"),
        numPersonas: parseInt(get("numPersonas"), 10),
        observatorio: get("observatorio") || undefined,
        fechasPref: fechas.join(", ") || undefined,
        mensaje: get("mensajeAdicional") || undefined,
      }
    }

    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setStatus("success")
        return
      }

      const json = await res.json().catch(() => ({}))

      if (res.status === 429) {
        setErrorMsg(t("serverRateLimit"))
      } else if (res.status === 400 && json?.details) {
        const flat = json.details as { fieldErrors?: Record<string, string[]> }
        if (flat.fieldErrors) {
          const mapped: FieldError = {}
          for (const [k, msgs] of Object.entries(flat.fieldErrors)) {
            mapped[k] = Array.isArray(msgs) ? msgs[0] : String(msgs)
          }
          setFieldErrors(mapped)
        } else {
          setErrorMsg(t("serverInvalid"))
        }
      } else {
        setErrorMsg(json?.error ?? t("serverGeneric"))
      }

      setStatus("error")
    } catch {
      setErrorMsg(t("serverConnection"))
      setStatus("error")
    }
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-tierra-500/10 shadow-sm p-8 flex flex-col items-center text-center gap-5">
        <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-200/60">
          <CheckCircle2 className="size-7 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-playfair text-xl font-bold text-tinta-900 mb-1">
            {t("successHeading")}
          </h2>
          <p className="text-sm text-tinta-500 leading-relaxed max-w-sm">
            {t("successBody").split(t("successBodyHighlight"))[0]}
            <strong className="text-tinta-700">{t("successBodyHighlight")}</strong>
            {t("successBody").split(t("successBodyHighlight"))[1]}
          </p>
        </div>
        {tipo === "GRUPAL" && (
          <a
            href="/templates/grupo-reserva.csv"
            download
            className="inline-flex items-center gap-2 rounded-full border border-tierra-600/30 bg-arena-50 px-5 py-2.5 text-sm font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-500/50 transition-all"
          >
            <Download className="size-4" />
            {t("downloadSuccessLink")}
          </a>
        )}
        <button
          onClick={() => {
            setStatus("idle")
            clearErrors()
          }}
          className="text-xs text-tinta-400 hover:text-tinta-700 underline underline-offset-2 transition-colors"
        >
          {t("sendAnother")}
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Form render
  // ---------------------------------------------------------------------------

  return (
    <div className="rounded-2xl bg-white ring-1 ring-tierra-500/10 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex bg-arena-100 border-b border-tierra-500/10">
        {(["GENERAL", "GRUPAL"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setTipo(tab)
              clearErrors()
            }}
            aria-pressed={tipo === tab}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tierra-500",
              tipo === tab
                ? "bg-tierra-700 text-white"
                : "text-tinta-500 hover:text-tinta-800 hover:bg-arena-200"
            )}
          >
            {tab === "GENERAL" ? t("tabGeneral") : t("tabGroup")}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label={t("ariaForm")} className="p-6 flex flex-col gap-5">
        {/* Honeypot — genuinely hidden from humans, visible to bots */}
        <div
          style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        >
          <label htmlFor={id("website")}>Website</label>
          <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Error banner */}
        {status === "error" && errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── Campos comunes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <Label htmlFor={id("nombre")} required>
              {t("labelNombre")}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <input
                id={id("nombre")}
                name="nombre"
                type="text"
                autoComplete="name"
                placeholder={t("placeholderNombre")}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.nombre}
                aria-describedby={fieldErrors.nombre ? `${id("nombre")}-err` : undefined}
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <FieldErrorMsg msg={fieldErrors.nombre} />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor={id("email")} required>
              {t("labelEmail")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <input
                id={id("email")}
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("placeholderEmail")}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${id("email")}-err` : undefined}
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <FieldErrorMsg msg={fieldErrors.email} />
          </div>

          {/* Teléfono */}
          <div>
            <Label htmlFor={id("telefono")}>
              {t("labelTelefono")}
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <input
                id={id("telefono")}
                name="telefono"
                type="tel"
                autoComplete="tel"
                placeholder={t("placeholderTelefono")}
                aria-invalid={!!fieldErrors.telefono}
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <FieldErrorMsg msg={fieldErrors.telefono} />
          </div>
        </div>

        {/* ── Campos GENERAL ── */}
        {tipo === "GENERAL" && (
          <div>
            <Label htmlFor={id("mensaje")} required>
              {t("labelMensaje")}
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 size-4 text-stone-400 pointer-events-none" />
              <textarea
                id={id("mensaje")}
                name="mensaje"
                rows={5}
                placeholder={t("placeholderMensaje")}
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.mensaje}
                aria-describedby={fieldErrors.mensaje ? `${id("mensaje")}-err` : undefined}
                className={cn(inputCls, "pl-9 resize-y min-h-[120px]")}
              />
            </div>
            <FieldErrorMsg msg={fieldErrors.mensaje} />
          </div>
        )}

        {/* ── Campos GRUPAL ── */}
        {tipo === "GRUPAL" && (
          <>
            {/* Organización */}
            <div>
              <Label htmlFor={id("organizacion")} required>
                {t("labelOrganizacion")}
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                <input
                  id={id("organizacion")}
                  name="organizacion"
                  type="text"
                  placeholder={t("placeholderOrganizacion")}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.organizacion}
                  aria-describedby={fieldErrors.organizacion ? `${id("organizacion")}-err` : undefined}
                  className={cn(inputCls, "pl-9")}
                />
              </div>
              <FieldErrorMsg msg={fieldErrors.organizacion} />
            </div>

            {/* N.° personas + Observatorio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={id("numPersonas")} required>
                  {t("labelNumPersonas")}
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                  <input
                    id={id("numPersonas")}
                    name="numPersonas"
                    type="number"
                    min={11}
                    placeholder="11"
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.numPersonas}
                    aria-describedby={id("numPersonas-hint")}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
                <p id={id("numPersonas-hint")} className="mt-1 text-xs text-tinta-400">
                  {t("numPersonasHint").split(t("numPersonasHintLink"))[0]}
                  <Link href="/" className="text-tierra-600 underline underline-offset-2">
                    {t("numPersonasHintLink")}
                  </Link>
                  {t("numPersonasHint").split(t("numPersonasHintLink"))[1]}
                </p>
                <FieldErrorMsg msg={fieldErrors.numPersonas} />
              </div>

              <div>
                <Label htmlFor={id("observatorio")}>
                  {t("labelObservatorio")}
                </Label>
                <div className="relative">
                  <Telescope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                  <select
                    id={id("observatorio")}
                    name="observatorio"
                    className={cn(inputCls, "pl-9 appearance-none")}
                  >
                    <option value="">{t("obsAny")}</option>
                    <option value="PARANAL">Paranal</option>
                    <option value="LA_SILLA">La Silla</option>
                    <option value="CUALQUIERA">{t("obsNoPreference")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fechas preferidas */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-xs font-medium text-tinta-700 mb-0.5">
                {t("labelFechas")}{" "}
                <span className="ml-0.5 text-tierra-600" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: "fechaPref1", labelKey: "labelFecha1" as const, required: true },
                  { name: "fechaPref2", labelKey: "labelFecha2" as const, required: false },
                  { name: "fechaPref3", labelKey: "labelFecha3" as const, required: false },
                ].map(({ name, labelKey, required }) => (
                  <div key={name}>
                    <Label htmlFor={id(name)} required={required}>
                      {t(labelKey)}
                    </Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                      <input
                        id={id(name)}
                        name={name}
                        type="date"
                        min={tomorrow}
                        required={required}
                        aria-required={required}
                        aria-invalid={required ? !!fieldErrors[name] : undefined}
                        aria-describedby={
                          required && fieldErrors[name] ? `${id(name)}-err` : undefined
                        }
                        className={cn(inputCls, "pl-9")}
                      />
                    </div>
                    {required && <FieldErrorMsg msg={fieldErrors[name]} />}
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Enlace planilla */}
            <div className="flex items-center gap-2 rounded-xl border border-tierra-500/15 bg-arena-50 px-4 py-3">
              <Download className="size-4 text-tierra-500 shrink-0" />
              <p className="text-xs text-tinta-600 leading-relaxed flex-1">
                {t("downloadText")}
              </p>
              <a
                href="/templates/grupo-reserva.csv"
                download
                className="shrink-0 text-xs font-medium text-tierra-700 underline underline-offset-2 hover:text-tierra-600 transition-colors"
              >
                {t("downloadLink")}
              </a>
            </div>

            {/* Mensaje adicional */}
            <div>
              <Label htmlFor={id("mensajeAdicional")}>
                {t("labelMensajeAdicional")}
              </Label>
              <textarea
                id={id("mensajeAdicional")}
                name="mensajeAdicional"
                rows={3}
                placeholder={t("placeholderMensajeAdicional")}
                className={cn(inputCls, "resize-y min-h-[80px]")}
              />
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-tinta-400">
            {t("required").split("*")[0]}
            <span className="text-tierra-600" aria-hidden="true">*</span>
            {t("required").split("*")[1]}
          </p>
          <button
            type="submit"
            disabled={status === "loading"}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-colors duration-150",
              "bg-tierra-700 text-arena-50 hover:bg-tierra-600",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-tierra-500 focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {t("submit")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
