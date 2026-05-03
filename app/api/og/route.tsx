import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

const titles: Record<string, string> = {
  home: "La Silla & Paranal",
  "la-silla": "Observatorio La Silla",
  paranal: "Observatorio Paranal VLT",
}

const subtitles: Record<string, Record<string, string>> = {
  home: {
    es: "Reserva tu visita guiada gratuita",
    en: "Book your free guided tour",
  },
  "la-silla": {
    es: "Región de Coquimbo · Visitas los sábados",
    en: "Coquimbo Region · Saturday visits",
  },
  paranal: {
    es: "Región de Antofagasta · Desierto de Atacama",
    en: "Antofagasta Region · Atacama Desert",
  },
}

// Best photo for each obs context
const photos: Record<string, string> = {
  home: "/images/paranal-milkyway.jpg",
  "la-silla": "/images/lasilla-sunset.jpg",
  paranal: "/images/paranal-dusk.jpg",
}

async function loadImage(baseUrl: string, path: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}${path}`)
    if (!res.ok) throw new Error("photo fetch failed")
    const buffer = await res.arrayBuffer()
    const b64 = Buffer.from(buffer).toString("base64")
    const mime = path.endsWith(".png") ? "image/png" : "image/jpeg"
    return `data:${mime};base64,${b64}`
  } catch {
    return ""
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const obs = searchParams.get("obs") ?? "home"
  const locale = searchParams.get("locale") ?? "es"

  const title = titles[obs] ?? titles.home
  const subtitleMap = subtitles[obs] ?? subtitles.home
  const subtitle = subtitleMap[locale] ?? subtitleMap.es
  const photoPath = photos[obs] ?? photos.home

  // Load photo as data URL so ImageResponse (edge) can render it
  const photoSrc = await loadImage(origin, photoPath)

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0c0a09",
        }}
      >
        {/* Background photo */}
        {photoSrc && (
          <img
            src={photoSrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        )}

        {/* Left gradient overlay so text is legible */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(12,10,9,0.92) 0%, rgba(12,10,9,0.80) 55%, rgba(12,10,9,0.20) 100%)",
            display: "flex",
          }}
        />

        {/* Top amber accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "#f59e0b",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "64px",
            paddingRight: "640px",
            paddingTop: "60px",
            paddingBottom: "60px",
            height: "100%",
          }}
        >
          {/* Label */}
          <div
            style={{
              color: "#f59e0b",
              fontSize: "15px",
              letterSpacing: "3px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            ESO OBSERVATORIOS CHILE
          </div>

          {/* Title */}
          <div
            style={{
              color: "#f5f5f4",
              fontSize: obs === "home" ? "60px" : "52px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 900,
              lineHeight: 1.05,
              display: "flex",
              maxWidth: "560px",
            }}
          >
            {title}
          </div>

          {/* Separator */}
          <div
            style={{
              width: "48px",
              height: "3px",
              background: "#f59e0b",
              marginTop: "20px",
              marginBottom: "20px",
              borderRadius: "2px",
              display: "flex",
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              color: "#d6d3d1",
              fontSize: "22px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 400,
              display: "flex",
              maxWidth: "520px",
            }}
          >
            {subtitle}
          </div>

          {/* Domain */}
          <div
            style={{
              position: "absolute",
              bottom: "50px",
              left: "64px",
              color: "#a8a29e",
              fontSize: "16px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 500,
              display: "flex",
            }}
          >
            reservasobservatorioseso.cl
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=86400",
        "Content-Type": "image/png",
      },
    }
  )
}
