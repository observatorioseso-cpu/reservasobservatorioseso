/**
 * GET /api/agentes/recordatorio/viernes
 *
 * Invocado por Vercel Cron (vercel.json: "45 14 * * 5") — viernes 14:45 UTC (11:45 Chile).
 * Envía el email urgente de último aviso a titulares que aún no han confirmado
 * cuya fechaLimiteConfirmacion vence hoy.
 * Incluye link de extensión de +2 horas (one-time use).
 *
 * Protegido con CRON_SECRET (header Authorization: Bearer <secret>).
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { ejecutarRecordatoriosViernes } from "@/agents/recordatorio"

export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[cron/recordatorio/viernes] CRON_SECRET no está configurado — solicitud rechazada")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const inicio = Date.now()

  let resultado: Awaited<ReturnType<typeof ejecutarRecordatoriosViernes>> | { error: string }
  try {
    resultado = await ejecutarRecordatoriosViernes()
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    console.error("[cron/recordatorio/viernes] error:", mensaje)
    resultado = { error: mensaje }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    duracionMs: Date.now() - inicio,
    recordatoriosViernes: resultado,
  })
}
