"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react"
import { reservaSchema, type ReservaInput } from "@/lib/schemas"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
import { AcompananteField } from "./AcompananteField"

interface Labels {
  nombre: string
  apellido: string
  rutOPasaporte: string
  rutHint: string
  email: string
  emailConfirm: string
  telefono: string
  cantidadPersonas: string
  idioma: string
  idiomaES: string
  idiomaEN: string
  tienesMenores: string
  recibirWhatsapp: string
  whatsappOptIn: string
  password: string
  passwordHint: string
  acompanantes: string
  addAcompanante: string
  submit: string
  edadMinima8: string
  edadMinima4: string
  sectionTitular: string
  sectionVisita: string
  sectionPassword: string
  reducirPersonas: string
  aumentarPersonas: string
}

interface FormularioReservaProps {
  turnoId: string
  observatorio: "LA_SILLA" | "PARANAL"
  fecha: string
  labels: Labels
  errorLabels: {
    required: string
    emailMismatch: string
    invalidRut: string
    maxPersons: string
    generic: string
  }
  backLabel: string
  locale: string
}

export function FormularioReserva({
  turnoId,
  observatorio,
  fecha,
  labels,
  errorLabels,
  locale,
}: FormularioReservaProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(reservaSchema) as any,
    defaultValues: {
      turnoId,
      idioma: locale === "en" ? "EN" : "ES",
      cantidadPersonas: 1,
      tienesMenores: false,
      recibirWhatsapp: false,
      whatsappOptIn: false,
      acompanantes: [],
      locale: locale as "es" | "en",
    } as unknown as ReservaInput,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: "acompanantes",
  })

  const cantidadPersonas = form.watch("cantidadPersonas") as number
  const recibirWhatsapp = form.watch("recibirWhatsapp") as boolean

  // Sincronizar cantidad de acompañantes con cantidadPersonas
  const handleCantidadChange = (val: number) => {
    form.setValue("cantidadPersonas", val, { shouldValidate: true })
    const needed = val - 1
    const current = fields.length
    if (needed > current) {
      for (let i = current; i < needed; i++) {
        append({ nombre: "", apellido: "", documento: "" })
      }
    } else if (needed < current) {
      for (let i = current - 1; i >= needed; i--) {
        remove(i)
      }
    }
  }

  const onSubmit = async (data: unknown) => {
    const typed = data as ReservaInput
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typed),
      })
      const json = await res.json()
      if (!res.ok) {
        setSubmitError(json.error ?? errorLabels.generic)
        return
      }
      try {
        sessionStorage.setItem("eso_ultima_reserva", JSON.stringify({
          shortId: json.shortId,
          token: json.token,
          observatorio: observatorio,
          fecha: fecha,
        }))
      } catch {}
      router.push(`/confirmar/${json.token}`)
    } catch {
      setSubmitError(errorLabels.generic)
    } finally {
      setSubmitting(false)
    }
  }

  const isEsoInvierno = observatorio === "LA_SILLA"

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* ─── Sección: Titular ─── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-playfair font-bold text-stone-800 text-lg">{labels.sectionTitular}</h2>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={labels.nombre}
            htmlFor="nombre"
            error={form.formState.errors.nombre?.message}
            required
          >
            <Input
              id="nombre"
              placeholder="Sofía"
              autoComplete="given-name"
              error={form.formState.errors.nombre?.message}
              {...form.register("nombre")}
            />
          </FormField>
          <FormField
            label={labels.apellido}
            htmlFor="apellido"
            error={form.formState.errors.apellido?.message}
            required
          >
            <Input
              id="apellido"
              placeholder="Carranza"
              autoComplete="family-name"
              error={form.formState.errors.apellido?.message}
              {...form.register("apellido")}
            />
          </FormField>
        </div>

        <FormField
          label={labels.rutOPasaporte}
          htmlFor="rutOPasaporte"
          error={form.formState.errors.rutOPasaporte?.message}
          hint={labels.rutHint}
          required
        >
          <Input
            id="rutOPasaporte"
            placeholder="12.345.678-9"
            autoComplete="off"
            error={form.formState.errors.rutOPasaporte?.message}
            {...form.register("rutOPasaporte")}
          />
        </FormField>

        <FormField
          label={labels.email}
          htmlFor="email"
          error={form.formState.errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            placeholder="sofia@ejemplo.cl"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
        </FormField>

        <FormField
          label={labels.emailConfirm}
          htmlFor="emailConfirm"
          error={form.formState.errors.emailConfirm?.message}
          required
        >
          <Input
            id="emailConfirm"
            type="email"
            placeholder="sofia@ejemplo.cl"
            autoComplete="off"
            error={form.formState.errors.emailConfirm?.message}
            {...form.register("emailConfirm")}
          />
        </FormField>

        <FormField
          label={labels.telefono}
          htmlFor="telefono"
          error={form.formState.errors.telefono?.message}
          required
        >
          <Input
            id="telefono"
            type="tel"
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
            error={form.formState.errors.telefono?.message}
            {...form.register("telefono")}
          />
        </FormField>
      </section>

      {/* ─── Sección: Visita ─── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-playfair font-bold text-stone-800 text-lg">{labels.sectionVisita}</h2>

        {/* Cantidad */}
        <FormField
          label={labels.cantidadPersonas}
          htmlFor="cantidadPersonas"
          error={form.formState.errors.cantidadPersonas?.message}
          required
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCantidadChange(Math.max(1, cantidadPersonas - 1))}
              className="size-10 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={labels.reducirPersonas}
            >
              –
            </button>
            <span className="w-12 text-center font-semibold text-stone-900 text-lg">
              {cantidadPersonas}
            </span>
            <button
              type="button"
              onClick={() => handleCantidadChange(Math.min(10, cantidadPersonas + 1))}
              className="size-10 rounded-lg border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100 font-bold text-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label={labels.aumentarPersonas}
            >
              +
            </button>
          </div>
          {isEsoInvierno && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="size-3" />
              {labels.edadMinima8}
            </p>
          )}
        </FormField>

        {/* Idioma */}
        <FormField label={labels.idioma} htmlFor="idioma" required>
          <div className="flex gap-3">
            {(["ES", "EN"] as const).map((lang) => (
              <label
                key={lang}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  value={lang}
                  className="accent-amber-500"
                  {...form.register("idioma")}
                />
                <span className="text-sm text-stone-700">
                  {lang === "ES" ? labels.idiomaES : labels.idiomaEN}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Checkboxes */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="size-4 rounded accent-amber-500"
            {...form.register("tienesMenores")}
          />
          <span className="text-sm text-stone-700">{labels.tienesMenores}</span>
        </label>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="size-4 rounded accent-amber-500"
              {...form.register("recibirWhatsapp")}
            />
            <span className="text-sm text-stone-700">{labels.recibirWhatsapp}</span>
          </label>

          <AnimatePresence>
            {recibirWhatsapp && (
              <motion.label
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 cursor-pointer overflow-hidden"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded accent-amber-500"
                  {...form.register("whatsappOptIn")}
                />
                <span className="text-xs text-stone-500 leading-relaxed">
                  {labels.whatsappOptIn}
                </span>
              </motion.label>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Acompañantes ─── */}
      <AnimatePresence>
        {fields.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <h2 className="font-playfair font-bold text-stone-800 text-lg">
              {labels.acompanantes}
            </h2>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
              >
                <AcompananteField
                  index={index}
                  register={form.register}
                  errors={form.formState.errors}
                  onRemove={() => handleCantidadChange(cantidadPersonas - 1)}
                />
              </motion.div>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Contraseña ─── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-playfair font-bold text-stone-800 text-lg">{labels.sectionPassword}</h2>
        <FormField
          label={labels.password}
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint={labels.passwordHint}
          required
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              error={form.formState.errors.password?.message}
              className="pr-10"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>
      </section>

      {/* ─── Error global ─── */}
      <div role="alert" aria-live="assertive" aria-atomic="true">
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-sm text-red-700">{submitError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Submit ─── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={submitting}
        className="w-full"
      >
        {labels.submit}
      </Button>
    </form>
  )
}
