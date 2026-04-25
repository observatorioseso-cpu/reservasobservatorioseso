import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { touristAttractionSchema, breadcrumbSchema } from "@/lib/jsonld"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

const obsMap: Partial<Record<string, "LA_SILLA" | "PARANAL">> = {
  "la-silla": "LA_SILLA",
  LA_SILLA: "LA_SILLA",
  paranal: "PARANAL",
  PARANAL: "PARANAL",
}

const obsMeta: Record<
  "LA_SILLA" | "PARANAL",
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
      "Reserva gratis tu visita guiada al Observatorio La Silla de la ESO, en la Región de Coquimbo. Visitas los sábados, máximo 10 personas.",
    descEn:
      "Book your free guided tour to ESO's La Silla Observatory in the Coquimbo Region. Saturday visits, up to 10 people.",
    slug: "la-silla",
  },
  PARANAL: {
    nameEs: "Observatorio Paranal VLT — ESO Chile",
    nameEn: "Paranal VLT Observatory — ESO Chile",
    descEs:
      "Reserva gratis tu visita guiada al Observatorio Paranal de la ESO, hogar del Very Large Telescope en Antofagasta. Máximo 10 personas.",
    descEn:
      "Book your free guided tour to ESO's Paranal Observatory, home of the Very Large Telescope in Antofagasta. Up to 10 people.",
    slug: "paranal",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; obs: string }>
}): Promise<Metadata> {
  const { locale, obs } = await params
  const obsKey = obsMap[obs]
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
          url: `/og/${meta.slug}.png`,
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
      images: [`/og/${meta.slug}.png`],
    },
  }
}

export default async function ReservarObsPage({
  params,
}: {
  params: Promise<{ locale: string; obs: string }>
}) {
  const { locale, obs } = await params
  const obsKey = obsMap[obs]
  if (!obsKey) notFound()
  // After notFound(), obsKey is narrowed to "LA_SILLA" | "PARANAL"
  const resolvedKey = obsKey as "LA_SILLA" | "PARANAL"
  const meta = obsMeta[resolvedKey]
  const isEs = locale === "es"

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
      {/* Reservation flow rendered by child routes / components */}
    </>
  )
}
