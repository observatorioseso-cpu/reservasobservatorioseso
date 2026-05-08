export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { ejecutarBackup, enviarEmailResumenBackup } from "@/lib/backup"

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const jobs = await prisma.backupJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      triggeredBy: true,
      blobUrl: true,
      sizeBytes: true,
      checksum: true,
      stats: true,
      error: true,
      createdAt: true,
      completedAt: true,
      // NO exponer datosJson (puede ser enorme)
    },
  })

  return NextResponse.json({ data: jobs })
}

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const inicio = Date.now()
  try {
    const resultado = await ejecutarBackup(admin.email)

    enviarEmailResumenBackup(resultado).catch((e) =>
      console.error("[backup/manual/email]", e)
    )

    return NextResponse.json({
      ok: true,
      duracionMs: Date.now() - inicio,
      ...resultado,
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
