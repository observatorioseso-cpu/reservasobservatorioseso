"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"

interface PortalLoginFormProps {
  locale: string
}

export function PortalLoginForm({ locale }: PortalLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/mi-reserva/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "No se encontró una reserva con esos datos")
        return
      }

      router.push(`/mi-reserva/${data.token}`)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-6 space-y-4">
        <FormField label="Correo electrónico" htmlFor="portal-email" required>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <Input
              id="portal-email"
              type="email"
              placeholder="sofia@ejemplo.cl"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField label="Contraseña de gestión" htmlFor="portal-password" required>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <Input
              id="portal-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
        Acceder a mi reserva
      </Button>

      <p className="text-center text-xs text-stone-600">
        ¿No tienes tu contraseña? Escribe a{" "}
        <a href="mailto:reservas@observatorioseso.cl" className="text-sky-500 hover:text-sky-400 transition-colors">
          reservas@observatorioseso.cl
        </a>
      </p>
    </form>
  )
}
