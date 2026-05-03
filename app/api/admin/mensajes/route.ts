export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")
  const estado = searchParams.get("estado")
  const q = searchParams.get("q")?.trim() || undefined
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)))
  const skip = (page - 1) * limit

  const where: Prisma.MensajeContactoWhereInput = {}

  if (tipo === "GENERAL" || tipo === "GRUPAL") {
    where.tipo = tipo
  }

  if (estado === "NUEVO" || estado === "LEIDO" || estado === "RESPONDIDO" || estado === "ARCHIVADO") {
    where.estado = estado
  }

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { organizacion: { contains: q, mode: "insensitive" } },
      { mensaje: { contains: q, mode: "insensitive" } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.mensajeContacto.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.mensajeContacto.count({ where }),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  })
}
