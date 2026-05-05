"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, AlertCircle, Telescope, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"

export interface PortalLoginLabels {
  title: string
  login: string
  loginSubtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordHint: string
  forgotPassword: string
  forgotPasswordContact: string
  submitLogin: string
  backToHome: string
  errorNotFound: string
  errorConnection: string
}

interface PortalLoginFormProps {
  labels: PortalLoginLabels
}

export function PortalLoginForm({ labels }: PortalLoginFormProps) {
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
        setError(data.error ?? labels.errorNotFound)
        return
      }

      router.push(`/mi-reserva/${data.token}`)
    } catch {
      setError(labels.errorConnection)
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Full-page background */
    <div className="min-h-[100dvh] bg-tinta-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="bg-tinta-950 px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-tierra-500/10 border border-tierra-500/20 p-3">
                <Telescope className="size-7 text-tierra-500" />
              </div>
            </div>
            <h1 className="font-playfair text-2xl font-black text-arena-50 leading-tight">
              {labels.title}
            </h1>
            <p className="mt-1.5 text-sm text-tinta-400 font-franklin">
              {labels.loginSubtitle}
            </p>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5 bg-stone-50" noValidate>
            <FormField label={labels.emailLabel} htmlFor="portal-email" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tinta-400 pointer-events-none" />
                <Input
                  id="portal-email"
                  type="email"
                  placeholder={labels.emailPlaceholder}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </FormField>

            <FormField
              label={labels.passwordLabel}
              htmlFor="portal-password"
              hint={labels.passwordHint}
              required
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tinta-400 pointer-events-none" />
                <Input
                  id="portal-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tinta-400 hover:text-tinta-600 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {/* Forgot password */}
            <div className="text-right">
              <a
                href={`mailto:${labels.forgotPasswordContact}`}
                className="text-xs text-tierra-600 hover:text-tierra-700 transition-colors underline underline-offset-2"
              >
                {labels.forgotPassword}
              </a>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-600"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-full bg-tierra-700 text-arena-50 hover:bg-tierra-600 focus-visible:ring-tierra-500/50"
            >
              {labels.submitLogin}
            </Button>
          </form>

          {/* Card footer */}
          <div className="px-8 pb-7 bg-stone-50 flex justify-center border-t border-stone-200 pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-tinta-500 hover:text-tierra-700 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {labels.backToHome}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
