import { Link } from "@/i18n/navigation"

export default function NotFound() {
  return (
    <html lang="es">
      <body className="min-h-[100dvh] bg-stone-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-stone-400 text-sm mb-4">404 — Página no encontrada</p>
          <a
            href="/es"
            className="inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </body>
    </html>
  )
}
