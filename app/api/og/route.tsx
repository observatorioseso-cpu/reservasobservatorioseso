import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

const titles: Record<string, string> = {
  home: "La Silla & Paranal",
  "la-silla": "Observatorio La Silla",
  paranal: "Observatorio Paranal VLT",
}

const titleFontSizes: Record<string, number> = {
  home: 64,
  "la-silla": 56,
  paranal: 56,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const obs = searchParams.get("obs") ?? "home"
  const locale = searchParams.get("locale") ?? "es"

  const title = titles[obs] ?? titles.home
  const titleFontSize = titleFontSizes[obs] ?? 64
  const subtitleMap = subtitles[obs] ?? subtitles.home
  const subtitle = subtitleMap[locale] ?? subtitleMap.es

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0c0a09",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top amber bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#f59e0b",
          }}
        />

        {/* Decorative outer circle */}
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "50%",
            marginTop: "-200px",
            width: "400px",
            height: "400px",
            border: "2px solid rgba(245,158,11,0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner circle */}
          <div
            style={{
              width: "280px",
              height: "280px",
              border: "1px solid rgba(245,158,11,0.15)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
        </div>

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "60px",
            paddingRight: "60px",
            paddingTop: "60px",
            paddingBottom: "60px",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Small label */}
          <div
            style={{
              color: "#f59e0b",
              fontSize: "16px",
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

          {/* Main title */}
          <div
            style={{
              color: "#f5f5f4",
              fontSize: `${titleFontSize}px`,
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 900,
              lineHeight: 1.05,
              display: "flex",
              maxWidth: "700px",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: "#a8a29e",
              fontSize: "24px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 400,
              marginTop: "16px",
              display: "flex",
            }}
          >
            {subtitle}
          </div>

          {/* Bottom domain tag */}
          <div
            style={{
              position: "absolute",
              bottom: "50px",
              left: "60px",
              color: "#f59e0b",
              fontSize: "18px",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 600,
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
