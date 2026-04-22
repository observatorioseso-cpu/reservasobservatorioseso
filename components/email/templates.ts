/**
 * Email templates as HTML strings with inline styles.
 * Resend accepts HTML directly — no react-email dependency needed.
 */

const BASE_STYLES = `
  font-family: 'Libre Franklin', Georgia, serif;
  background-color: #0c0a09;
  color: #f5f5f4;
  margin: 0;
  padding: 0;
`

const CARD_STYLE = `
  background-color: #1c1917;
  border: 1px solid #292524;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
`

const AMBER_STYLE = `color: #f59e0b; font-weight: 600;`
const MUTED_STYLE = `color: #78716c; font-size: 13px;`

export interface EmailConfirmacionData {
  nombre: string
  apellido: string
  shortId: string
  token: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  fechaLimite: string
  portalUrl: string
  locale: "es" | "en"
}

export function emailConfirmacionHTML(data: EmailConfirmacionData): string {
  const obsNombre = data.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const isES = data.locale === "es"

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isES ? "Reserva registrada" : "Booking confirmed"} — ${obsNombre}</title>
</head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding: 40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <!-- Header -->
        <tr><td style="padding-bottom: 32px;">
          <p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; ${AMBER_STYLE}">
            ESO Observatorios Chile
          </p>
          <h1 style="margin: 8px 0 0; font-family: Georgia, serif; font-size: 28px; font-weight: 900; color: #f5f5f4; line-height: 1.1;">
            ${isES ? "¡Reserva registrada!" : "Booking confirmed!"}
          </h1>
          <p style="margin: 8px 0 0; ${MUTED_STYLE}">
            ${isES
              ? "Revisa los detalles y confirma antes del plazo."
              : "Review the details and confirm before the deadline."}
          </p>
        </td></tr>

        <!-- Booking card -->
        <tr><td style="${CARD_STYLE}">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; ${AMBER_STYLE}">
            N.° ${data.shortId}
          </p>
          <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #f5f5f4;">
            ${data.nombre} ${data.apellido}
          </p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="${MUTED_STYLE} padding-bottom: 8px;">
                <strong style="color: #a8a29e;">${isES ? "Observatorio" : "Observatory"}</strong><br>
                ${obsNombre}
              </td>
              <td style="${MUTED_STYLE} padding-bottom: 8px;">
                <strong style="color: #a8a29e;">${isES ? "Fecha" : "Date"}</strong><br>
                ${data.fecha}
              </td>
            </tr>
            <tr>
              <td style="${MUTED_STYLE} padding-bottom: 8px;">
                <strong style="color: #a8a29e;">${isES ? "Turno" : "Shift"}</strong><br>
                ${data.horaInicio} – ${data.horaFin}
              </td>
              <td style="${MUTED_STYLE} padding-bottom: 8px;">
                <strong style="color: #a8a29e;">${isES ? "Personas" : "People"}</strong><br>
                ${data.cantidadPersonas}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Deadline alert -->
        <tr><td style="background-color: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #f59e0b; font-size: 13px;">
            ⏰ ${isES
              ? `Confirma tu asistencia antes de: <strong>${data.fechaLimite}</strong>`
              : `Confirm your attendance before: <strong>${data.fechaLimite}</strong>`
            }
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding: 8px 0 24px; text-align: center;">
          <a href="${data.portalUrl}"
             style="display: inline-block; background-color: #f59e0b; color: #0c0a09; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
            ${isES ? "Ver y confirmar mi reserva" : "View and confirm my booking"}
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top: 1px solid #292524; padding-top: 20px; text-align: center;">
          <p style="${MUTED_STYLE} margin: 0;">
            ${isES
              ? `¿Preguntas? Escríbenos a <a href="mailto:reservas@observatorioseso.cl" style="color: #7dd3fc;">reservas@observatorioseso.cl</a>`
              : `Questions? Write to <a href="mailto:reservas@observatorioseso.cl" style="color: #7dd3fc;">reservas@observatorioseso.cl</a>`
            }
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #44403c;">
            © ESO Chile — La Silla & Paranal
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface EmailRecordatorioData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  fechaLimite: string
  portalUrl: string
  locale: "es" | "en"
}

export function emailRecordatorioHTML(data: EmailRecordatorioData): string {
  const obsNombre = data.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const isES = data.locale === "es"

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head><meta charset="UTF-8"><title>Recordatorio — ${obsNombre}</title></head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding: 40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
        <tr><td>
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; ${AMBER_STYLE}">
            ESO Observatorios — Recordatorio
          </p>
          <h1 style="margin: 8px 0; font-family: Georgia, serif; font-size: 24px; font-weight: 900; color: #f5f5f4;">
            ${isES ? "¿Confirmas tu visita?" : "Are you confirming your visit?"}
          </h1>
          <p style="${MUTED_STYLE}">
            ${data.nombre}, ${isES
              ? `tu reserva <strong style="color:#a8a29e;">${data.shortId}</strong> a <strong style="color:#a8a29e;">${obsNombre}</strong> (${data.fecha} ${data.horaInicio}) aún está pendiente.`
              : `your booking <strong style="color:#a8a29e;">${data.shortId}</strong> at <strong style="color:#a8a29e;">${obsNombre}</strong> (${data.fecha} ${data.horaInicio}) is still pending.`
            }
          </p>
          <p style="color: #f59e0b; font-size: 13px; margin: 16px 0;">
            ${isES ? `Plazo: ${data.fechaLimite}` : `Deadline: ${data.fechaLimite}`}
          </p>
          <a href="${data.portalUrl}"
             style="display: inline-block; background-color: #f59e0b; color: #0c0a09; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px;">
            ${isES ? "Confirmar asistencia" : "Confirm attendance"}
          </a>
        </td></tr>
        <tr><td style="border-top: 1px solid #292524; padding-top: 16px; margin-top: 24px;">
          <p style="${MUTED_STYLE} margin: 0;">
            <a href="mailto:reservas@observatorioseso.cl" style="color: #7dd3fc;">reservas@observatorioseso.cl</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
