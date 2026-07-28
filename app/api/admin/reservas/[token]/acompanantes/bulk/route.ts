export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import { enviarNotificacionCambio } from "@/lib/notificarCambioReserva"

/**
 * Carga masiva de la nómina de un grupo.
 *
 * Caso real: un colegio bloquea 90 cupos hoy y manda la lista la semana
 * siguiente. Cargar 89 nombres de a uno no es viable, y cada uno volvería a
 * descontar cupos que ya estaban tomados.
 *
 * Regla de cupos, igual que en el alta individual: solo se descuentan cupos
 * cuando la nómina supera lo que la reserva ya tenía bloqueado.
 */

const PersonaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(120),
  apellido: z.string().max(120).default(""),
  documento: z.string().max(60).optional().nullable(),
  esMenor: z.boolean().optional().default(false),
})

const BodySchema = z.object({
  personas: z.array(PersonaSchema).min(1, "Lista vacía").max(500),
  reemplazar: z.boolean().optional().default(false),
  forzarCupos: z.boolean().optional().default(false),
  notificar: z.boolean().optional().default(false),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { token } = await context.params

  const body = await request.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.issues },
      { status: 400 }
    )
  }
  const { personas, reemplazar, forzarCupos, notificar } = parsed.data

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })
  if (!reserva) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }
  if (reserva.estado === "ANULADA") {
    return NextResponse.json(
      { error: "No se puede cargar la nómina de una reserva anulada" },
      { status: 409 }
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const turno = await tx.turno.findUniqueOrThrow({ where: { id: reserva.turnoId } })
      const cuposLibres = turno.capacidadMax - turno.cuposOcupados

      const previos = await tx.acompanante.findMany({
        where: { reservaId: reserva.id },
        select: { id: true, nombre: true, apellido: true, documento: true },
      })

      // Regla #6: nada se borra sin dejar rastro auditable
      if (reemplazar && previos.length > 0) {
        await tx.logAgente.create({
          data: {
            tipo: "MODIFICACION",
            reservaId: reserva.id,
            resultado: `Admin ${admin.email} reemplazó la nómina completa (${previos.length} registros previos)`,
            metadata: {
              adminEmail: admin.email,
              accion: "reemplazar_nomina",
              datosEliminados: previos,
            },
          },
        })
        await tx.acompanante.deleteMany({ where: { reservaId: reserva.id } })
      }

      const acompanantesFinales = (reemplazar ? 0 : previos.length) + personas.length
      const personasConNombre = acompanantesFinales + 1 // + titular
      const delta = Math.max(0, personasConNombre - reserva.cantidadPersonas)
      const nuevaCantidad = reserva.cantidadPersonas + delta

      if (delta > 0 && cuposLibres < delta && !forzarCupos) {
        throw Object.assign(new Error("CUPOS_INSUFICIENTES"), {
          code: "CUPOS_INSUFICIENTES",
          cuposLibres,
          requeridos: delta,
        })
      }

      await tx.acompanante.createMany({
        data: personas.map((p) => ({
          reservaId: reserva.id,
          nombre: p.nombre.trim(),
          apellido: p.apellido.trim(),
          documento: (p.documento ?? "").trim() || null,
          esMenor: p.esMenor,
        })),
      })

      if (delta > 0) {
        await tx.turno.update({
          where: { id: turno.id },
          data: { cuposOcupados: { increment: delta } },
        })
        await tx.reserva.update({
          where: { token },
          data: { cantidadPersonas: nuevaCantidad },
        })
      }

      await tx.logAgente.create({
        data: {
          tipo: "MODIFICACION",
          reservaId: reserva.id,
          resultado:
            `Admin ${admin.email} cargó ${personas.length} nombres a la nómina` +
            (delta > 0 ? ` · ${delta} cupos adicionales` : " · sin cupos adicionales") +
            (forzarCupos ? " (cupos forzados)" : ""),
          metadata: {
            adminEmail: admin.email,
            accion: "carga_masiva_nomina",
            nombresCargados: personas.length,
            reemplazar,
            cuposAgregados: delta,
            forzarCupos,
          },
        },
      })

      return {
        cargados: personas.length,
        totalAcompanantes: acompanantesFinales,
        cantidadPersonas: nuevaCantidad,
        cuposAgregados: delta,
        nombresFaltantes: Math.max(0, nuevaCantidad - 1 - acompanantesFinales),
      }
    })

    if (notificar) {
      void enviarNotificacionCambio(reserva, result.cantidadPersonas, token)
    }

    return NextResponse.json({ data: result })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === "CUPOS_INSUFICIENTES") {
      const { cuposLibres, requeridos } = err as { cuposLibres?: number; requeridos?: number }
      return NextResponse.json(
        {
          error: `La nómina supera los cupos reservados en ${requeridos} personas y solo quedan ${cuposLibres} libres en el turno.`,
          code,
          cuposLibres,
          requeridos,
        },
        { status: 409 }
      )
    }
    console.error("[acompanantes/bulk POST] Error:", err)
    return NextResponse.json({ error: "Error al cargar la nómina" }, { status: 500 })
  }
}
