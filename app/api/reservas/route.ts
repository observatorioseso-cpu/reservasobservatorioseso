export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { reservaSchema } from "@/lib/schemas"
import { calcularFechaLimiteConfirmacion } from "@/lib/confirmacion"
import { estaAbiertaLaReserva } from "@/lib/horarios"
import { validarReserva } from "@/agents/validador"

// Rate limiting: máx. 5 reservas por minuto por IP (lazy init)
let ratelimit: Ratelimit | null = null
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: false,
    })
    return ratelimit
  } catch {
    return null
  }
}

/** Genera un shortId único legible: "ESO-A1B2C3D4" */
function generarShortId(): string {
  return `ESO-${randomBytes(4).toString("hex").toUpperCase()}`
}

export async function POST(request: Request) {
  // 1. Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const rl = getRatelimit()
  if (rl) {
    const { success, reset } = await rl.limit(`reserva:${ip}`)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en unos minutos." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      )
    }
  }

  // 2. Parsear body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  // 3. Validación Zod
  const parsed = reservaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // 4. Verificar 11+ personas antes de ir a la BD (bloqueo en servidor)
  if (data.cantidadPersonas > 10) {
    return NextResponse.json(
      {
        error: "Máximo 10 personas por reserva individual",
        contacto: "reservas@observatorioseso.cl",
      },
      { status: 422 }
    )
  }

  // 4b. Validación IA (síncrono, pre-persistencia)
  const validacion = await validarReserva({
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    telefono: data.telefono,
    rutOPasaporte: data.rutOPasaporte,
    cantidadPersonas: data.cantidadPersonas,
  })

  if (!validacion.valido) {
    return NextResponse.json(
      { error: "Los datos de la reserva no parecen válidos.", detalle: validacion.motivo },
      { status: 422 }
    )
  }

  // 5. Transacción atómica: verificar cupos + ventana + crear reserva + decrementar cupos
  let reserva: { token: string; shortId: string; id: string }
  try {
    reserva = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const turno = await tx.turno.findUnique({ where: { id: data.turnoId } })

      if (!turno) throw new Error("TURNO_NOT_FOUND")
      if (!turno.activo) throw new Error("TURNO_INACTIVE")

      // Verificar que las reservas para este turno todavía están abiertas
      // (leer horaCierre desde ConfigSistema; si no existe, usar 16)
      const configCierre = await tx.configSistema.findUnique({
        where: { clave: "HORA_CIERRE_VIERNES" },
      })
      const horaCierre = configCierre ? parseInt(configCierre.valor, 10) : 16

      if (!estaAbiertaLaReserva(turno.fecha, horaCierre)) {
        throw new Error("RESERVAS_CERRADAS")
      }

      const cuposLibres = turno.capacidadMax - turno.cuposOcupados
      if (cuposLibres < data.cantidadPersonas) throw new Error("NO_CUPOS")

      // Decrementar cupos
      await tx.turno.update({
        where: { id: data.turnoId },
        data: { cuposOcupados: { increment: data.cantidadPersonas } },
      })

      const passwordHash = await bcrypt.hash(data.password, 12)
      const shortId = generarShortId()

      const nueva = await tx.reserva.create({
        data: {
          turnoId: data.turnoId,
          observatorio: turno.observatorio,
          shortId,
          fechaLimiteConfirmacion: calcularFechaLimiteConfirmacion(turno.fecha),
          nombre: data.nombre,
          apellido: data.apellido,
          rutOPasaporte: data.rutOPasaporte,
          email: data.email,
          telefono: data.telefono,
          idioma: data.idioma,
          cantidadPersonas: data.cantidadPersonas,
          tienesMenores: data.tienesMenores,
          recibirWhatsapp: data.recibirWhatsapp,
          whatsappOptIn: data.whatsappOptIn,
          locale: data.locale,
          passwordHash,
          acompanantes: {
            create: data.acompanantes.map((a) => ({
              nombre: a.nombre,
              apellido: a.apellido,
              documento: a.documento ?? null,
            })),
          },
        },
        select: { id: true, token: true, shortId: true },
      })

      await tx.logAgente.create({
        data: {
          tipo: "VALIDACION",
          reservaId: nueva.id,
          resultado: "Reserva validada por IA",
          duracionMs: validacion.duracionMs,
          metadata: { modelo: "claude-haiku-4-5-20251001" },
        },
      })

      return nueva
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN"

    if (message === "TURNO_NOT_FOUND") {
      return NextResponse.json({ error: "El turno seleccionado no existe" }, { status: 404 })
    }
    if (message === "TURNO_INACTIVE") {
      return NextResponse.json({ error: "Este turno ya no está disponible" }, { status: 409 })
    }
    if (message === "RESERVAS_CERRADAS") {
      return NextResponse.json(
        {
          error: "Las reservas para esta fecha ya están cerradas",
          contacto: "reservas@observatorioseso.cl",
        },
        { status: 409 }
      )
    }
    if (message === "NO_CUPOS") {
      return NextResponse.json(
        { error: "No hay cupos suficientes para esta cantidad de personas" },
        { status: 409 }
      )
    }

    console.error("[POST /api/reservas] Error:", err)
    return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 })
  }

  // 6. Comunicaciones post-reserva (async, no bloquea la respuesta)
  import("@/agents/comunicaciones")
    .then(({ orquestarComunicacionesPostReserva }) =>
      orquestarComunicacionesPostReserva(reserva.id).catch((e) =>
        console.error("[comunicaciones] error:", e)
      )
    )
    .catch(() => {})

  return NextResponse.json(
    { token: reserva.token, shortId: reserva.shortId },
    { status: 201 }
  )
}
