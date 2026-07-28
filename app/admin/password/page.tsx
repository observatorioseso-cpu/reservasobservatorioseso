"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ShieldCheck, AlertCircle, Telescope, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function CambiarPasswordPage() {
  const router = useRouter()

  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetir, setRepetir] = useState("")
  const [ver, setVer] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)
  const [obligatorio, setObligatorio] = useState(false)
  const [nombre, setNombre] = useState("")

  useEffect(() => {
    fetch("/api/admin/password")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return
        setObligatorio(Boolean(json.data?.debeCambiarPassword))
        setNombre(json.data?.nombre ?? "")
      })
      .catch(() => {})
  }, [])

  const suficienteLarga = nueva.length >= 10
  const coinciden = nueva.length > 0 && nueva === repetir
  const puedeEnviar = actual.length > 0 && suficienteLarga && coinciden && !enviando

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? "No se pudo cambiar la contraseña")
      setListo(true)
      setTimeout(() => router.push("/admin/dashboard"), 1600)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setEnviando(false)
    }
  }

  const inputClass =
    "w-full rounded-lg border border-stone-700 bg-stone-800 py-2.5 pl-3.5 pr-11 text-base text-stone-100 placeholder-stone-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 hover:border-stone-600"

  if (listo) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-stone-800 bg-stone-900 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-stone-100">Contraseña actualizada</h1>
          <p className="mt-2 text-base text-stone-400">
            La clave temporal quedó sin efecto. Entrando al panel...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
              <Telescope className="size-7 text-amber-500" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-100">
            {obligatorio ? "Crea tu contraseña" : "Cambiar contraseña"}
          </h1>
          <p className="mt-1 text-base text-stone-400">
            {nombre ? `${nombre} — ` : ""}ESO Chile, Reservas Observatorios
          </p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-8">
          {obligatorio && (
            <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-base text-amber-300">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                Estás usando una contraseña temporal. Elige una nueva ahora y la temporal deja de
                funcionar.
              </span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-base text-red-400"
              >
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="actual" className="block text-sm font-medium text-stone-300">
                {obligatorio ? "Contraseña temporal" : "Contraseña actual"}
              </label>
              <div className="relative">
                <input
                  id="actual"
                  type={ver ? "text" : "password"}
                  autoComplete="current-password"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVer((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-200 focus-visible:outline-none"
                  aria-label={ver ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                >
                  {ver ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nueva" className="block text-sm font-medium text-stone-300">
                Contraseña nueva
              </label>
              <input
                id="nueva"
                type={ver ? "text" : "password"}
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                className={inputClass}
                placeholder="Mínimo 10 caracteres"
              />
              <p className={`text-sm ${suficienteLarga ? "text-emerald-400" : "text-stone-500"}`}>
                {suficienteLarga ? "Largo suficiente" : "Al menos 10 caracteres"}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="repetir" className="block text-sm font-medium text-stone-300">
                Repite la contraseña nueva
              </label>
              <input
                id="repetir"
                type={ver ? "text" : "password"}
                autoComplete="new-password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
              {repetir.length > 0 && !coinciden && (
                <p className="text-sm text-red-400">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={enviando}
              disabled={!puedeEnviar}
              className="w-full"
            >
              {enviando ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500">
          Nadie del equipo puede ver tu contraseña. Se guarda cifrada y solo tú la conoces.
        </p>
      </div>
    </div>
  )
}
