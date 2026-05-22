export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatFechaES(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00")
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatAcompanantes(
  acompanantes: Array<{ nombre: string; apellido: string }>
): string {
  return acompanantes.map((a) => `${a.nombre} ${a.apellido}`).join(" | ")
}

export async function GET(request: Request): Promise<Response> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const obs = searchParams.get("obs")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const estado = searchParams.get("estado")
  const format = searchParams.get("format") ?? "xlsx"
  // "personas" = una fila por persona (titular + acompañantes), útil para lista de bus
  const modo = searchParams.get("modo") ?? "reservas"

  const where: Prisma.ReservaWhereInput = {}

  if (obs === "LA_SILLA" || obs === "PARANAL") {
    where.observatorio = obs
  }

  if (estado === "PENDIENTE_CONFIRMACION" || estado === "CONFIRMADA" || estado === "ANULADA") {
    where.estado = estado
  }

  if (desde || hasta) {
    where.turno = {
      fecha: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      },
    }
  }

  const reservas = await prisma.reserva.findMany({
    where,
    orderBy: [{ turno: { fecha: "asc" } }, { createdAt: "asc" }],
    include: {
      turno: {
        select: {
          fecha: true,
          horaInicio: true,
          horaFin: true,
          observatorio: true,
          tipo: true,
        },
      },
      acompanantes: {
        select: { nombre: true, apellido: true, documento: true },
      },
    },
  })

  const fileDate = toISODate(new Date())

  // ── Modo "personas": una fila por persona — ideal para lista de bus ──────
  if (modo === "personas") {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "ESO Observatorios"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Lista de Pasajeros")

    sheet.columns = [
      { key: "n",           width: 6,  header: "#" },
      { key: "rol",         width: 14, header: "Rol" },
      { key: "reserva",     width: 16, header: "Reserva" },
      { key: "observatorio",width: 12, header: "Observatorio" },
      { key: "tipoVisita",  width: 12, header: "Tipo visita" },
      { key: "fecha",       width: 14, header: "Fecha" },
      { key: "horario",     width: 14, header: "Horario" },
      { key: "nombre",      width: 20, header: "Nombre" },
      { key: "apellido",    width: 20, header: "Apellido" },
      { key: "documento",   width: 18, header: "RUT / Pasaporte" },
      { key: "email",       width: 30, header: "Email (titular)" },
      { key: "telefono",    width: 16, header: "Teléfono" },
      { key: "estado",      width: 22, header: "Estado reserva" },
    ]

    // Header row — dark, white text, bold
    const headerRow = sheet.getRow(1)
    headerRow.values = ["#","Rol","Reserva","Observatorio","Tipo visita","Fecha","Horario","Nombre","Apellido","RUT / Pasaporte","Email (titular)","Teléfono","Estado reserva"]
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1917" } }
    headerRow.height = 20
    headerRow.alignment = { vertical: "middle" }

    let rowNum = 1
    let personaIdx = 0

    for (const r of reservas) {
      const fechaStr = formatFechaES(toISODate(r.turno.fecha))
      const horario = `${r.turno.horaInicio}–${r.turno.horaFin}`
      const obsLabel = r.turno.observatorio === "LA_SILLA" ? "La Silla" : "Paranal"
      const tipoLabel = r.turno.tipo === "NOCTURNA" ? "Nocturna" : "Regular"
      const isNocturna = r.turno.tipo === "NOCTURNA"
      // Amber tint for nocturnal rows, light gray for companion rows
      const fillTitular: ExcelJS.Fill = isNocturna
        ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF8E8" } }
        : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
      const fillAcomp: ExcelJS.Fill = isNocturna
        ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF3D4" } }
        : { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F4" } }

      // Titular
      personaIdx++
      rowNum++
      const titularRow = sheet.getRow(rowNum)
      titularRow.values = [
        personaIdx,
        "TITULAR",
        r.shortId,
        obsLabel,
        tipoLabel,
        fechaStr,
        horario,
        r.nombre,
        r.apellido,
        r.rutOPasaporte,
        r.email,
        r.telefono,
        r.estado,
      ]
      titularRow.font = { bold: true, size: 10 }
      titularRow.fill = fillTitular
      titularRow.height = 17

      // Acompañantes
      for (const a of r.acompanantes) {
        personaIdx++
        rowNum++
        const acompRow = sheet.getRow(rowNum)
        acompRow.values = [
          personaIdx,
          "ACOMPAÑANTE",
          r.shortId,
          obsLabel,
          tipoLabel,
          fechaStr,
          horario,
          a.nombre,
          a.apellido,
          a.documento ?? "—",
          "—",
          "—",
          "—",
        ]
        acompRow.font = { size: 10 }
        acompRow.fill = fillAcomp
        acompRow.height = 17
      }
    }

    // Total al pie
    rowNum++
    const totalRow = sheet.getRow(rowNum + 1)
    totalRow.getCell(1).value = `Total: ${personaIdx} personas`
    totalRow.font = { bold: true, size: 10, color: { argb: "FF78716C" } }

    // Borders en todas las celdas con datos
    for (let i = 1; i <= rowNum; i++) {
      const row = sheet.getRow(i)
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top:    { style: "thin", color: { argb: "FFE7E5E4" } },
          bottom: { style: "thin", color: { argb: "FFE7E5E4" } },
          left:   { style: "thin", color: { argb: "FFE7E5E4" } },
          right:  { style: "thin", color: { argb: "FFE7E5E4" } },
        }
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pasajeros-ESO-${fileDate}.xlsx"`,
      },
    })
  }

  const HEADERS = [
    "ShortId",
    "Observatorio",
    "Fecha",
    "Hora inicio",
    "Hora fin",
    "Nombre",
    "Apellido",
    "RUT/Pasaporte",
    "Email",
    "Teléfono",
    "Personas",
    "Estado",
    "Confirmada en",
    "Acompañantes",
    "Nota admin",
  ]

  if (format === "csv") {
    const escape = (val: string): string => {
      const str = val ?? ""
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows: string[] = [HEADERS.map(escape).join(",")]

    for (const r of reservas) {
      const row = [
        r.shortId,
        r.turno.observatorio,
        toISODate(r.turno.fecha),
        r.turno.horaInicio,
        r.turno.horaFin,
        r.nombre,
        r.apellido,
        r.rutOPasaporte,
        r.email,
        r.telefono,
        String(r.cantidadPersonas),
        r.estado,
        r.confirmadaEn ? toISODate(r.confirmadaEn) : "",
        formatAcompanantes(r.acompanantes),
        r.notaAdmin ?? "",
      ]
      rows.push(row.map(escape).join(","))
    }

    const csv = rows.join("\r\n")
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservas-ESO-${fileDate}.csv"`,
      },
    })
  }

  // Default: xlsx
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "ESO Observatorios"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Reservas")

  sheet.columns = [
    { key: "shortId",        width: 16 },
    { key: "observatorio",   width: 12 },
    { key: "fecha",          width: 12 },
    { key: "horaInicio",     width: 12 },
    { key: "horaFin",        width: 10 },
    { key: "nombre",         width: 20 },
    { key: "apellido",       width: 20 },
    { key: "rutOPasaporte",  width: 18 },
    { key: "email",          width: 30 },
    { key: "telefono",       width: 16 },
    { key: "personas",       width: 10 },
    { key: "estado",         width: 24 },
    { key: "confirmadaEn",   width: 14 },
    { key: "acompanantes",   width: 50 },
    { key: "notaAdmin",      width: 40 },
  ]

  // Header row — bold
  const headerRow = sheet.addRow(HEADERS)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  }

  for (const r of reservas) {
    sheet.addRow([
      r.shortId,
      r.turno.observatorio,
      toISODate(r.turno.fecha),
      r.turno.horaInicio,
      r.turno.horaFin,
      r.nombre,
      r.apellido,
      r.rutOPasaporte,
      r.email,
      r.telefono,
      r.cantidadPersonas,
      r.estado,
      r.confirmadaEn ? toISODate(r.confirmadaEn) : "",
      formatAcompanantes(r.acompanantes),
      r.notaAdmin ?? "",
    ])
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reservas-ESO-${fileDate}.xlsx"`,
    },
  })
}
