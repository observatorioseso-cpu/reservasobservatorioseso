"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

const text = {
  es: {
    heading: "Algo salió mal",
    body: "Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.",
    retry: "Reintentar",
    home: "Volver al inicio",
  },
  en: {
    heading: "Something went wrong",
    body: "An unexpected error occurred. You can try again or return to the home page.",
    retry: "Try again",
    home: "Back to home",
  },
}

function detectLocale(): "es" | "en" {
  if (typeof window === "undefined") return "es"
  return window.location.pathname.startsWith("/en") ? "en" : "es"
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [locale, setLocale] = useState<"es" | "en">("es")

  useEffect(() => {
    setLocale(detectLocale())
    // Log to console for debugging — digest ties to server logs
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error.message, error.digest)
    }
  }, [error])

  const t = text[locale]
  const homeHref = `/${locale}`

  return (
    <div className="min-h-[100dvh] bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
      <AlertTriangle
        className="size-12 text-amber-400 mb-6"
        aria-hidden="true"
      />

      <h1 className="font-playfair text-2xl font-bold text-stone-100 mb-2">
        {t.heading}
      </h1>
      <p className="text-stone-400 text-sm max-w-sm mb-8">{t.body}</p>

      {error.digest && (
        <p className="text-stone-600 text-xs mb-6 font-mono">
          ref: {error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-block rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
        >
          {t.retry}
        </button>
        <a
          href={homeHref}
          className="inline-block rounded-lg border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 hover:border-stone-500 hover:text-stone-100 transition-colors"
        >
          {t.home}
        </a>
      </div>
    </div>
  )
}
