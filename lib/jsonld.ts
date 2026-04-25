/**
 * Server-side JSON-LD schema builders.
 * Uses plain typed objects — schema-dts is not a project dependency.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

interface Organization {
  "@context": "https://schema.org"
  "@type": "Organization"
  name: string
  url: string
  sameAs: string[]
}

interface GeoCoordinates {
  "@type": "GeoCoordinates"
  latitude: number
  longitude: number
}

interface Place {
  "@type": "Place"
  name: string
  address?: {
    "@type": "PostalAddress"
    addressRegion: string
    addressCountry: string
  }
}

interface TouristAttraction {
  "@context": "https://schema.org"
  "@type": "TouristAttraction"
  name: string
  description: string
  url: string
  geo: GeoCoordinates
  isAccessibleForFree: boolean
  publicAccess: boolean
  touristType: string
  containedInPlace: Place
}

interface ListItem {
  "@type": "ListItem"
  position: number
  name: string
  item: string
}

interface BreadcrumbList {
  "@context": "https://schema.org"
  "@type": "BreadcrumbList"
  itemListElement: ListItem[]
}

// ---------------------------------------------------------------------------
// Exported builders
// ---------------------------------------------------------------------------

export function organizationSchema(): Organization {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ESO Observatorios Chile",
    url: BASE_URL,
    sameAs: ["https://www.eso.org"],
  }
}

export function touristAttractionSchema(
  obs: "LA_SILLA" | "PARANAL"
): TouristAttraction {
  if (obs === "LA_SILLA") {
    return {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: "Observatorio La Silla — ESO",
      description:
        "El primer observatorio de la ESO en Chile. Telescopios históricos en la cima de un cerro del desierto de Atacama, a 600 km al norte de Santiago. Visitas guiadas gratuitas los sábados.",
      url: `${BASE_URL}/es/reservar/la-silla`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: -29.2563,
        longitude: -70.7314,
      },
      isAccessibleForFree: true,
      publicAccess: true,
      touristType: "Astronomy",
      containedInPlace: {
        "@type": "Place",
        name: "Región de Coquimbo",
        address: {
          "@type": "PostalAddress",
          addressRegion: "Coquimbo",
          addressCountry: "CL",
        },
      },
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: "Observatorio Paranal VLT — ESO",
    description:
      "El hogar del Very Large Telescope (VLT), cuatro telescopios de 8,2 metros que conforman el instrumento óptico más poderoso del mundo. Ubicado en el desierto de Atacama con más de 320 noches despejadas al año. Visitas guiadas gratuitas.",
    url: `${BASE_URL}/es/reservar/paranal`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: -24.6275,
      longitude: -70.4044,
    },
    isAccessibleForFree: true,
    publicAccess: true,
    touristType: "Astronomy",
    containedInPlace: {
      "@type": "Place",
      name: "Región de Antofagasta",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Antofagasta",
        addressCountry: "CL",
      },
    },
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
