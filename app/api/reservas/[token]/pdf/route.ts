/**
 * GET /api/reservas/[token]/pdf
 *
 * Endpoint público para descargar el PDF de una reserva bajo demanda.
 * No requiere autenticación — el token es secreto y funciona como credencial.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generarPDFPorToken } from "@/agents/pdf"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Verificar que la reserva existe antes de intentar generar el PDF
  const reserva = await prisma.reserva.findUnique({
    where: { token },
    select: { shortId: true, estado: true },
  })

  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  let pdfBuffer: Buffer | null
  try {
    pdfBuffer = await generarPDFPorToken(token)
  } catch (err) {
    console.error(`[pdf/route] error generando PDF para token ${token}:`, err)
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 })
  }

  if (!pdfBuffer) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reserva-${reserva.shortId}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
