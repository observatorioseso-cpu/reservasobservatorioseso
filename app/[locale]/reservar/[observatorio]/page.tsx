import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { ChevronLeft, Telescope } from "lucide-react"
import { CalendarioReservas } from "@/components/reserva/CalendarioReservas"

type ObservatorioSlug = "LA_SILLA" | "PARANAL"

const NOMBRES: Record<ObservatorioSlug, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal (VLT)",
}

const DESCRIPCIONES: Record<ObservatorioSlug, string> = {
  LA_SILLA: "Región de Coquimbo · Solo sábados · Edad mínima invierno: 8 años",
  PARANAL: "Región de Antofagasta · Desierto de Atacama · Edad mínima: 4 años",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; observatorio: string }>
}): Promise<Metadata> {
  const { observatorio } = await params
  const slug = observatorio.toUpperCase() as ObservatorioSlug
  const nombre = NOMBRES[slug]
  if (!nombre) return {}

  return {
    title: `Reservar visita — ${nombre} · ESO Chile`,
    description: `Reserva tu visita gratuita al Observatorio ${nombre} ESO. ${DESCRIPCIONES[slug]}`,
    alternates: {
      canonical: `https://reservasobservatorioseso.cl/reservar/${observatorio}`,
      languages: {
        es: `https://reservasobservatorioseso.cl/es/reservar/${observatorio}`,
        en: `https://reservasobservatorioseso.cl/en/reservar/${observatorio}`,
      },
    },
  }
}

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ locale: string; observatorio: string }>
}) {
  const { observatorio, locale } = await params
  const slug = observatorio.toUpperCase() as ObservatorioSlug

  if (!["LA_SILLA", "PARANAL"].includes(slug)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: "calendario" })
  const nombre = NOMBRES[slug]

  return (
    <div className="min-h-[100dvh] bg-stone-950">
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 transition-colors text-sm"
          >
            <ChevronLeft className="size-4" />
            <Telescope className="size-4 text-amber-400" />
            <span className="font-playfair font-semibold text-stone-300">{nombre}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-playfair text-2xl font-black text-stone-100 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{DESCRIPCIONES[slug]}</p>
        </div>

        <CalendarioReservas observatorio={slug} nextLabel={t("next")} />
      </main>
    </div>
  )
}
