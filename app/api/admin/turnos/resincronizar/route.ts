export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { resincronizarTurnosRegulares } from "@/lib/resincronizarTurnos"

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const result = await resincronizarTurnosRegulares()
    console.info(
      `[resincronizar] Admin ${admin.email} reactivó ${result.activados} turno(s) regular(es); ${result.omitidos} omitido(s)`
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[resincronizar] Error:", err)
    return NextResponse.json({ error: "Error al re-sincronizar turnos" }, { status: 500 })
  }
}
