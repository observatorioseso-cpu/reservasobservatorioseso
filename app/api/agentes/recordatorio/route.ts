/**
 * GET /api/agentes/recordatorio
 *
 * Invocado por Vercel Cron 2× al día (vercel.json: "0 12,21 * * *").
 * Protegido con CRON_SECRET (header Authorization: Bearer <secret>).
 *
 * Ejecuta en paralelo:
 * - ejecutarAutoAnulaciones — anula reservas vencidas y libera cupos
 * - ejecutarRecordatorios — envía emails de recordatorio a pendientes
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  generarTurnosFaltantes,
  ejecutarAutoAnulaciones,
  ejecutarRecordatorios,
} from "@/agents/recordatorio"

export async function GET(request: Request): Promise<NextResponse> {
  // Verificar que la petición viene de Vercel Cron.
  // Fail-CLOSED: si CRON_SECRET no está configurado, bloquear igualmente
  // para evitar exposición accidental del endpoint.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[cron/recordatorio] CRON_SECRET no está configurado — solicitud rechazada")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const inicio = Date.now()

  // --- Paso 0: generar turnos faltantes (nunca interrumpe el cron) ----------
  let resultadoGenerador: Awaited<ReturnType<typeof generarTurnosFaltantes>> | { error: string } = {
    creados: 0,
    laSilla: 0,
    paranal: 0,
  }
  try {
    resultadoGenerador = await generarTurnosFaltantes()
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    console.error("[cron/recordatorio] error en generarTurnosFaltantes:", mensaje)
    resultadoGenerador = { error: mensaje }
  }

  // --- Pasos 1 y 2: auto-anulaciones y recordatorios (paralelos) ------------
  const [resultadoAnulaciones, resultadoRecordatorios] = await Promise.allSettled([
    ejecutarAutoAnulaciones(),
    ejecutarRecordatorios(),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    duracionMs: Date.now() - inicio,
    generador: resultadoGenerador,
    anulaciones:
      resultadoAnulaciones.status === "fulfilled"
        ? resultadoAnulaciones.value
        : { error: String(resultadoAnulaciones.reason) },
    recordatorios:
      resultadoRecordatorios.status === "fulfilled"
        ? resultadoRecordatorios.value
        : { error: String(resultadoRecordatorios.reason) },
  })
}
