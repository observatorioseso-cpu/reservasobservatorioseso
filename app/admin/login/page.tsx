"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Telescope, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

const loginSchema = z.object({
  email:    z.string().min(1, "El email es obligatorio").email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type LoginFields = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError]   = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFields) {
    setServerError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      })
      if (res.ok) {
        router.push("/admin/dashboard")
      } else {
        const body = await res.json().catch(() => null)
        setServerError(body?.error ?? "Credenciales incorrectas")
      }
    } catch {
      setServerError("No se pudo conectar con el servidor. Intenta de nuevo.")
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
              <Telescope className="size-7 text-amber-500" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-100">
            Panel de Administración
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            ESO Chile — Reservas Observatorios
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Server-level error */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-stone-300">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                {...register("email")}
                className={[
                  "w-full rounded-lg border bg-stone-800 px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-500",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900",
                  errors.email
                    ? "border-red-500/60"
                    : "border-stone-700 hover:border-stone-600",
                ].join(" ")}
                placeholder="admin@eso.cl"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-stone-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                  className={[
                    "w-full rounded-lg border bg-stone-800 py-2.5 pl-3.5 pr-11 text-sm text-stone-100 placeholder-stone-500",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900",
                    errors.password
                      ? "border-red-500/60"
                      : "border-stone-700 hover:border-stone-600",
                  ].join(" ")}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-200 focus-visible:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword
                    ? <EyeOff className="size-4" aria-hidden="true" />
                    : <Eye    className="size-4" aria-hidden="true" />
                  }
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Ingresando..." : "Ingresar al panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
