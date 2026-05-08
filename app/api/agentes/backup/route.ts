/**
 * GET /api/agentes/backup
 *
 * Invocado por Vercel Cron 1× al día (vercel.json: "0 3 * * *").
 * Protegido con CRON_SECRET (Authorization: Bearer <secret>).
 */
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { ejecutarBackup, enviarEmailResumenBackup } from "@/lib/backup"

export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const resultado = await ejecutarBackup("cron")

    // Enviar email de resumen al admin (no bloquea la respuesta)
    enviarEmailResumenBackup(resultado).catch((e) =>
      console.error("[backup/cron/email]", e)
    )

    return NextResponse.json({
      ok: true,
      duracionMs: Date.now() - inicio,
      ...resultado,
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    console.error("[backup/cron] error:", mensaje)

    enviarEmailResumenBackup({ jobId: "?", stats: { turnos: 0, reservas: 0, acompanantes: 0, configSistema: 0, bloqueosCalendario: 0, mensajesContacto: 0, logsAgente: 0, admins: 0 }, blobUrl: null, sizeBytes: 0, error: mensaje }).catch(() => {})

    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
