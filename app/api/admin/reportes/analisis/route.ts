export const dynamic = "force-dynamic"

/**
 * POST /api/admin/reportes/analisis
 *
 * Generates an LLM analysis of monthly operational data using claude-sonnet-4-6.
 * Body: { mes: string, datos: object }
 * Returns: { analisis: string }
 */

import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { getAdminFromRequest } from "@/lib/adminAuth"

const client = new Anthropic()

const OBS_LABEL: Record<string, string> = {
  LA_SILLA: "La Silla",
  PARANAL:  "Paranal (VLT)",
}

export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { mes, datos } = body as { mes: string; datos: Record<string, unknown> }
  if (!mes || !datos) {
    return NextResponse.json({ error: "Faltan campos: mes, datos" }, { status: 400 })
  }

  const kpis  = datos.kpis  as Record<string, number>
  const logs  = datos.logs  as Record<string, number>
  const porObs = datos.porObs as Record<string, Record<string, number>>

  const obsResumen = Object.entries(porObs ?? {})
    .map(([obs, d]) =>
      `• ${OBS_LABEL[obs] ?? obs}: ${d.turnos} turnos, ${d.confirmadas} confirmadas, ${d.anuladas} anuladas, ${d.asistentesReales} asistentes reales registrados`
    )
    .join("\n")

  const emailsSent =
    (logs?.EMAIL ?? 0) +
    (logs?.RECORDATORIO ?? 0) +
    (logs?.RECORDATORIO_24H ?? 0) +
    (logs?.RECORDATORIO_JUEVES ?? 0) +
    (logs?.RECORDATORIO_VIERNES ?? 0)

  const prompt = `Eres el analista de operaciones del sistema de reservas de los Observatorios ESO Chile.
Analiza los siguientes datos del mes ${mes} y entrega un informe ejecutivo en español.

## Datos del mes ${mes}

**Reservas:**
- Total: ${kpis?.totalReservas ?? 0}
- Confirmadas: ${kpis?.confirmadas ?? 0} (${kpis?.tasaConversion ?? 0}% tasa de conversión)
- Anuladas: ${kpis?.anuladas ?? 0}
- Pendientes: ${kpis?.pendientes ?? 0}
- Personas confirmadas: ${kpis?.personasConfirmadas ?? 0}

**Turnos:**
- Total de turnos: ${kpis?.turnosTotales ?? 0}
- Con asistencia registrada: ${kpis?.turnosConAsistencia ?? 0}
- Asistentes reales totales: ${kpis?.asistentesRealesTotal ?? 0}

**Por observatorio:**
${obsResumen || "Sin datos por observatorio"}

**Comunicaciones automáticas:**
- Emails enviados: ${emailsSent}
- Auto-anulaciones: ${logs?.AUTOANULACION ?? 0}
- Errores del sistema: ${logs?.ERROR ?? 0}

Entrega un análisis ejecutivo con estas secciones (en markdown):

### Resumen ejecutivo
(2-3 frases que capturen lo más importante del mes)

### Puntos destacados
(3-5 bullets con los aspectos más relevantes, positivos o negativos)

### Alertas y riesgos
(Si hay métricas que requieren atención — tasa de conversión baja, muchas anulaciones, errores del sistema, turnos sin asistencia registrada. Si todo está en orden, indicarlo brevemente.)

### Recomendaciones
(2-3 acciones concretas para el equipo basadas en los datos)

Sé conciso, directo y útil para el equipo de ESO Chile. No inventes datos que no se proporcionaron.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const analisis =
    message.content[0]?.type === "text" ? message.content[0].text : "No se pudo generar el análisis."

  return NextResponse.json({ analisis, mes })
}
