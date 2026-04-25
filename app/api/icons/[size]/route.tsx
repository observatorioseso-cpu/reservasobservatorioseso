import { ImageResponse } from "next/og"

export const runtime = "edge"

const ALLOWED_SIZES = new Set(["192", "512"])

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params

  if (!ALLOWED_SIZES.has(sizeStr)) {
    return new Response("Not found", { status: 404 })
  }

  const size = parseInt(sizeStr, 10)
  const circleSize = Math.round(size * 0.7)
  const fontSize = size === 192 ? 44 : 120

  return new ImageResponse(
    (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: "#0c0a09",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Amber circle */}
        <div
          style={{
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            background: "#f59e0b",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ESO text */}
          <div
            style={{
              color: "#0c0a09",
              fontSize: `${fontSize}px`,
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 900,
              letterSpacing: "-1px",
              display: "flex",
            }}
          >
            ESO
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, immutable, max-age=31536000",
        "Content-Type": "image/png",
      },
    }
  )
}
