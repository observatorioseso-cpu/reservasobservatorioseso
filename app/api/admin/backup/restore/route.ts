/**
 * POST /api/admin/backup/restore
 * Body: { jobId: string, confirmar: true }
 *
 * Restaura desde un backup usando estrategia UPSERT (no borra datos nuevos).
 * Requiere campo confirmar:true como protección adicional.
 */
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { obtenerDatosBackup, restaurarDesdeBackup } from "@/lib/backup"

const bodySchema = z.object({
  jobId: z.string().min(1),
  confirmar: z.literal(true),
})

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Body invalido" }, { status: 400 }) }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Se requiere confirmar:true y jobId valido" }, { status: 422 })

  const backup = await obtenerDatosBackup(parsed.data.jobId)
  if (!backup) return NextResponse.json({ error: "Backup no encontrado o datos no disponibles" }, { status: 404 })

  const inicio = Date.now()
  try {
    const { restaurados, errores } = await restaurarDesdeBackup(backup)

    console.info(`[backup/restore] completado por ${admin.email} en ${Date.now() - inicio}ms. Errores: ${errores.length}`)

    return NextResponse.json({
      ok: true,
      duracionMs: Date.now() - inicio,
      backupTimestamp: backup.timestamp,
      restaurados,
      errores: errores.slice(0, 20), // máximo 20 errores en respuesta
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
