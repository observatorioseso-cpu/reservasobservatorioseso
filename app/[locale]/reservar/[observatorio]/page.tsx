import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { ChevronLeft, Telescope, Clock, Users, MapPin, ShieldCheck } from "lucide-react"
import { CalendarioReservas } from "@/components/reserva/CalendarioReservas"
import { touristAttractionSchema, breadcrumbSchema } from "@/lib/jsonld"
import { cn } from "@/lib/utils"

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

const obsConfig = {
  LA_SILLA: {
    photo: "/images/lasilla-eclipse.jpg",
    photoAlt: "Eclipse solar sobre el Observatorio La Silla, Región de Coquimbo, Chile",
    overlay: "linear-gradient(to top, rgba(13,8,4,0.96) 0%, rgba(13,8,4,0.55) 55%, rgba(13,8,4,0.15) 100%)",
    accentClass: "text-tierra-400",
    badgeClass: "border-tierra-700/50 bg-tierra-900/50 text-tierra-300",
    chipClass: "text-tierra-400",
    region: "Región de Coquimbo · La Serena ~160 km",
    schedule: "Sábados 09:30–13:00 h",
    capacity: "Hasta 40 cupos",
    minAge: "Edad mínima: 8 años (invierno)",
    navAccent: "text-tierra-400",
    navRing: "focus-visible:ring-tierra-600/50",
  },
  PARANAL: {
    photo: "/images/paranal-night.jpg",
    photoAlt: "El Very Large Telescope bajo el cielo nocturno del desierto de Atacama, Paranal",
    overlay: "linear-gradient(to top, rgba(6,11,18,0.97) 0%, rgba(6,11,18,0.55) 55%, rgba(6,11,18,0.15) 100%)",
    accentClass: "text-cielo-400",
    badgeClass: "border-cielo-800/50 bg-cielo-900/50 text-cielo-300",
    chipClass: "text-cielo-400",
    region: "Región de Antofagasta · Antofagasta ~130 km",
    schedule: "Sábados 09:30–13:00 y 13:30–17:00 h",
    capacity: "Hasta 60 cupos por turno",
    minAge: "Edad mínima: 4 años",
    navAccent: "text-cielo-400",
    navRing: "focus-visible:ring-cielo-600/50",
  },
} as const

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
  const cfg = obsConfig[resolvedKey]
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
        {/* Sticky nav */}
        <header className="sticky top-0 z-40 border-b border-stone-800/60 bg-stone-950/90 backdrop-blur-md">
          <div className="mx-auto flex h-13 max-w-5xl items-center gap-3 px-4 sm:px-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-1.5 text-stone-500 hover:text-stone-300 transition-colors text-sm",
                "focus-visible:outline-none focus-visible:ring-2 rounded",
                cfg.navRing
              )}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline text-xs">ESO Chile</span>
            </Link>
            <span className="text-stone-700" aria-hidden="true">·</span>
            <Telescope className={cn("size-4 shrink-0", cfg.accentClass)} aria-hidden="true" />
            <span className="font-playfair font-semibold text-stone-200 text-sm truncate">
              {isEs ? meta.nameEs : meta.nameEn}
            </span>
          </div>
        </header>

        {/* Photo hero */}
        <div className="relative h-52 sm:h-64 overflow-hidden">
          <img
            src={cfg.photo}
            alt={cfg.photoAlt}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: cfg.overlay }} />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 max-w-5xl mx-auto">
            <span className={cn("text-[10px] font-medium uppercase tracking-[0.25em] mb-1 block", cfg.accentClass)}>
              Entrada gratuita · Visita guiada
            </span>
            <h1 className="font-playfair text-3xl sm:text-4xl font-black text-white leading-none">
              {resolvedKey === "LA_SILLA" ? "La Silla" : "Paranal VLT"}
            </h1>
            <p className="text-sm text-stone-400 mt-1.5">{cfg.region}</p>
          </div>
        </div>

        {/* Info chips bar */}
        <div className="border-b border-stone-800/50 bg-stone-900/30 px-4 sm:px-8 py-3">
          <div className="mx-auto max-w-5xl flex flex-wrap gap-x-5 gap-y-1.5 items-center">
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <Clock className={cn("size-3.5", cfg.chipClass)} aria-hidden="true" />
              {cfg.schedule}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <Users className={cn("size-3.5", cfg.chipClass)} aria-hidden="true" />
              {cfg.capacity}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <MapPin className={cn("size-3.5", cfg.chipClass)} aria-hidden="true" />
              {cfg.region}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <ShieldCheck className={cn("size-3.5", cfg.chipClass)} aria-hidden="true" />
              {cfg.minAge}
            </span>
          </div>
        </div>

        {/* Calendar */}
        <main id="main-content" className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
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
