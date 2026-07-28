export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { documentoSchema, TIPOS_VISITANTE } from "@/lib/schemas"
import { calcularFechaLimiteConfirmacion } from "@/lib/confirmacion"
import type { Prisma } from "@prisma/client"

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obs = searchParams.get("obs")
  const estado = searchParams.get("estado")
  const q = searchParams.get("q")?.trim() || undefined
  const turnoId = searchParams.get("turnoId") || undefined
  const fecha = searchParams.get("fecha") || undefined // ISO YYYY-MM-DD — filtra por turno.fecha
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const skip = (page - 1) * limit

  const where: Prisma.ReservaWhereInput = {}

  if (obs === "LA_SILLA" || obs === "PARANAL") {
    where.observatorio = obs
  }

  if (estado === "PENDIENTE_CONFIRMACION" || estado === "CONFIRMADA" || estado === "ANULADA") {
    where.estado = estado
  }

  if (turnoId) {
    where.turnoId = turnoId
  }

  if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const desde = new Date(`${fecha}T00:00:00.000Z`)
    const hasta = new Date(`${fecha}T23:59:59.999Z`)
    where.turno = { fecha: { gte: desde, lte: hasta } }
  }

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { apellido: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { shortId: { contains: q, mode: "insensitive" } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        shortId: true,
        observatorio: true,
        estado: true,
        nombre: true,
        apellido: true,
        rutOPasaporte: true,
        email: true,
        telefono: true,
        idioma: true,
        cantidadPersonas: true,
        tienesMenores: true,
        recibirWhatsapp: true,
        whatsappOptIn: true,
        locale: true,
        confirmadaEn: true,
        fechaLimiteConfirmacion: true,
        turnoId: true,
        createdAt: true,
        updatedAt: true,
        turno: {
          select: {
            fecha: true,
            horaInicio: true,
            horaFin: true,
            observatorio: true,
          },
        },
        _count: {
          select: { acompanantes: true },
        },
      },
    }),
    prisma.reserva.count({ where }),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

// ---------------------------------------------------------------------------
// POST — Reserva de grupo creada por el admin (bus, colegio, agencia)
//
// Diferencias con POST /api/reservas (público):
//  - Sin tope de 10 personas: el límite es la capacidad del turno (o se fuerza).
//  - Sin validador IA: el admin es fuente confiable, no gastamos tokens.
//  - Sin ventana de cierre: el admin puede cargar un grupo el mismo día.
//  - cantidadPersonas puede superar la lista de nombres: un colegio reserva 90
//    cupos hoy y entrega la nómina después.
//  - Documento de acompañante opcional: las listas de bus llegan solo con nombres.
// ---------------------------------------------------------------------------

const AcompananteAdminSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().max(100).default(""),
  documento: z.string().max(60).optional().nullable(),
  esMenor: z.boolean().optional().default(false),
})

const CrearReservaAdminSchema = z
  .object({
    turnoId: z.string().min(1, "Turno requerido"),
    nombre: z.string().min(1, "Nombre requerido").max(100),
    apellido: z.string().min(1, "Apellido requerido").max(100),
    rutOPasaporte: documentoSchema,
    email: z.string().email("Correo inválido"),
    telefono: z.string().min(6, "Teléfono inválido").max(20),
    idioma: z.enum(["ES", "EN"]).default("ES"),
    locale: z.enum(["es", "en"]).default("es"),
    cantidadPersonas: z.number().int().min(1, "Mínimo 1 persona").max(500),
    tipoVisitante: z.enum(TIPOS_VISITANTE).default("COLEGIO"),
    organizacion: z.string().max(150).optional().nullable(),
    nacionalidad: z.string().max(60).optional().nullable(),
    ciudadResidencia: z.string().max(100).optional().nullable(),
    infoAdicional: z.string().max(2000).optional().nullable(),
    titularEsMenor: z.boolean().default(false),
    acompanantes: z.array(AcompananteAdminSchema).max(499).default([]),
    estado: z.enum(["PENDIENTE_CONFIRMACION", "CONFIRMADA"]).default("CONFIRMADA"),
    forzarCupos: z.boolean().default(false),
    notificar: z.boolean().default(true),
    notaAdmin: z.string().max(1000).optional().nullable(),
    password: z.string().min(6, "Mínimo 6 caracteres").max(100).optional(),
  })
  .refine((d) => d.acompanantes.length <= d.cantidadPersonas - 1, {
    message: "Hay más nombres en la lista que cupos declarados",
    path: ["acompanantes"],
  })

function generarShortId(): string {
  return `ESO-${randomBytes(4).toString("hex").toUpperCase()}`
}

/** Contraseña temporal legible para entregar al responsable del grupo. */
function generarPasswordTemporal(): string {
  return randomBytes(6).toString("base64url").slice(0, 8)
}

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 })

  const parsed = CrearReservaAdminSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const d = parsed.data

  const passwordPlano = d.password ?? generarPasswordTemporal()
  const passwordGenerada = d.password ? null : passwordPlano
  const passwordHash = await bcrypt.hash(passwordPlano, 12)
  const shortId = generarShortId()

  try {
    const reserva = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const turno = await tx.turno.findUnique({ where: { id: d.turnoId } })
      if (!turno) throw new Error("TURNO_NOT_FOUND")
      if (!turno.activo && !d.forzarCupos) throw new Error("TURNO_INACTIVE")

      const cuposLibres = turno.capacidadMax - turno.cuposOcupados
      if (d.cantidadPersonas > cuposLibres && !d.forzarCupos) {
        throw Object.assign(new Error("NO_CUPOS"), { cuposLibres })
      }

      await tx.turno.update({
        where: { id: turno.id },
        data: { cuposOcupados: { increment: d.cantidadPersonas } },
      })

      const nueva = await tx.reserva.create({
        data: {
          turnoId: turno.id,
          observatorio: turno.observatorio,
          shortId,
          estado: d.estado,
          confirmadaEn: d.estado === "CONFIRMADA" ? new Date() : null,
          fechaLimiteConfirmacion: calcularFechaLimiteConfirmacion(turno.fecha),
          nombre: d.nombre,
          apellido: d.apellido,
          rutOPasaporte: d.rutOPasaporte,
          email: d.email,
          telefono: d.telefono,
          idioma: d.idioma,
          locale: d.locale,
          cantidadPersonas: d.cantidadPersonas,
          tienesMenores: d.titularEsMenor || d.acompanantes.some((a) => a.esMenor),
          titularEsMenor: d.titularEsMenor,
          tipoVisitante: d.tipoVisitante,
          organizacion: (d.organizacion ?? "").trim() || null,
          nacionalidad: (d.nacionalidad ?? "").trim() || null,
          ciudadResidencia: (d.ciudadResidencia ?? "").trim() || null,
          infoAdicional: (d.infoAdicional ?? "").trim() || null,
          notaAdmin: (d.notaAdmin ?? "").trim() || null,
          passwordHash,
          acompanantes: {
            create: d.acompanantes.map((a) => ({
              nombre: a.nombre.trim(),
              apellido: a.apellido.trim(),
              documento: (a.documento ?? "").trim() || null,
              esMenor: a.esMenor,
            })),
          },
        },
        select: { id: true, token: true, shortId: true },
      })

      const nombresFaltantes = d.cantidadPersonas - 1 - d.acompanantes.length

      await tx.logAgente.create({
        data: {
          tipo: "MODIFICACION",
          reservaId: nueva.id,
          resultado:
            `Admin ${admin.email} creó reserva de grupo: ${d.cantidadPersonas} personas` +
            (d.forzarCupos ? " (cupos forzados)" : "") +
            (nombresFaltantes > 0 ? ` · ${nombresFaltantes} nombres pendientes` : ""),
          metadata: {
            adminEmail: admin.email,
            accion: "crear_reserva_grupo",
            cantidadPersonas: d.cantidadPersonas,
            nombresCargados: d.acompanantes.length,
            nombresFaltantes,
            forzarCupos: d.forzarCupos,
            estadoInicial: d.estado,
            cuposLibresAntes: cuposLibres,
          },
        },
      })

      return nueva
    })

    // Email al titular (async, no bloquea la respuesta ni la deja fallar)
    if (d.notificar) {
      import("@/agents/comunicaciones")
        .then(({ orquestarComunicacionesPostReserva }) =>
          orquestarComunicacionesPostReserva(reserva.id)
        )
        .catch((e) => console.error("[admin/reservas POST] comunicaciones:", e))
    }

    return NextResponse.json(
      { token: reserva.token, shortId: reserva.shortId, passwordGenerada },
      { status: 201 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN"

    if (message === "TURNO_NOT_FOUND") {
      return NextResponse.json({ error: "El turno seleccionado no existe" }, { status: 404 })
    }
    if (message === "TURNO_INACTIVE") {
      return NextResponse.json(
        { error: "Este turno está inactivo. Marca «forzar cupos» si quieres cargarlo igual.", code: "TURNO_INACTIVE" },
        { status: 409 }
      )
    }
    if (message === "NO_CUPOS") {
      const cuposLibres = (err as { cuposLibres?: number }).cuposLibres ?? 0
      return NextResponse.json(
        {
          error: `Solo quedan ${cuposLibres} cupos en este turno. Marca «forzar cupos» para sobrepasar la capacidad.`,
          code: "NO_CUPOS",
          cuposLibres,
        },
        { status: 409 }
      )
    }

    console.error("[admin/reservas POST] Error:", err)
    return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 })
  }
}
