export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { prisma } from "@/lib/prisma"
import { resend, EMAIL_FROM, EMAIL_CONTACTO } from "@/lib/email"

// ---------------------------------------------------------------------------
// Rate limiting — 3 mensajes por IP cada 15 minutos (lazy init)
// ---------------------------------------------------------------------------

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "15 m"),
      analytics: false,
    })
    return ratelimit
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Zod schemas — discriminated union por tipo de consulta
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  /** Honeypot — debe estar vacío; si tiene valor → bot */
  website: z.string().optional(),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  email: z.string().email("Email inválido").max(254),
  telefono: z.string().max(30).optional(),
})

const generalSchema = baseSchema.extend({
  tipo: z.literal("GENERAL"),
  mensaje: z
    .string()
    .min(20, "El mensaje debe tener al menos 20 caracteres")
    .max(2000, "El mensaje no puede superar los 2000 caracteres"),
})

const grupalSchema = baseSchema.extend({
  tipo: z.literal("GRUPAL"),
  organizacion: z
    .string()
    .min(2, "El nombre de la organización es obligatorio")
    .max(200),
  numPersonas: z
    .number({ error: "Indica el número de personas" })
    .int()
    .min(11, "Para grupos hasta 10 personas usa el sistema estándar"),
  observatorio: z.enum(["PARANAL", "LA_SILLA", "CUALQUIERA"]).optional(),
  fechasPref: z.string().max(500).optional(),
  mensaje: z.string().max(2000).optional(),
})

const contactoSchema = z.discriminatedUnion("tipo", [generalSchema, grupalSchema])

type ContactoPayload = z.infer<typeof contactoSchema>

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

function buildTeamEmail(data: ContactoPayload, ip: string): string {
  const tipoLabel = data.tipo === "GENERAL" ? "Consulta general" : "Reserva grupal"
  const grupalSection =
    data.tipo === "GRUPAL"
      ? `
        <tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Organización</th><td style="padding:6px 12px">${escHtml(data.organizacion)}</td></tr>
        <tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">N.° personas</th><td style="padding:6px 12px">${data.numPersonas}</td></tr>
        ${data.observatorio ? `<tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Observatorio</th><td style="padding:6px 12px">${escHtml(data.observatorio)}</td></tr>` : ""}
        ${data.fechasPref ? `<tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Fechas preferidas</th><td style="padding:6px 12px">${escHtml(data.fechasPref)}</td></tr>` : ""}
      `
      : ""

  const mensajeValue =
    data.tipo === "GENERAL"
      ? data.mensaje
      : data.mensaje ?? "(sin mensaje adicional)"

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Nuevo mensaje — ${tipoLabel}</title></head>
<body style="font-family:system-ui,sans-serif;color:#1a1205;background:#fdfaf2;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede0c4">
    <div style="background:#6b3a0c;padding:20px 24px">
      <h1 style="color:#fdfaf2;margin:0;font-size:18px;font-weight:700">
        Nuevo mensaje — ${tipoLabel}
      </h1>
      <p style="color:#d9c8a0;margin:4px 0 0;font-size:13px">ESO Observatorios · Formulario de contacto</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Tipo</th><td style="padding:6px 12px">${tipoLabel}</td></tr>
        <tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Nombre</th><td style="padding:6px 12px">${escHtml(data.nombre)}</td></tr>
        <tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Email</th><td style="padding:6px 12px"><a href="mailto:${escHtml(data.email)}">${escHtml(data.email)}</a></td></tr>
        ${data.telefono ? `<tr><th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015">Teléfono</th><td style="padding:6px 12px">${escHtml(data.telefono)}</td></tr>` : ""}
        ${grupalSection}
        <tr>
          <th style="text-align:left;padding:6px 12px;background:#f7edda;color:#4a3015;vertical-align:top">Mensaje</th>
          <td style="padding:6px 12px;white-space:pre-wrap">${escHtml(mensajeValue)}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #ede0c4;margin:20px 0">
      <p style="font-size:11px;color:#8b6a3a;margin:0">IP: ${escHtml(ip)} · ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`.trim()
}

function buildConfirmationEmail(data: ContactoPayload): string {
  const nombreDisplay = escHtml(data.nombre)
  const tipoLabel = data.tipo === "GENERAL" ? "consulta general" : "solicitud de reserva grupal"
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Hemos recibido tu mensaje</title></head>
<body style="font-family:system-ui,sans-serif;color:#1a1205;background:#fdfaf2;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede0c4">
    <div style="background:#6b3a0c;padding:20px 24px">
      <h1 style="color:#fdfaf2;margin:0;font-size:18px;font-weight:700">Hemos recibido tu mensaje</h1>
      <p style="color:#d9c8a0;margin:4px 0 0;font-size:13px">ESO Observatorios Chile</p>
    </div>
    <div style="padding:24px;font-size:14px;line-height:1.6">
      <p>Hola ${nombreDisplay},</p>
      <p>
        Recibimos tu ${tipoLabel} correctamente.
        El equipo ESO la revisará y te responderá en un plazo de
        <strong>2 a 3 días hábiles</strong>.
      </p>
      ${
        data.tipo === "GRUPAL"
          ? `<p>Si aún no descargaste la planilla de participantes, puedes hacerlo desde la página de contacto antes de que te contactemos.</p>`
          : ""
      }
      <p style="color:#8b6a3a;font-size:12px;margin-top:24px">
        Este es un mensaje automático. Si tienes una consulta urgente, puedes usar el chat de asistencia
        disponible en <a href="https://reservasobservatorioseso.cl" style="color:#8b4e10">reservasobservatorioseso.cl</a>.
      </p>
    </div>
  </div>
</body>
</html>`.trim()
}

/** Escape caracteres HTML para evitar XSS en los emails */
function escHtml(str: string | undefined | null): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// ---------------------------------------------------------------------------
// POST /api/contacto
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Parsear body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  // 2. Honeypot — verificar ANTES del rate limit (respuesta inmediata falsa a bots)
  if (body.website && String(body.website).trim() !== "") {
    // Fake 200 para no revelar la detección al bot
    return NextResponse.json({ ok: true })
  }

  // 3. IP del cliente
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  // 4. Rate limiting
  const rl = getRatelimit()
  if (rl) {
    const { success, reset } = await rl.limit(`contacto:${ip}`)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados mensajes. Intenta de nuevo en unos minutos." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      )
    }
  }

  // 5. Validación Zod
  const parsed = contactoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const userAgent = request.headers.get("user-agent") ?? undefined

  // 6. Persistir en BD
  let mensajeId: string
  try {
    const record = await prisma.mensajeContacto.create({
      data: {
        tipo: data.tipo,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono ?? null,
        mensaje:
          data.tipo === "GENERAL"
            ? data.mensaje
            : (data.mensaje ?? ""),
        organizacion: data.tipo === "GRUPAL" ? data.organizacion : null,
        numPersonas: data.tipo === "GRUPAL" ? data.numPersonas : null,
        observatorio: data.tipo === "GRUPAL" ? (data.observatorio ?? null) : null,
        fechasPref: data.tipo === "GRUPAL" ? (data.fechasPref ?? null) : null,
        ip,
        userAgent,
      },
      select: { id: true },
    })
    mensajeId = record.id
  } catch (err) {
    console.error("[POST /api/contacto] Error al guardar en BD:", err)
    return NextResponse.json(
      { error: "Error al procesar tu mensaje. Intenta de nuevo." },
      { status: 500 }
    )
  }

  // 7. Emails — falla silenciosa si Resend no está configurado
  try {
    const teamHtml = buildTeamEmail(data, ip)
    const confirmHtml = buildConfirmationEmail(data)
    const tipoLabel = data.tipo === "GENERAL" ? "Consulta general" : "Reserva grupal"

    await Promise.allSettled([
      resend.emails.send({
        from: EMAIL_FROM,
        to: EMAIL_CONTACTO,
        replyTo: data.email,
        subject: `[${tipoLabel}] Mensaje de ${data.nombre} — ESO Contacto #${mensajeId.slice(-6)}`,
        html: teamHtml,
      }),
      resend.emails.send({
        from: EMAIL_FROM,
        to: data.email,
        subject: "Hemos recibido tu mensaje — ESO Observatorios Chile",
        html: confirmHtml,
      }),
    ])
  } catch (err) {
    // No fallar el request por problemas de email
    console.warn("[POST /api/contacto] Error al enviar emails:", err)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
