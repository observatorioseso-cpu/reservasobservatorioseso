/**
 * Genera las planillas Excel de participantes para visitas grupales ESO.
 * Produce dos versiones: español (ES) e inglés (EN).
 * Ejecutar: node scripts/generate-group-template.mjs
 */

import ExcelJS from "exceljs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Colores ESO ───────────────────────────────────────────────────────────────
const C = {
  headerBg:   "FF78350F",
  headerFg:   "FFFFFFFF",
  instrBg:    "FFFEF3C7",
  instrFg:    "FF5C3A1E",
  exampleBg:  "FFF5F5F4",
  exampleFg:  "FF9CA3AF",
  borderHair: "FFD6D3D1",
  borderHdr:  "FF92400E",
  accentLine: "FFF59E0B",
}

// ── Textos por idioma ─────────────────────────────────────────────────────────
const LANGS = {
  es: {
    filename:    "grupo-reserva-ESO-es.xlsx",
    sheetData:   "Participantes",
    sheetHelp:   "Instrucciones",
    banner:
      "PLANILLA DE PARTICIPANTES — ESO Chile  |  " +
      "Completa una fila por persona. La primera fila debe ser el TITULAR del grupo. " +
      "Elimina las filas de ejemplo (gris) antes de enviar. " +
      "El email solo va en la fila del titular.",
    headers: [
      "Tipo Documento *",
      "N° Documento *",
      "Apellido Paterno *",
      "Apellido Materno",
      "Nombre(s) *",
      "Fecha Nacimiento *",
      "Email (solo titular)",
    ],
    dateNote:     "Formato: DD/MM/AAAA\nEjemplo: 15/03/1990",
    dropdownList: '"RUT,PASAPORTE"',
    dropdownErr:  "Selecciona RUT o PASAPORTE del menu desplegable.",
    dropdownTitle:"Valor no valido",
    examples: [
      ["RUT",       "12.345.678-9", "García",  "López",  "María José",    "15/03/1990", "contacto@organizacion.cl"],
      ["PASAPORTE", "A1234567",     "Smith",   "",       "John",          "20/07/1985", ""],
      ["RUT",       "9.876.543-2",  "Muñoz",   "Reyes",  "Pedro Antonio", "05/11/2001", ""],
    ],
    instructions: [
      ["INSTRUCCIONES — Planilla de participantes ESO Chile", "title"],
      [""],
      ["1.  COMO COMPLETAR LA PLANILLA", "section"],
      ["    Abre la hoja 'Participantes' (pestana inferior).", "item"],
      ["    Completa una fila por cada persona del grupo.", "item"],
      ["    La primera fila de datos debe ser el TITULAR del grupo (quien gestiona la reserva).", "item"],
      ["    Borra las filas de ejemplo (en gris) antes de enviar el archivo.", "item"],
      [""],
      ["2.  CAMPOS OBLIGATORIOS (marcados con *)", "section"],
      ["    Tipo Documento:    Haz clic en la celda y selecciona RUT o PASAPORTE del menu desplegable.", "item"],
      ["    N° Documento:      RUT con puntos y guion (ej: 12.345.678-9) o numero de pasaporte.", "item"],
      ["    Apellido Paterno:  Primer apellido.", "item"],
      ["    Nombre(s):         Nombre o nombres de pila.", "item"],
      ["    Fecha Nacimiento:  En formato DD/MM/AAAA — ejemplo: 15/03/1990.", "item"],
      [""],
      ["3.  CAMPOS OPCIONALES", "section"],
      ["    Apellido Materno:  Solo si aplica.", "item"],
      ["    Email:             Solo para el titular del grupo. Dejar en blanco para el resto.", "item"],
      [""],
      ["4.  COMO ENVIAR", "section"],
      ["    Guarda el archivo y adjuntalo en tu respuesta al email de ESO.", "item"],
      ["    Tambien puedes adjuntarlo directamente en el formulario del sitio web.", "item"],
      [""],
      ["5.  CAPACIDAD MAXIMA POR VISITA", "section"],
      ["    La Silla:        40 personas.", "item"],
      ["    Paranal (VLT):   60 personas.", "item"],
      [""],
      ["    Dudas? Escribe a: reservas@observatorioseso.cl", "item"],
    ],
  },

  en: {
    filename:    "grupo-reserva-ESO-en.xlsx",
    sheetData:   "Participants",
    sheetHelp:   "Instructions",
    banner:
      "PARTICIPANT LIST — ESO Chile  |  " +
      "Fill in one row per person. The first row must be the GROUP LEAD (the person who requested the visit). " +
      "Delete the example rows (grey) before sending. " +
      "Email goes only in the group lead's row.",
    headers: [
      "Document Type *",
      "Document Number *",
      "First Last Name *",
      "Second Last Name",
      "First Name(s) *",
      "Date of Birth *",
      "Email (lead visitor only)",
    ],
    dateNote:     "Format: DD/MM/YYYY\nExample: 15/03/1990",
    dropdownList: '"RUT,PASSPORT"',
    dropdownErr:  "Select RUT or PASSPORT from the drop-down menu.",
    dropdownTitle:"Invalid value",
    examples: [
      ["RUT",      "12.345.678-9", "García",  "López",  "María José",    "15/03/1990", "contact@organization.com"],
      ["PASSPORT", "A1234567",     "Smith",   "",       "John",          "20/07/1985", ""],
      ["RUT",      "9.876.543-2",  "Muñoz",   "Reyes",  "Pedro Antonio", "05/11/2001", ""],
    ],
    instructions: [
      ["INSTRUCTIONS — ESO Chile Group Visit Participant List", "title"],
      [""],
      ["1.  HOW TO FILL IN THE SPREADSHEET", "section"],
      ["    Open the 'Participants' sheet (bottom tab).", "item"],
      ["    Fill in one row for each person in the group.", "item"],
      ["    The first data row must be the GROUP LEAD (the person managing the booking).", "item"],
      ["    Delete the example rows (grey) before sending the file.", "item"],
      [""],
      ["2.  REQUIRED FIELDS (marked with *)", "section"],
      ["    Document Type:    Click the cell and select RUT (Chilean ID) or PASSPORT from the drop-down.", "item"],
      ["    Document Number:  Chilean RUT with dots and dash (e.g. 12.345.678-9) or passport number.", "item"],
      ["    First Last Name:  Primary family name.", "item"],
      ["    First Name(s):    Given name or names.", "item"],
      ["    Date of Birth:    In DD/MM/YYYY format — example: 15/03/1990.", "item"],
      [""],
      ["3.  OPTIONAL FIELDS", "section"],
      ["    Second Last Name: Only if applicable (common in Spanish names).", "item"],
      ["    Email:            Only for the group lead. Leave blank for all other members.", "item"],
      [""],
      ["4.  HOW TO SUBMIT", "section"],
      ["    Save the file and attach it when replying to the ESO confirmation email.", "item"],
      ["    You can also attach it directly in the contact form on the website.", "item"],
      [""],
      ["5.  MAXIMUM CAPACITY PER VISIT", "section"],
      ["    La Silla:        40 people.", "item"],
      ["    Paranal (VLT):   60 people.", "item"],
      [""],
      ["    Questions? Write to: reservas@observatorioseso.cl", "item"],
    ],
  },
}

// ── Función principal ─────────────────────────────────────────────────────────
async function generateTemplate(lang) {
  const L = LANGS[lang]
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "ESO Chile"
  workbook.created = new Date()
  workbook.modified = new Date()

  // ── Hoja de datos ───────────────────────────────────────────────────────────
  const ws = workbook.addWorksheet(L.sheetData, {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
  })

  ws.columns = [
    { key: "tipo",    width: 22 },
    { key: "numero",  width: 20 },
    { key: "apat",    width: 20 },
    { key: "amat",    width: 20 },
    { key: "nombres", width: 26 },
    { key: "fnac",    width: 22 },
    { key: "email",   width: 38 },
  ]

  // Fila 1: Banner
  ws.addRow(["", "", "", "", "", "", ""])
  ws.mergeCells("A1:G1")
  const banner = ws.getCell("A1")
  banner.value = L.banner
  banner.font      = { name: "Arial", size: 9.5, color: { argb: C.instrFg } }
  banner.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: C.instrBg } }
  banner.alignment = { wrapText: true, vertical: "middle", horizontal: "left", indent: 1 }
  banner.border    = { bottom: { style: "medium", color: { argb: C.accentLine } } }
  ws.getRow(1).height = 42

  // Fila 2: Cabeceras
  ws.addRow(L.headers)
  const hRow = ws.getRow(2)
  hRow.height = 24
  hRow.eachCell((cell) => {
    cell.font      = { name: "Arial", bold: true, size: 10, color: { argb: C.headerFg } }
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    cell.border    = {
      top:    { style: "thin",   color: { argb: C.borderHdr } },
      left:   { style: "thin",   color: { argb: C.borderHdr } },
      bottom: { style: "medium", color: { argb: C.borderHdr } },
      right:  { style: "thin",   color: { argb: C.borderHdr } },
    }
  })

  // Nota en cabecera de fecha
  ws.getCell("F2").note = {
    texts: [{ font: { name: "Arial", size: 9 }, text: L.dateNote }],
  }

  // Filas de ejemplo (gris)
  for (const ex of L.examples) {
    ws.addRow(ex)
    const row = ws.lastRow
    row.height = 17
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font      = { name: "Arial", size: 10, italic: true, color: { argb: C.exampleFg } }
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: C.exampleBg } }
      cell.alignment = { vertical: "middle" }
      cell.border    = {
        top:    { style: "hair", color: { argb: C.borderHair } },
        left:   { style: "hair", color: { argb: C.borderHair } },
        bottom: { style: "hair", color: { argb: C.borderHair } },
        right:  { style: "hair", color: { argb: C.borderHair } },
      }
    })
  }

  // 60 filas vacías
  for (let i = 0; i < 60; i++) {
    ws.addRow(["", "", "", "", "", "", ""])
    const row = ws.lastRow
    row.height = 17
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font      = { name: "Arial", size: 10 }
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } }
      cell.alignment = { vertical: "middle" }
      cell.border    = {
        top:    { style: "hair", color: { argb: C.borderHair } },
        left:   { style: "hair", color: { argb: C.borderHair } },
        bottom: { style: "hair", color: { argb: C.borderHair } },
        right:  { style: "hair", color: { argb: C.borderHair } },
      }
    })
  }

  // Validación desplegable columna A
  for (let row = 3; row <= 65; row++) {
    ws.getCell(`A${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [L.dropdownList],
      showDropDown: false,
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: L.dropdownTitle,
      error: L.dropdownErr,
    }
  }

  // ── Hoja de instrucciones ───────────────────────────────────────────────────
  const wsI = workbook.addWorksheet(L.sheetHelp)
  wsI.columns = [{ key: "a", width: 90 }]

  for (const [text, style = "normal"] of L.instructions) {
    const row  = wsI.addRow([text])
    const cell = wsI.getCell(`A${row.number}`)
    cell.alignment = { wrapText: true, vertical: "top" }
    if (style === "title") {
      cell.font  = { name: "Arial", bold: true, size: 14, color: { argb: C.headerBg } }
      cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: C.instrBg } }
      cell.border = { bottom: { style: "medium", color: { argb: C.accentLine } } }
      row.height = 30
    } else if (style === "section") {
      cell.font  = { name: "Arial", bold: true, size: 11, color: { argb: C.headerBg } }
      row.height = 22
    } else if (style === "item") {
      cell.font  = { name: "Arial", size: 10, color: { argb: "FF292524" } }
      row.height = 16
    } else {
      row.height = 10
    }
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const out = path.join(__dirname, "..", "public", "templates", L.filename)
  await workbook.xlsx.writeFile(out)
  console.log(`✓ [${lang.toUpperCase()}]`, out)
}

// Generar ambas versiones
await generateTemplate("es")
await generateTemplate("en")
console.log("Listo.")
