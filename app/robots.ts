import type { MetadataRoute } from "next"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://reservasobservatorioseso.cl"
).replace(/^﻿/, "").trim()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/confirmar"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
