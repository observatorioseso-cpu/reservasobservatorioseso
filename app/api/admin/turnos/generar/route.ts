/**
 * POST /api/admin/turnos/generar
 *
 * Disparo manual del generador de turnos por ventana rodante.
 * Equivalente al Paso 0 del cron, pero activado por el admin desde el panel.
 *
 * Protegido: requiere sesión de admin (cookie o X-Admin-Token).
 * Idempotente: llamadas repetidas no duplican turnos.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { generarTurnosFaltantes } from "@/lib/generadorTurnos"

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const resultado = await generarTurnosFaltantes()
    return NextResponse.json({
      ok: true,
      duracionMs: Date.now() - inicio,
      ...resultado,
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    console.error("[admin/turnos/generar] error:", mensaje)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
