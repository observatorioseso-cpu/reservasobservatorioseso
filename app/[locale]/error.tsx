"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("error")

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error.message, error.digest)
    }
  }, [error])

  return (
    <div className="min-h-[100dvh] bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
      <AlertTriangle
        className="size-12 text-amber-400 mb-6"
        aria-hidden="true"
      />

      <h1 className="font-playfair text-2xl font-bold text-stone-100 mb-2">
        {t("heading")}
      </h1>
      <p className="text-stone-400 text-sm max-w-sm mb-8">{t("body")}</p>

      {error.digest && (
        <p className="text-stone-600 text-xs mb-6 font-mono">
          ref: {error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-block rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          {t("retry")}
        </button>
        <a
          href="/"
          className="inline-block rounded-lg border border-stone-700 px-6 py-3 text-sm font-semibold text-stone-300 hover:border-stone-500 hover:text-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        >
          {t("home")}
        </a>
      </div>
    </div>
  )
}
