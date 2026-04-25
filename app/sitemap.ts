import type { MetadataRoute } from "next"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never"

interface StaticPage {
  path: string
  priority: number
  changeFrequency: ChangeFreq
}

const staticPages: StaticPage[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/reservar/la-silla", priority: 0.9, changeFrequency: "monthly" },
  { path: "/reservar/paranal", priority: 0.9, changeFrequency: "monthly" },
  { path: "/mi-reserva", priority: 0.5, changeFrequency: "never" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const page of staticPages) {
    for (const locale of ["es", "en"] as const) {
      const url = `${BASE_URL}/${locale}${page.path}`

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            es: `${BASE_URL}/es${page.path}`,
            en: `${BASE_URL}/en${page.path}`,
          },
        },
      })
    }
  }

  return entries
}
