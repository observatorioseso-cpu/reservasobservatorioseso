import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

const ALLOWED_KEYS = [
  "HORA_CIERRE_VIERNES",
  "MAX_PERSONAS_CLIENTE",
  "EMAIL_CONTACTO",
  "WHATSAPP_ENABLED",
] as const

const PutBodySchema = z.object({
  entries: z.array(
    z.object({
      clave: z.string(),
      valor: z.string(),
    })
  ),
})

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const configs = await prisma.configSistema.findMany({
    orderBy: { clave: "asc" },
  })

  return NextResponse.json({ data: configs })
}

export async function PUT(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const parsed = PutBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const { entries } = parsed.data

  const invalidKeys = entries.filter(
    (e) => !(ALLOWED_KEYS as readonly string[]).includes(e.clave)
  )
  if (invalidKeys.length > 0) {
    return NextResponse.json(
      {
        error: "Clave(s) no permitida(s)",
        claves: invalidKeys.map((e) => e.clave),
        permitidas: ALLOWED_KEYS,
      },
      { status: 400 }
    )
  }

  const updated = await Promise.all(
    entries.map((entry) =>
      prisma.configSistema.upsert({
        where: { clave: entry.clave },
        create: {
          clave: entry.clave,
          valor: entry.valor,
          updatedBy: admin.email,
        },
        update: {
          valor: entry.valor,
          updatedBy: admin.email,
        },
      })
    )
  )

  return NextResponse.json({ data: updated })
}
