import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { getAdminFromRequest } from "@/lib/adminAuth"
import type { Prisma } from "@prisma/client"

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
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
        },
      },
      acompanantes: {
        select: { nombre: true, apellido: true },
      },
    },
  })

  const fileDate = toISODate(new Date())

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
