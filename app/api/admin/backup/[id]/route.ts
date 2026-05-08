export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { obtenerDatosBackup, eliminarDeBlob } from "@/lib/backup"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const backup = await obtenerDatosBackup(id)
  if (!backup) return NextResponse.json({ error: "Backup no encontrado o no disponible" }, { status: 404 })

  const json = JSON.stringify(backup, null, 2)
  const fecha = backup.timestamp.split("T")[0]

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="eso-backup-${fecha}.json"`,
    },
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const job = await prisma.backupJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (job.blobUrl) await eliminarDeBlob(job.blobUrl)
  await prisma.backupJob.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
