export const dynamic = "force-dynamic"

/**
 * GET /api/admin/reportes?mes=YYYY-MM&obs=LA_SILLA|PARANAL|all
 *
 * Aggregates monthly operational data for the reports dashboard.
 * Returns turnos, reserva breakdown, weekly series, and LogAgente stats.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"

function mesAFechas(year: number, month: number): { inicio: Date; fin: Date } {
  // Turno.fecha is stored as DATE (midnight UTC), so simple UTC boundaries work.
  const inicio = new Date(Date.UTC(year, month - 1, 1))
  const fin    = new Date(Date.UTC(year, month, 1))   // exclusive upper bound
  return { inicio, fin }
}

export async function GET(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mesParam = searchParams.get("mes") ?? ""
  const obsParam = searchParams.get("obs") ?? "all"

  // Default to current month if param is missing / invalid
  const now = new Date()
  let year  = now.getUTCFullYear()
  let month = now.getUTCMonth() + 1
  const match = mesParam.match(/^(\d{4})-(\d{2})$/)
  if (match) {
    year  = parseInt(match[1], 10)
    month = parseInt(match[2], 10)
    if (month < 1 || month > 12) month = now.getUTCMonth() + 1
  }

  const { inicio, fin } = mesAFechas(year, month)

  const obsFilter =
    obsParam === "LA_SILLA" || obsParam === "PARANAL"
      ? ({ observatorio: obsParam } as { observatorio: "LA_SILLA" | "PARANAL" })
      : {}

  // --- Turnos del mes con sus reservas ---
  const turnos = await prisma.turno.findMany({
    where: {
      fecha: { gte: inicio, lt: fin },
      ...obsFilter,
    },
    include: {
      reservas: {
        select: {
          id: true,
          estado: true,
          cantidadPersonas: true,
          createdAt: true,
          locale: true,
        },
      },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  })

  // --- Aggregations ---
  let confirmadas = 0, anuladas = 0, pendientes = 0
  let personasConfirmadas = 0, personasTotales = 0

  for (const t of turnos) {
    for (const r of t.reservas) {
      personasTotales += r.cantidadPersonas
      if (r.estado === "CONFIRMADA") { confirmadas++;  personasConfirmadas += r.cantidadPersonas }
      else if (r.estado === "ANULADA")  anuladas++
      else                               pendientes++
    }
  }

  const asistentesRealesTotal = turnos.reduce((s, t) => s + (t.asistentesReales ?? 0), 0)
  const turnosConAsistencia   = turnos.filter((t) => t.asistentesReales !== null).length

  // Tasa de no-show: confirmadas sin asistentes registrados vs. total confirmadas
  const tasaConversion =
    confirmadas + anuladas + pendientes > 0
      ? Math.round((confirmadas / (confirmadas + anuladas + pendientes)) * 100)
      : 0

  // --- Weekly series (by day-of-month week bucket: 1-7, 8-14, 15-21, 22-28, 29+) ---
  const semanaLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"]
  const semanas = semanaLabels.map(() => ({
    confirmadas: 0,
    anuladas: 0,
    pendientes: 0,
    personas: 0,
  }))
  for (const t of turnos) {
    const dia    = new Date(t.fecha).getUTCDate()
    const idx    = Math.min(Math.ceil(dia / 7) - 1, 4)
    for (const r of t.reservas) {
      semanas[idx].personas += r.cantidadPersonas
      if (r.estado === "CONFIRMADA")      semanas[idx].confirmadas++
      else if (r.estado === "ANULADA")    semanas[idx].anuladas++
      else                                semanas[idx].pendientes++
    }
  }

  // --- Breakdown por observatorio ---
  const porObs: Record<string, { turnos: number; confirmadas: number; anuladas: number; asistentesReales: number }> = {}
  for (const t of turnos) {
    if (!porObs[t.observatorio]) {
      porObs[t.observatorio] = { turnos: 0, confirmadas: 0, anuladas: 0, asistentesReales: 0 }
    }
    porObs[t.observatorio].turnos++
    porObs[t.observatorio].asistentesReales += t.asistentesReales ?? 0
    for (const r of t.reservas) {
      if (r.estado === "CONFIRMADA") porObs[t.observatorio].confirmadas++
      else if (r.estado === "ANULADA") porObs[t.observatorio].anuladas++
    }
  }

  // --- LogAgente stats for the month ---
  const logsRaw = await prisma.logAgente.groupBy({
    by: ["tipo"],
    where: { createdAt: { gte: inicio, lt: fin } },
    _count: { id: true },
  })
  const logs = Object.fromEntries(logsRaw.map((l) => [l.tipo, l._count.id]))

  // --- Locale breakdown ---
  const locales: Record<string, number> = {}
  for (const t of turnos) {
    for (const r of t.reservas) {
      const l = r.locale ?? "es"
      locales[l] = (locales[l] ?? 0) + 1
    }
  }

  return NextResponse.json({
    mes: `${year}-${String(month).padStart(2, "0")}`,
    periodo: { inicio: inicio.toISOString(), fin: new Date(fin.getTime() - 1).toISOString() },
    kpis: {
      totalReservas:        confirmadas + anuladas + pendientes,
      confirmadas,
      anuladas,
      pendientes,
      tasaConversion,
      personasConfirmadas,
      personasTotales,
      turnosTotales:        turnos.length,
      turnosConAsistencia,
      asistentesRealesTotal,
    },
    semanas: semanaLabels.map((label, i) => ({ label, ...semanas[i] })),
    porObs,
    locales,
    logs,
    turnos: turnos.map((t) => ({
      id:               t.id,
      observatorio:     t.observatorio,
      fecha:            t.fecha.toISOString().split("T")[0],
      horaInicio:       t.horaInicio,
      horaFin:          t.horaFin,
      capacidadMax:     t.capacidadMax,
      cuposOcupados:    t.cuposOcupados,
      asistentesReales: t.asistentesReales,
      activo:           t.activo,
      confirmadas:      t.reservas.filter((r) => r.estado === "CONFIRMADA").length,
      anuladas:         t.reservas.filter((r) => r.estado === "ANULADA").length,
      pendientes:       t.reservas.filter((r) => r.estado === "PENDIENTE_CONFIRMACION").length,
    })),
  })
}
