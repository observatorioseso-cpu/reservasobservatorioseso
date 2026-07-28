export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { normalizarClave, ClaveBackupInvalida } from "@/lib/cifradoBackup"
import { CLAVE_BACKUP_CONFIG } from "@/lib/claveBackup"

const ALLOWED_KEYS = [
  "HORA_CIERRE_VIERNES",
  "MAX_PERSONAS_CLIENTE",
  "EMAIL_CONTACTO",
  "WHATSAPP_ENABLED",
  // La lee lib/generadorTurnos.ts y el formulario del panel siempre la manda.
  // Faltaba en esta lista, así que cualquier intento de guardar la
  // configuración se rechazaba entero con "Clave(s) no permitida(s)".
  "VENTANA_RESERVA_DIAS",
  CLAVE_BACKUP_CONFIG,
] as const

/**
 * Claves cuyo valor no vuelve nunca al navegador.
 *
 * El panel solo necesita saber si están puestas. Devolver el valor lo dejaría
 * en el panel de red del navegador, en el historial y en cualquier captura de
 * pantalla que alguien comparta.
 */
const CLAVES_SECRETAS = new Set<string>([CLAVE_BACKUP_CONFIG])

const PutBodySchema = z.object({
  entries: z.array(
    z.object({
      clave: z.string(),
      valor: z.string(),
    })
  ),
})

interface ConfigPublica {
  clave: string
  valor: string
  descripcion: string | null
  updatedAt: Date
  updatedBy: string | null
  secreto: boolean
  configurado: boolean
}

function aPublica(fila: {
  clave: string
  valor: string
  descripcion: string | null
  updatedAt: Date
  updatedBy: string | null
}): ConfigPublica {
  const secreto = CLAVES_SECRETAS.has(fila.clave)
  return {
    ...fila,
    valor: secreto ? "" : fila.valor,
    secreto,
    configurado: fila.valor.trim().length > 0,
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const configs = await prisma.configSistema.findMany({
    orderBy: { clave: "asc" },
  })

  return NextResponse.json({ data: configs.map(aPublica) })
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

  // Un secreto en blanco significa "déjalo como está". El navegador nunca
  // recibe el valor, así que el formulario tampoco puede reenviarlo: sin esta
  // regla, cada guardado de cualquier otra opción lo borraría.
  const aGuardar = entries.filter(
    (e) => !CLAVES_SECRETAS.has(e.clave) || e.valor.trim().length > 0
  )

  // La clave de respaldo se valida antes de escribirla. Guardar una clave de
  // largo equivocado deja el cifrado roto hasta el respaldo de la madrugada
  // siguiente, y el error aparecería en los logs en vez de en pantalla.
  const claveBackup = aGuardar.find((e) => e.clave === CLAVE_BACKUP_CONFIG)
  if (claveBackup) {
    try {
      normalizarClave(claveBackup.valor)
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof ClaveBackupInvalida
              ? err.message
              : "La clave de respaldo no es válida.",
          clave: CLAVE_BACKUP_CONFIG,
        },
        { status: 400 }
      )
    }
  }

  const updated = await Promise.all(
    aGuardar.map((entry) => {
      const valor = CLAVES_SECRETAS.has(entry.clave)
        ? entry.valor.trim()
        : entry.valor
      return prisma.configSistema.upsert({
        where: { clave: entry.clave },
        create: {
          clave: entry.clave,
          valor,
          updatedBy: admin.email,
        },
        update: {
          valor,
          updatedBy: admin.email,
        },
      })
    })
  )

  return NextResponse.json({ data: updated.map(aPublica) })
}
