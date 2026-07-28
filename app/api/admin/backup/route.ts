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

  // La URL del Blob nunca sale al navegador. El panel solo necesita saber si la
  // copia externa existe, y esa URL apunta a un objeto público: publicarla en la
  // respuesta la dejaría en el panel de red, en el historial y en cualquier
  // captura de pantalla.
  const data = jobs.map(({ blobUrl, ...job }) => ({
    ...job,
    enBlob: blobUrl !== null,
  }))

  return NextResponse.json({ data })
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

    const { blobUrl, ...publico } = resultado
    return NextResponse.json({
      ok: true,
      duracionMs: Date.now() - inicio,
      ...publico,
      enBlob: blobUrl !== null,
    })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
