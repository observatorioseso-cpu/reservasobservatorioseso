/**
 * Genera la planilla Excel de participantes para visitas grupales ESO.
 * Ejecutar: node scripts/generate-group-template.mjs
 */

import ExcelJS from "exceljs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "ESO Chile"
  workbook.created = new Date()
  workbook.modified = new Date()

  // ── Colores ESO ──────────────────────────────────────────────────────────
  const C = {
    headerBg: "FF78350F",   // brown-800 (ESO tierra)
    headerFg: "FFFFFFFF",
    instrBg:  "FFFEF3C7",   // amber-100
    instrFg:  "FF5C3A1E",
    exampleBg:"FFF5F5F4",   // stone-100
    exampleFg:"FF9CA3AF",   // gray-400
    borderHair:"FFD6D3D1",
    borderHdr: "FF92400E",
    emptyCellBg: "FFFFFFFF",
    accentLine:"FFF59E0B",   // amber-400
  }

  // ════════════════════════════════════════════════════════════════════════
  // HOJA 1 — Participantes
  // ════════════════════════════════════════════════════════════════════════
  const ws = workbook.addWorksheet("Participantes", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
  })

  // Anchos de columna
  ws.columns = [
    { key: "tipo",    width: 22 },
    { key: "numero",  width: 20 },
    { key: "apat",    width: 20 },
    { key: "amat",    width: 20 },
    { key: "nombres", width: 26 },
    { key: "fnac",    width: 22 },
    { key: "email",   width: 38 },
  ]

  // ── Fila 1: Banner de instrucciones ──────────────────────────────────────
  ws.addRow(["", "", "", "", "", "", ""])
  ws.mergeCells("A1:G1")
  const bannerCell = ws.getCell("A1")
  bannerCell.value =
    "PLANILLA DE PARTICIPANTES — ESO Chile  |  " +
    "Completa una fila por persona. La primera fila debe ser el TITULAR del grupo. " +
    "Elimina las filas de ejemplo (gris) antes de enviar. " +
    "El email solo va en la fila del titular."
  bannerCell.font = { name: "Arial", size: 9.5, bold: false, color: { argb: C.instrFg } }
  bannerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.instrBg } }
  bannerCell.alignment = { wrapText: true, vertical: "middle", horizontal: "left", indent: 1 }
  bannerCell.border = { bottom: { style: "medium", color: { argb: C.accentLine } } }
  ws.getRow(1).height = 42

  // ── Fila 2: Cabeceras ────────────────────────────────────────────────────
  const headers = [
    "Tipo Documento *",
    "N° Documento *",
    "Apellido Paterno *",
    "Apellido Materno",
    "Nombre(s) *",
    "Fecha Nacimiento *",
    "Email (solo titular)",
  ]
  ws.addRow(headers)
  const hRow = ws.getRow(2)
  hRow.height = 24
  hRow.eachCell((cell) => {
    cell.font = { name: "Arial", bold: true, size: 10, color: { argb: C.headerFg } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border = {
      top:    { style: "thin",   color: { argb: C.borderHdr } },
      left:   { style: "thin",   color: { argb: C.borderHdr } },
      bottom: { style: "medium", color: { argb: C.borderHdr } },
      right:  { style: "thin",   color: { argb: C.borderHdr } },
    }
  })

  // ── Filas 3-5: Ejemplos (gris, itálica) ─────────────────────────────────
  const examples = [
    ["RUT",       "12.345.678-9", "García",  "López",  "María José",    "15/03/1990", "contacto@organizacion.cl"],
    ["PASAPORTE", "A1234567",     "Smith",   "",       "John",          "20/07/1985", ""],
    ["RUT",       "9.876.543-2",  "Muñoz",   "Reyes",  "Pedro Antonio", "05/11/2001", ""],
  ]
  for (const ex of examples) {
    ws.addRow(ex)
    const row = ws.lastRow
    row.height = 17
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 10, italic: true, color: { argb: C.exampleFg } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.exampleBg } }
      cell.alignment = { vertical: "middle" }
      cell.border = {
        top:    { style: "hair", color: { argb: C.borderHair } },
        left:   { style: "hair", color: { argb: C.borderHair } },
        bottom: { style: "hair", color: { argb: C.borderHair } },
        right:  { style: "hair", color: { argb: C.borderHair } },
      }
    })
  }

  // ── Filas 6-65: 60 filas vacías listas ───────────────────────────────────
  for (let i = 0; i < 60; i++) {
    ws.addRow(["", "", "", "", "", "", ""])
    const row = ws.lastRow
    row.height = 17
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 10 }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.emptyCellBg } }
      cell.alignment = { vertical: "middle" }
      cell.border = {
        top:    { style: "hair", color: { argb: C.borderHair } },
        left:   { style: "hair", color: { argb: C.borderHair } },
        bottom: { style: "hair", color: { argb: C.borderHair } },
        right:  { style: "hair", color: { argb: C.borderHair } },
      }
    })
  }

  // ── Validación: columna A (Tipo Documento) rows 3-65 ────────────────────
  for (let row = 3; row <= 65; row++) {
    ws.getCell(`A${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"RUT,PASAPORTE"'],
      showDropDown: false,
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Valor no valido",
      error: "Selecciona RUT o PASAPORTE del menu desplegable.",
    }
  }

  // ── Nota en cabecera de fecha ─────────────────────────────────────────────
  ws.getCell("F2").note = {
    texts: [{ font: { name: "Arial", size: 9 }, text: "Formato: DD/MM/AAAA\nEjemplo: 15/03/1990" }],
  }

  // ════════════════════════════════════════════════════════════════════════
  // HOJA 2 — Instrucciones
  // ════════════════════════════════════════════════════════════════════════
  const wsI = workbook.addWorksheet("Instrucciones")
  wsI.columns = [{ key: "a", width: 90 }]

  function addLine(text, style = "normal") {
    const row = wsI.addRow([text])
    const cell = wsI.getCell(`A${row.number}`)
    cell.alignment = { wrapText: true, vertical: "top" }
    if (style === "title") {
      cell.font = { name: "Arial", bold: true, size: 14, color: { argb: C.headerBg } }
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: C.instrBg } }
      cell.border = { bottom: { style: "medium", color: { argb: C.accentLine } } }
      row.height = 30
    } else if (style === "section") {
      cell.font = { name: "Arial", bold: true, size: 11, color: { argb: C.headerBg } }
      row.height = 22
    } else if (style === "item") {
      cell.font = { name: "Arial", size: 10, color: { argb: "FF292524" } }
      row.height = 16
    } else {
      cell.font = { name: "Arial", size: 10, color: { argb: "FF78716C" } }
      row.height = 14
    }
  }

  addLine("INSTRUCCIONES — Planilla de participantes ESO Chile", "title")
  addLine("")
  addLine("1.  COMO COMPLETAR LA PLANILLA", "section")
  addLine("    Abre la hoja 'Participantes' (pestana inferior).", "item")
  addLine("    Completa una fila por cada persona del grupo.", "item")
  addLine("    La primera fila de datos debe ser el TITULAR del grupo (quien gestionó la reserva).", "item")
  addLine("    Borra las filas de ejemplo (en gris) antes de enviar el archivo.", "item")
  addLine("")
  addLine("2.  CAMPOS OBLIGATORIOS (marcados con *)", "section")
  addLine("    Tipo Documento:    Haz clic en la celda y selecciona RUT o PASAPORTE del menu desplegable.", "item")
  addLine("    N° Documento:      RUT con puntos y guion (ej: 12.345.678-9) o numero de pasaporte.", "item")
  addLine("    Apellido Paterno:  Primer apellido.", "item")
  addLine("    Nombre(s):         Nombre o nombres de pila.", "item")
  addLine("    Fecha Nacimiento:  En formato DD/MM/AAAA — ejemplo: 15/03/1990.", "item")
  addLine("")
  addLine("3.  CAMPOS OPCIONALES", "section")
  addLine("    Apellido Materno:  Solo si aplica.", "item")
  addLine("    Email:             Solo para el titular del grupo. Dejar en blanco para el resto.", "item")
  addLine("")
  addLine("4.  COMO ENVIAR", "section")
  addLine("    Guarda el archivo (Archivo > Guardar) y adjuntalo en tu respuesta al email de ESO.", "item")
  addLine("    También puedes adjuntarlo directamente en el formulario del sitio web.", "item")
  addLine("")
  addLine("5.  CAPACIDAD MAXIMA POR VISITA", "section")
  addLine("    La Silla:        40 personas.", "item")
  addLine("    Paranal (VLT):   60 personas.", "item")
  addLine("")
  addLine("    Dudas? Escribe a: reservas@observatorioseso.cl", "item")

  // ── Guardar ───────────────────────────────────────────────────────────────
  const out = path.join(__dirname, "..", "public", "templates", "grupo-reserva-ESO.xlsx")
  await workbook.xlsx.writeFile(out)
  console.log("Planilla generada:", out)
}

generateTemplate().catch((e) => { console.error(e); process.exit(1) })
