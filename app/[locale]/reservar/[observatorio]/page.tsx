import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { ChevronLeft, Telescope } from "lucide-react"
import { CalendarioReservas } from "@/components/reserva/CalendarioReservas"
import { touristAttractionSchema, breadcrumbSchema } from "@/lib/jsonld"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"
).replace(/^﻿/, "").trim()

type ObservatorioSlug = "LA_SILLA" | "PARANAL"

// Accept both kebab-case slugs and uppercase keys from URL
const obsMap: Partial<Record<string, ObservatorioSlug>> = {
  "la-silla": "LA_SILLA",
  LA_SILLA: "LA_SILLA",
  paranal: "PARANAL",
  PARANAL: "PARANAL",
}

const obsMeta: Record<
  ObservatorioSlug,
  {
    nameEs: string
    nameEn: string
    descEs: string
    descEn: string
    descripcionCorta: string
    slug: string
  }
> = {
  LA_SILLA: {
    nameEs: "Observatorio La Silla — ESO Chile",
    nameEn: "La Silla Observatory — ESO Chile",
    descEs:
      "Reserva gratis tu visita guiada al Observatorio La Silla de la ESO, en la Región de Coquimbo. Visitas los sábados, máximo 10 personas.",
    descEn:
      "Book your free guided tour to ESO's La Silla Observatory in the Coquimbo Region. Saturday visits, up to 10 people.",
    descripcionCorta: "Región de Coquimbo · Solo sábados · Edad mínima invierno: 8 años",
    slug: "la-silla",
  },
  PARANAL: {
    nameEs: "Observatorio Paranal VLT — ESO Chile",
    nameEn: "Paranal VLT Observatory — ESO Chile",
    descEs:
      "Reserva gratis tu visita guiada al Observatorio Paranal de la ESO, hogar del Very Large Telescope en Antofagasta. Máximo 10 personas.",
    descEn:
      "Book your free guided tour to ESO's Paranal Observatory, home of the Very Large Telescope in Antofagasta. Up to 10 people.",
    descripcionCorta: "Región de Antofagasta · Desierto de Atacama · Edad mínima: 4 años",
    slug: "paranal",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; observatorio: string }>
}): Promise<Metadata> {
  const { locale, observatorio } = await params
  const obsKey = obsMap[observatorio] ?? obsMap[observatorio.toLowerCase()]
  if (!obsKey) return {}

  const meta = obsMeta[obsKey]
  const isEs = locale === "es"
  const title = isEs ? meta.nameEs : meta.nameEn
  const description = isEs ? meta.descEs : meta.descEn
  const canonicalUrl = `${BASE_URL}/${locale}/reservar/${meta.slug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${BASE_URL}/es/reservar/${meta.slug}`,
        en: `${BASE_URL}/en/reservar/${meta.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "ESO Observatorios Chile",
      locale: isEs ? "es_CL" : "en_US",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og?obs=${meta.slug}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/api/og?obs=${meta.slug}`],
    },
  }
}

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ locale: string; observatorio: string }>
}) {
  const { observatorio, locale } = await params
  const obsKey = obsMap[observatorio] ?? obsMap[observatorio.toLowerCase()]

  if (!obsKey) {
    notFound()
  }

  // obsKey is narrowed to ObservatorioSlug after notFound()
  const resolvedKey = obsKey as ObservatorioSlug
  const meta = obsMeta[resolvedKey]
  const isEs = locale === "es"

  const t = await getTranslations({ locale, namespace: "calendario" })

  const attractionSchema = touristAttractionSchema(resolvedKey)
  const crumbs = breadcrumbSchema([
    { name: isEs ? "Inicio" : "Home", url: `${BASE_URL}/${locale}` },
    {
      name: isEs ? "Reservar" : "Book",
      url: `${BASE_URL}/${locale}/reservar/${meta.slug}`,
    },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(attractionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
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
              <span className="font-playfair font-semibold text-stone-300">
                {isEs ? meta.nameEs : meta.nameEn}
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="font-playfair text-2xl font-black text-stone-100 sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{meta.descripcionCorta}</p>
          </div>

          <CalendarioReservas
            observatorio={resolvedKey}
            labels={{
              next: t("next"),
              seleccionaFecha: t("seleccionaFecha"),
              sinTurnosDisponibles: t("sinTurnosDisponibles"),
              turnosDisponibles: t("turnosDisponibles"),
              conCupos: t("conCupos"),
              agotado: t("agotado"),
              mesAnterior: t("mesAnterior"),
              mesSiguiente: t("mesSiguiente"),
            }}
          />
        </main>
      </div>
    </>
  )
}
