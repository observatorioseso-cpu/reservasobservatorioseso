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
    slug: string
  }
> = {
  LA_SILLA: {
    nameEs: "Observatorio La Silla — ESO Chile",
    nameEn: "La Silla Observatory — ESO Chile",
    descEs:
      "Reserva gratis tu visita guiada al Observatorio La Silla de la ESO, en la Región de Coquimbo. Visitas los sábados, hasta 40 personas.",
    descEn:
      "Book your free guided tour to ESO's La Silla Observatory in the Coquimbo Region. Saturday visits, up to 40 people.",
    slug: "la-silla",
  },
  PARANAL: {
    nameEs: "Observatorio Paranal VLT — ESO Chile",
    nameEn: "Paranal VLT Observatory — ESO Chile",
    descEs:
      "Reserva gratis tu visita guiada al Observatorio Paranal de la ESO, hogar del Very Large Telescope en Antofagasta. Hasta 60 personas por turno.",
    descEn:
      "Book your free guided tour to ESO's Paranal Observatory, home of the Very Large Telescope in Antofagasta. Up to 60 people per slot.",
    slug: "paranal",
  },
}

// ---------------------------------------------------------------------------
// Config visual por observatorio — fondo claro, psicología de color
// ---------------------------------------------------------------------------

const obsConfig = {
  LA_SILLA: {
    // Foto
    photo: "/images/lasilla-eclipse.jpg",
    photoAlt: "Eclipse solar sobre el Observatorio La Silla, Región de Coquimbo, Chile",
    photoOverlay:
      "linear-gradient(to top, rgba(13,8,4,0.92) 0%, rgba(13,8,4,0.45) 55%, rgba(13,8,4,0.10) 100%)",
    // Página — fondo arena cálido
    pageBg: "bg-arena-50",
    // Nav claro con acento tierra
    navBg: "bg-arena-50/96 border-tierra-500/12",
    navBack: "text-tinta-500 hover:text-tierra-700",
    navTitle: "text-tinta-900",
    navIcon: "text-tierra-500",
    navDot: "text-tinta-300",
    navRing: "focus-visible:ring-tierra-500/40",
    // Info bar
    infoBar: "bg-tierra-700/6 border-b border-tierra-500/12",
    infoIcon: "text-tierra-500",
    infoText: "text-tinta-600",
    // Hero label
    heroLabel: "text-tierra-300",
    // Chips
    chipRegion: "Región de Coquimbo · La Serena ~160 km",
    chipSchedule: "Sábados 09:30–13:00 h",
    chipCapacity: "Hasta 40 cupos por visita",
    chipMinAge: "Edad mínima: 8 años (invierno)",
    heroTitle: "La Silla",
  },
  PARANAL: {
    // Foto
    photo: "/images/paranal-night.jpg",
    photoAlt: "El Very Large Telescope bajo el cielo nocturno del desierto de Atacama, Paranal",
    photoOverlay:
      "linear-gradient(to top, rgba(6,11,18,0.95) 0%, rgba(6,11,18,0.45) 55%, rgba(6,11,18,0.08) 100%)",
    // Página — fondo stone neutro frío
    pageBg: "bg-stone-50",
    // Nav claro con acento cielo
    navBg: "bg-stone-50/96 border-cielo-500/15",
    navBack: "text-stone-500 hover:text-cielo-700",
    navTitle: "text-stone-900",
    navIcon: "text-cielo-600",
    navDot: "text-stone-300",
    navRing: "focus-visible:ring-cielo-500/40",
    // Info bar
    infoBar: "bg-cielo-100/40 border-b border-cielo-500/12",
    infoIcon: "text-cielo-600",
    infoText: "text-stone-600",
    // Hero label
    heroLabel: "text-cielo-300",
    // Chips
    chipRegion: "Región de Antofagasta · Antofagasta ~130 km",
    chipSchedule: "Sábados 09:30–13:00 y 13:30–17:00 h",
    chipCapacity: "Hasta 60 cupos por turno",
    chipMinAge: "Edad mínima: 4 años",
    heroTitle: "Paranal VLT",
  },
} as const

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ locale: string; observatorio: string }>
}) {
  const { observatorio, locale } = await params
  const obsKey = obsMap[observatorio] ?? obsMap[observatorio.toLowerCase()]

  if (!obsKey) notFound()

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

      <div className={cn("min-h-[100dvh]", cfg.pageBg)}>

        {/* ── Sticky nav — modo claro por observatorio ── */}
        <header
          className={cn(
            "sticky top-0 z-40 border-b backdrop-blur-md",
            cfg.navBg
          )}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 rounded",
                cfg.navBack,
                cfg.navRing
              )}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-medium">ESO Chile</span>
            </Link>
            <span className={cn("text-sm", cfg.navDot)} aria-hidden="true">·</span>
            <Telescope className={cn("size-4 shrink-0", cfg.navIcon)} aria-hidden="true" />
            <span className={cn("font-playfair font-semibold text-sm truncate", cfg.navTitle)}>
              {isEs ? meta.nameEs : meta.nameEn}
            </span>
          </div>
        </header>

        {/* ── Photo hero — imagen del observatorio ── */}
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img
            src={cfg.photo}
            alt={cfg.photoAlt}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ background: cfg.photoOverlay }} />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-7 max-w-5xl mx-auto">
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.25em] mb-1.5 block",
                cfg.heroLabel
              )}
            >
              Entrada gratuita · Visita guiada ESO
            </span>
            <h1 className="font-playfair text-4xl sm:text-5xl font-black text-white leading-none">
              {cfg.heroTitle}
            </h1>
            <p className="text-sm text-stone-400 mt-2">{cfg.chipRegion}</p>
          </div>
        </div>

        {/* ── Info chips bar ── */}
        <div className={cn("px-4 sm:px-8 py-3", cfg.infoBar)}>
          <div className="mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-1.5 items-center">
            <span className={cn("flex items-center gap-1.5 text-xs", cfg.infoText)}>
              <Clock className={cn("size-3.5 shrink-0", cfg.infoIcon)} aria-hidden="true" />
              {cfg.chipSchedule}
            </span>
            <span className={cn("flex items-center gap-1.5 text-xs", cfg.infoText)}>
              <Users className={cn("size-3.5 shrink-0", cfg.infoIcon)} aria-hidden="true" />
              {cfg.chipCapacity}
            </span>
            <span className={cn("flex items-center gap-1.5 text-xs", cfg.infoText)}>
              <MapPin className={cn("size-3.5 shrink-0", cfg.infoIcon)} aria-hidden="true" />
              {cfg.chipRegion}
            </span>
            <span className={cn("flex items-center gap-1.5 text-xs", cfg.infoText)}>
              <ShieldCheck className={cn("size-3.5 shrink-0", cfg.infoIcon)} aria-hidden="true" />
              {cfg.chipMinAge}
            </span>
          </div>
        </div>

        {/* ── Calendario ── */}
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
