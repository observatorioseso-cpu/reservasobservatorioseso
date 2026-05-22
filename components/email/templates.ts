/**
 * Email templates as HTML strings with inline styles.
 * Resend accepts HTML directly — no react-email dependency needed.
 *
 * CLIENT TEMPLATES
 *   emailConfirmacionHTML       – Created, awaiting user confirmation
 *   emailConfirmadaHTML         – Confirmed by user              (ESO Email 1)
 *   emailAnulacionHTML          – Cancelled by user or auto      (ESO Email 2)
 *   emailModificadaHTML         – Rescheduled by staff           (ESO Email 3)
 *   emailRecordatorioHTML          – 72h reminder, pending confirmation
 *   emailRecordatorio24hHTML       – 24h reminder, two one-click buttons
 *   emailRecordatorioJuevesHTML    – Thursday reminder, friendly + 2 buttons
 *   emailRecordatorioViernesHTML   – Friday urgent, mini-card + extend link
 *   emailExtensionHTML             – Extension granted, new deadline
 *   emailRecordatorioVisitaHTML    – Pre-visit reminder, confirmed visits (ESO Email 5)
 *   emailEncuestaHTML              – Post-visit survey              (ESO Email 4)
 *   emailCierreEmergenciaHTML      – Emergency closure
 *
 * STAFF TEMPLATES
 *   emailStaffConfirmadaHTML    – New confirmed visit
 *   emailStaffAnulacionHTML     – Visit cancelled
 *   emailStaffModificadaHTML    – Visit rescheduled
 */

// ─── Palette ──────────────────────────────────────────────────────────────────

const BG      = "#0c0a09"
const CARD_BG = "#1c1917"
const BORDER  = "#292524"
const TEXT    = "#f5f5f4"
const MUTED_C = "#78716c"
const SUBTLE_C = "#a8a29e"
const AMBER_C = "#f59e0b"
const SKY_C   = "#7dd3fc"

// ─── Style tokens ─────────────────────────────────────────────────────────────

const FONT   = "'Libre Franklin', Georgia, serif"
const CARD_S = `background-color: ${CARD_BG}; border: 1px solid ${BORDER}; border-radius: 12px; padding: 24px;`
const MUTED_S = `color: ${MUTED_C}; font-size: 13px; line-height: 1.6;`
const LABEL_S = `display: block; color: ${SUBTLE_C}; font-size: 11px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 3px;`
const EYEBROW = `font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${AMBER_C};`
const EYEBROW_MUTED = `font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${MUTED_C};`
const H1 = `margin: 8px 0 0; font-family: Georgia, serif; font-size: 28px; font-weight: 900; color: ${TEXT}; line-height: 1.15;`
const H1_SM = `margin: 8px 0 0; font-family: Georgia, serif; font-size: 24px; font-weight: 900; color: ${TEXT}; line-height: 1.2;`
const BTN_AMBER = `display: inline-block; background-color: ${AMBER_C}; color: #0c0a09; font-family: ${FONT}; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px;`
const BTN_GHOST = `display: inline-block; background-color: ${CARD_BG}; color: ${TEXT}; font-family: ${FONT}; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; border: 1px solid ${BORDER};`

// ─── Internal helpers ─────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function obsName(obs: string): string {
  return obs === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
}

function obsInfoLink(obs: string, locale: "es" | "en"): string {
  const url = obs === "LA_SILLA"
    ? `https://www.eso.org/public/chile/visiting/la-silla/?lang=${locale}`
    : `https://www.eso.org/public/chile/visiting/paranal/?lang=${locale}`
  const label = locale === "es"
    ? `Información oficial — Observatorio ${obsName(obs)}`
    : `Official info — ${obsName(obs)} Observatory`
  return `<a href="${url}" style="color: ${SKY_C}; text-decoration: none; font-size: 13px;">${label}</a>`
}

function wrapEmail(locale: "es" | "en", title: string, rows: string): string {
  const isES = locale === "es"
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="font-family: ${FONT}; background-color: ${BG}; color: ${TEXT}; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding: 40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 560px; width: 100%;">
        ${rows}
        <tr><td style="padding-top: 8px;"></td></tr>
        <tr><td style="border-top: 1px solid ${BORDER}; padding-top: 20px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: ${MUTED_C};">
            ${isES ? "¿Preguntas?" : "Questions?"}&#160;<a href="mailto:reservas@observatorioseso.cl" style="color: ${SKY_C}; text-decoration: none;">reservas@observatorioseso.cl</a>
          </p>
          <p style="margin: 6px 0 0; font-size: 11px; color: #44403c;">
            &copy; ESO Chile &#8212; La Silla &amp; Paranal (VLT)
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function spacer(h = 16): string {
  return `<tr><td height="${h}" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>`
}

function bookingCard(
  shortId: string,
  nombre: string,
  obs: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  personas: number | undefined,
  locale: "es" | "en"
): string {
  const isES = locale === "es"
  const personasCell = personas !== undefined
    ? `<td style="${MUTED_S}">
        <span style="${LABEL_S}">${isES ? "Personas" : "People"}</span>
        ${personas}
      </td>`
    : `<td></td>`

  return `
  <tr><td style="${CARD_S}">
    <p style="margin: 0 0 4px; ${EYEBROW_MUTED}">N.&deg; ${esc(shortId)}</p>
    <p style="margin: 0 0 18px; font-size: 17px; font-weight: 700; color: ${TEXT};">${esc(nombre)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="${MUTED_S} padding-right: 16px; padding-bottom: 10px;">
          <span style="${LABEL_S}">${isES ? "Observatorio" : "Observatory"}</span>
          ${obsName(obs)}
        </td>
        <td style="${MUTED_S} padding-bottom: 10px;">
          <span style="${LABEL_S}">${isES ? "Fecha" : "Date"}</span>
          ${esc(fecha)}
        </td>
      </tr>
      <tr>
        <td style="${MUTED_S}">
          <span style="${LABEL_S}">${isES ? "Turno" : "Time slot"}</span>
          ${esc(horaInicio)} &ndash; ${esc(horaFin)}
        </td>
        ${personasCell}
      </tr>
    </table>
  </td></tr>`
}

function tipsBlock(locale: "es" | "en"): string {
  const isES = locale === "es"
  const heading = isES ? "Antes de tu visita" : "Before your visit"
  const tips = isES
    ? [
        "Llega con puntualidad",
        "Trae agua y protector solar",
        "Lleva un snack",
        "Aseg&#250;rate de que tu veh&#237;culo est&#233; en buen estado para el camino",
      ]
    : [
        "Arrive on time",
        "Bring water and sunscreen",
        "Pack a snack",
        "Ensure your vehicle is roadworthy",
      ]

  const items = tips
    .map(
      (t) =>
        `<tr><td style="padding: 3px 0; ${MUTED_S}"><span style="color: ${AMBER_C}; margin-right: 8px;">&mdash;</span>${t}</td></tr>`
    )
    .join("")

  return `
  <tr><td style="background-color: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.22); border-radius: 10px; padding: 16px 20px;">
    <p style="margin: 0 0 10px; ${EYEBROW}">${heading}</p>
    <table cellpadding="0" cellspacing="0" width="100%" role="presentation">
      ${items}
    </table>
  </td></tr>`
}

function infoLinkRow(obs: string, locale: "es" | "en"): string {
  const isES = locale === "es"
  const heading = isES ? "Informaci&#243;n &#250;til" : "Useful information"
  return `
  <tr><td style="${CARD_S}">
    <p style="margin: 0 0 10px; ${EYEBROW_MUTED}">${heading}</p>
    <p style="margin: 0;">${obsInfoLink(obs, locale)}</p>
  </td></tr>`
}

// ─── 1. Confirmación pendiente ─────────────────────────────────────────────────

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
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `Reserva registrada — ${obs}` : `Booking registered — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios Chile</p>
    <h1 style="${H1}">${isES ? "&#161;Reserva registrada!" : "Booking registered!"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? "Revisa los detalles a continuaci&#243;n y confirma tu asistencia antes del plazo."
        : "Review the details below and confirm your attendance before the deadline."}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, `${esc(data.nombre)} ${esc(data.apellido)}`, data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(12)}

  <tr><td style="background-color: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.30); border-radius: 10px; padding: 14px 18px;">
    <p style="margin: 0; color: ${AMBER_C}; font-size: 13px; line-height: 1.5;">
      ${isES
        ? `Confirma tu asistencia antes de: <strong>${esc(data.fechaLimite)}</strong>`
        : `Confirm your attendance before: <strong>${esc(data.fechaLimite)}</strong>`}
    </p>
  </td></tr>
  ${spacer(20)}

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.portalUrl}" style="${BTN_AMBER}">
      ${isES ? "Ver y confirmar mi reserva" : "View and confirm my booking"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 2. Reserva confirmada (ESO Email 1) ──────────────────────────────────────

export interface EmailConfirmadaData {
  nombre: string
  apellido: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  portalUrl: string
  locale: "es" | "en"
}

export function emailConfirmadaHTML(data: EmailConfirmadaData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `Reserva confirmada — ${obs}` : `Booking confirmed — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios Chile</p>
    <h1 style="${H1}">${isES ? "&#161;Tu visita est&#225; confirmada!" : "Your visit is confirmed!"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Tu reserva para visitar el Observatorio ${obs} fue programada con &#233;xito.`
        : `Your reservation to visit ${obs} Observatory has been successfully scheduled.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, `${esc(data.nombre)} ${esc(data.apellido)}`, data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(4)}

  <tr><td style="padding: 2px 0 8px; ${MUTED_S}">
    ${isES
      ? `Te esperamos el d&#237;a <strong style="color: ${TEXT};">${esc(data.fecha)}</strong>, en el horario de <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong> horas, reservado para <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "persona" : "personas"}.`
      : `We look forward to seeing you on <strong style="color: ${TEXT};">${esc(data.fecha)}</strong>, during the <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong> slot, reserved for <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "person" : "people"}.`}
  </td></tr>
  ${spacer(8)}

  ${tipsBlock(data.locale)}
  ${spacer(12)}

  ${infoLinkRow(data.observatorio, data.locale)}
  ${spacer(12)}

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.portalUrl}" style="${BTN_AMBER}">
      ${isES ? "Ver mi comprobante" : "View my confirmation"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 3. Anulación (ESO Email 2) ───────────────────────────────────────────────

export interface EmailAnulacionData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  portalUrl: string
  locale: "es" | "en"
  motivo?: "portal" | "auto"
}

export function emailAnulacionHTML(data: EmailAnulacionData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const esAuto = data.motivo === "auto"
  const title = isES ? `Reserva anulada — ${obs}` : `Booking cancelled — ${obs}`
  const rebookUrl = data.portalUrl.replace(/\/mi-reserva\/.*/, "")

  const heading = isES
    ? esAuto ? "Reserva anulada por falta de confirmaci&#243;n" : "Reserva cancelada"
    : esAuto ? "Booking cancelled &#8212; confirmation not received" : "Booking cancelled"

  const intro = isES
    ? esAuto
      ? `Te informamos que tu reserva para visitar el Observatorio ${obs} el ${esc(data.fecha)} a las ${esc(data.horaInicio)} horas fue anulada autom&#225;ticamente, ya que no recibimos tu confirmaci&#243;n antes del plazo.`
      : `Te informamos que tu reserva para visitar el Observatorio ${obs} el ${esc(data.fecha)} a las ${esc(data.horaInicio)} horas fue anulada.`
    : esAuto
      ? `Your booking to visit ${obs} Observatory on ${esc(data.fecha)} at ${esc(data.horaInicio)} was automatically cancelled because we did not receive your confirmation before the deadline.`
      : `Your booking to visit ${obs} Observatory on ${esc(data.fecha)} at ${esc(data.horaInicio)} has been cancelled.`

  const outro = isES
    ? "Esperamos que puedas visitarnos en una pr&#243;xima oportunidad."
    : "We hope you can visit us on a future occasion."

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW_MUTED}">ESO Observatorios Chile</p>
    <h1 style="${H1_SM}">${heading}</h1>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, undefined, data.locale)}
  ${spacer(12)}

  <tr><td style="padding: 4px 0 20px; ${MUTED_S}">
    <p style="margin: 0 0 10px;">${intro}</p>
    <p style="margin: 0;">${outro}</p>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${rebookUrl}" style="${BTN_GHOST}">
      ${isES ? "Hacer una nueva reserva" : "Make a new booking"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 4. Modificación / Reagendamiento (ESO Email 3) ───────────────────────────

export interface EmailModificadaData {
  nombre: string
  shortId: string
  observatorio: string
  fechaNueva: string
  horaInicioNueva: string
  horaFinNueva: string
  cantidadPersonas: number
  portalUrl: string
  locale: "es" | "en"
}

export function emailModificadaHTML(data: EmailModificadaData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `Reserva modificada — ${obs}` : `Booking rescheduled — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios Chile</p>
    <h1 style="${H1_SM}">${isES ? "Tu reserva fue modificada" : "Your booking has been rescheduled"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Tu reserva para visitar el Observatorio ${obs} fue modificada y la nueva fecha asignada es el <strong style="color: ${TEXT};">${esc(data.fechaNueva)}</strong>, para <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "persona" : "personas"}.`
        : `Your reservation to visit ${obs} Observatory has been modified and the new assigned date is <strong style="color: ${TEXT};">${esc(data.fechaNueva)}</strong>, for <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "person" : "people"}.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fechaNueva, data.horaInicioNueva, data.horaFinNueva, data.cantidadPersonas, data.locale)}
  ${spacer(8)}

  <tr><td style="padding: 4px 0 16px; ${MUTED_S}">
    ${isES
      ? "Adjunto encontrar&#225;s el nuevo comprobante de reserva. Si tienes alguna consulta, cont&#225;ctanos."
      : "Your updated booking confirmation is attached. If you have any questions, please contact us."}
  </td></tr>

  ${tipsBlock(data.locale)}
  ${spacer(12)}

  ${infoLinkRow(data.observatorio, data.locale)}
  ${spacer(12)}

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.portalUrl}" style="${BTN_AMBER}">
      ${isES ? "Ver comprobante actualizado" : "View updated confirmation"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 5. Recordatorio 72h — confirmar reserva pendiente ────────────────────────

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
  cantidadPersonas?: number
}

export function emailRecordatorioHTML(data: EmailRecordatorioData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `Recuerda confirmar tu visita — ${obs}` : `Confirm your visit — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios &#8212; ${isES ? "Recordatorio" : "Reminder"}</p>
    <h1 style="${H1_SM}">${isES ? "&#191;Confirmas tu visita?" : "Please confirm your visit"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `${esc(data.nombre)}, tu reserva <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> al Observatorio ${obs} (${esc(data.fecha)}, ${esc(data.horaInicio)} h) a&#250;n est&#225; pendiente de confirmaci&#243;n.`
        : `${esc(data.nombre)}, your booking <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> at ${obs} Observatory (${esc(data.fecha)}, ${esc(data.horaInicio)}) is still pending confirmation.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(12)}

  <tr><td style="background-color: rgba(245,158,11,0.10); border: 1px solid rgba(245,158,11,0.30); border-radius: 10px; padding: 14px 18px;">
    <p style="margin: 0; color: ${AMBER_C}; font-size: 13px; line-height: 1.5;">
      ${isES
        ? `Plazo de confirmaci&#243;n: <strong>${esc(data.fechaLimite)}</strong>`
        : `Confirmation deadline: <strong>${esc(data.fechaLimite)}</strong>`}
    </p>
    <p style="margin: 6px 0 0; ${MUTED_S}">
      ${isES
        ? "Si no confirmas antes de esa fecha, tu reserva ser&#225; anulada autom&#225;ticamente."
        : "If you do not confirm before this date, your booking will be automatically cancelled."}
    </p>
  </td></tr>
  ${spacer(20)}

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.portalUrl}" style="${BTN_AMBER}">
      ${isES ? "Confirmar asistencia" : "Confirm attendance"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 6. Recordatorio de visita — reserva confirmada (ESO Email 5) ─────────────

export interface EmailRecordatorioVisitaData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  portalUrl: string
  locale: "es" | "en"
  ventana?: "72h" | "7d" | "1m" | "2m"
}

export function emailRecordatorioVisitaHTML(data: EmailRecordatorioVisitaData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)

  const ventanaLabel: Record<string, { es: string; en: string }> = {
    "72h": { es: "Recordatorio &#8212; Faltan 3 d&#237;as",       en: "Reminder &#8212; 3 days to go" },
    "7d":  { es: "Recordatorio &#8212; Faltan 7 d&#237;as",       en: "Reminder &#8212; 7 days to go" },
    "1m":  { es: "Recordatorio &#8212; Falta 1 mes",              en: "Reminder &#8212; 1 month to go" },
    "2m":  { es: "Recordatorio &#8212; Faltan 2 meses",           en: "Reminder &#8212; 2 months to go" },
  }
  const vKey = data.ventana ?? "7d"
  const eyebrowText = ventanaLabel[vKey]
    ? (isES ? ventanaLabel[vKey].es : ventanaLabel[vKey].en)
    : (isES ? "Recordatorio de visita" : "Visit reminder")

  const title = isES ? `Recordatorio de visita — ${obs}` : `Visit reminder — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">${eyebrowText}</p>
    <h1 style="${H1_SM}">${isES ? `Te esperamos en ${obs}` : `See you at ${obs}`}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Te recordamos que tienes una reserva para visitar el Observatorio ${obs} el d&#237;a <strong style="color: ${TEXT};">${esc(data.fecha)}</strong> en el horario de <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong> horas, para <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "persona" : "personas"}.`
        : `We remind you that you have a reservation to visit ${obs} Observatory on <strong style="color: ${TEXT};">${esc(data.fecha)}</strong> during the <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong> slot, for <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "person" : "people"}.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(12)}

  ${tipsBlock(data.locale)}
  ${spacer(12)}

  ${infoLinkRow(data.observatorio, data.locale)}
  ${spacer(16)}

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.portalUrl}" style="${BTN_GHOST}">
      ${isES ? "Modificar mi reserva" : "Modify my booking"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 7. Encuesta post-visita (ESO Email 4) ────────────────────────────────────

export interface EmailEncuestaData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  locale: "es" | "en"
}

export function emailEncuestaHTML(data: EmailEncuestaData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `&#191;C&#243;mo fue tu visita? — ${obs}` : `How was your visit? — ${obs}`
  const surveyUrl = `https://www.eso.org/public/chile/weekend-visits/rating/?lang=${data.locale}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios Chile</p>
    <h1 style="${H1}">${isES ? "&#191;C&#243;mo fue tu visita?" : "How was your visit?"}</h1>
  </td></tr>

  <tr><td style="${CARD_S}">
    <p style="margin: 0 0 4px; ${EYEBROW_MUTED}">N.&deg; ${esc(data.shortId)}</p>
    <p style="margin: 0; ${MUTED_S}">
      ${obs} &mdash; ${esc(data.fecha)}
    </p>
  </td></tr>
  ${spacer(12)}

  <tr><td style="${MUTED_S} padding-bottom: 20px;">
    <p style="margin: 0 0 10px;">
      ${isES
        ? `Esperamos que hayas disfrutado de tu experiencia en el Observatorio ${obs}. Ha sido un placer recibirte y esperamos verte de nuevo pronto.`
        : `We hope you enjoyed your experience at ${obs} Observatory. It was a pleasure hosting you and we hope to see you again soon.`}
    </p>
    <p style="margin: 0;">
      ${isES
        ? "Tu opini&#243;n nos ayuda a seguir mejorando. Haz clic a continuaci&#243;n para responder una breve encuesta."
        : "Your feedback helps us keep improving. Click below to answer a brief survey."}
    </p>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${surveyUrl}" style="${BTN_AMBER}">
      ${isES ? "Responder encuesta" : "Take the survey"}
    </a>
  </td></tr>
  ${spacer(8)}

  <tr><td style="text-align: center;">
    <p style="margin: 0; font-size: 12px; color: ${MUTED_C};">
      ${isES ? "La encuesta es an&#243;nima y toma menos de 2 minutos." : "The survey is anonymous and takes less than 2 minutes."}
    </p>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── 8. Cierre de emergencia ──────────────────────────────────────────────────

export interface EmailCierreEmergenciaData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  portalUrl: string
  locale: "es" | "en"
  motivo: string
  cancelada: boolean
}

export function emailCierreEmergenciaHTML(data: EmailCierreEmergenciaData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)

  const heading = isES
    ? data.cancelada ? "Visita cancelada por cierre de emergencia" : "Aviso importante sobre tu visita"
    : data.cancelada ? "Visit cancelled &#8212; emergency closure" : "Important notice about your visit"

  const title = isES
    ? data.cancelada ? `Visita cancelada — ${obs}` : `Aviso importante — ${obs}`
    : data.cancelada ? `Visit cancelled — ${obs}` : `Important notice — ${obs}`

  const intro = isES
    ? data.cancelada
      ? `Lamentamos informarte que tu reserva <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> al Observatorio ${obs} del d&#237;a <strong style="color: ${TEXT};">${esc(data.fecha)}</strong> ha sido cancelada debido a un cierre de emergencia.`
      : `Te informamos que el Observatorio ${obs} permanecer&#225; cerrado el d&#237;a <strong style="color: ${TEXT};">${esc(data.fecha)}</strong>. Tu reserva <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> se ver&#225; afectada.`
    : data.cancelada
      ? `We regret to inform you that your booking <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> at ${obs} Observatory on <strong style="color: ${TEXT};">${esc(data.fecha)}</strong> has been cancelled due to an emergency closure.`
      : `Please be advised that ${obs} Observatory will be closed on <strong style="color: ${TEXT};">${esc(data.fecha)}</strong>. Your booking <strong style="color: ${SUBTLE_C};">${esc(data.shortId)}</strong> will be affected.`

  const outro = isES
    ? data.cancelada
      ? "Los cupos han sido liberados. Puedes hacer una nueva reserva en cuanto haya disponibilidad."
      : "Nos comunicaremos contigo para informarte los pr&#243;ximos pasos."
    : data.cancelada
      ? "Spots have been released. You may make a new booking as soon as availability opens."
      : "We will contact you to inform you of the next steps."

  const rebookUrl = data.portalUrl.replace(/\/mi-reserva\/.*/, "")

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW_MUTED}">ESO Observatorios Chile</p>
    <h1 style="${H1_SM}">${heading}</h1>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, undefined, data.locale)}
  ${spacer(12)}

  <tr><td style="background-color: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 14px 18px;">
    <p style="margin: 0; color: #fca5a5; font-size: 13px; line-height: 1.5;">
      <strong>${isES ? "Motivo:" : "Reason:"}</strong> ${esc(data.motivo)}
    </p>
  </td></tr>
  ${spacer(12)}

  <tr><td style="${MUTED_S} padding-bottom: 20px;">
    <p style="margin: 0 0 10px;">${intro}</p>
    <p style="margin: 0;">${outro}</p>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${rebookUrl}" style="${BTN_GHOST}">
      ${isES ? "Ir al sitio de reservas" : "Go to booking site"}
    </a>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── Staff templates ──────────────────────────────────────────────────────────
//
// Staff emails use a light background for readability in desktop clients.
// Language is always Spanish (internal operational communications).

export interface EmailStaffData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  telefono: string | null
  email: string
}

function wrapStaff(subject: string, badge: string, badgeColor: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="font-family: ${FONT}; background-color: #f5f5f4; color: #1c1917; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding: 32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 520px; width: 100%;">

        <!-- Header strip -->
        <tr><td style="background-color: ${BG}; border-radius: 12px 12px 0 0; padding: 16px 24px;">
          <p style="margin: 0; ${EYEBROW}">ESO Observatorios Chile &mdash; Staff</p>
        </td></tr>

        <!-- Badge row -->
        <tr><td style="background-color: #ffffff; padding: 20px 24px 0;">
          <span style="display: inline-block; background-color: ${badgeColor}; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 6px;">
            ${badge}
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="background-color: #ffffff; padding: 16px 24px 24px;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #e7e5e4; border-radius: 0 0 12px 12px; padding: 12px 24px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #78716c;">
            Notificaci&#243;n interna &#8212; reservas@observatorioseso.cl
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function staffDetailsTable(data: EmailStaffData): string {
  const obs = obsName(data.observatorio)
  const tel = data.telefono ?? "—"
  const rows: [string, string][] = [
    ["Observatorio", obs],
    ["Fecha", esc(data.fecha)],
    ["Turno", `${esc(data.horaInicio)} &ndash; ${esc(data.horaFin)}`],
    ["N.&deg; de personas", String(data.cantidadPersonas)],
    ["Tel&#233;fono / WhatsApp", esc(tel)],
    ["Email del titular", `<a href="mailto:${esc(data.email)}" style="color: #0ea5e9;">${esc(data.email)}</a>`],
  ]

  const cellStyle = "padding: 8px 12px; border-bottom: 1px solid #e7e5e4; font-size: 13px;"
  const trs = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="${cellStyle} color: #78716c; font-weight: 600; white-space: nowrap; width: 40%;">${label}</td>
          <td style="${cellStyle} color: #1c1917;">${value}</td>
        </tr>`
    )
    .join("")

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden; margin-top: 12px;">
      ${trs}
    </table>`
}

export function emailStaffConfirmadaHTML(data: EmailStaffData): string {
  const obs = obsName(data.observatorio)
  const subject = `Visita confirmada — ${obs} · ${data.fecha}`
  const body = `
    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1c1917;">
      Hola Staff Member.
    </p>
    <p style="margin: 0 0 0; font-size: 14px; line-height: 1.6; color: #44403c;">
      Tienes una visita confirmada de <strong>${esc(data.nombre)}</strong> para el observatorio
      <strong>${obs}</strong>, para <strong>${data.cantidadPersonas}</strong>
      ${data.cantidadPersonas === 1 ? "persona" : "personas"}, con fecha
      <strong>${esc(data.fecha)}</strong> a las <strong>${esc(data.horaInicio)}</strong>.
    </p>
    <p style="margin: 6px 0 0; font-size: 13px; color: #78716c;">
      Tel&#233;fono / WhatsApp de la visita: <strong>${esc(data.telefono ?? "—")}</strong>
    </p>
    ${staffDetailsTable(data)}`

  return wrapStaff(subject, "Visita confirmada", "#16a34a", body)
}

export function emailStaffAnulacionHTML(data: EmailStaffData): string {
  const obs = obsName(data.observatorio)
  const subject = `Visita cancelada — ${obs} · ${data.fecha}`
  const body = `
    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1c1917;">
      Hola Staff Member.
    </p>
    <p style="margin: 0 0 0; font-size: 14px; line-height: 1.6; color: #44403c;">
      El cliente <strong>${esc(data.nombre)}</strong> ha <strong>CANCELADO</strong> su visita
      al observatorio <strong>${obs}</strong>, para <strong>${data.cantidadPersonas}</strong>
      ${data.cantidadPersonas === 1 ? "persona" : "personas"}, con fecha
      <strong>${esc(data.fecha)}</strong> a las <strong>${esc(data.horaInicio)}</strong>.
    </p>
    <p style="margin: 6px 0 0; font-size: 13px; color: #78716c;">
      Tel&#233;fono / WhatsApp de la visita: <strong>${esc(data.telefono ?? "—")}</strong>
    </p>
    ${staffDetailsTable(data)}`

  return wrapStaff(subject, "Visita cancelada", "#dc2626", body)
}

export interface EmailStaffModificadaData extends EmailStaffData {
  fechaAnterior: string
  horaInicioAnterior: string
}

export function emailStaffModificadaHTML(data: EmailStaffModificadaData): string {
  const obs = obsName(data.observatorio)
  const subject = `Visita reagendada — ${obs} · ${data.fecha}`
  const body = `
    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1c1917;">
      Hola Staff Member.
    </p>
    <p style="margin: 0 0 0; font-size: 14px; line-height: 1.6; color: #44403c;">
      Tienes una visita <strong>reagendada</strong> del cliente <strong>${esc(data.nombre)}</strong>
      para el observatorio <strong>${obs}</strong>, para <strong>${data.cantidadPersonas}</strong>
      ${data.cantidadPersonas === 1 ? "persona" : "personas"}, con nueva fecha
      <strong>${esc(data.fecha)}</strong> a las <strong>${esc(data.horaInicio)}</strong>.
    </p>
    <p style="margin: 6px 0 0; font-size: 13px; color: #78716c;">
      Fecha anterior: ${esc(data.fechaAnterior)} a las ${esc(data.horaInicioAnterior)}.
    </p>
    <p style="margin: 4px 0 0; font-size: 13px; color: #78716c;">
      Tel&#233;fono / WhatsApp de la visita: <strong>${esc(data.telefono ?? "—")}</strong>
    </p>
    ${staffDetailsTable(data)}`

  return wrapStaff(subject, "Visita reagendada", "#d97706", body)
}

// ─── Recordatorio 24h — dos botones (confirmar / no asistir) ─────────────────

export interface EmailRecordatorio24hData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  confirmarUrl: string
  anularUrl: string
  locale: "es" | "en"
}

export function emailRecordatorio24hHTML(data: EmailRecordatorio24hData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES ? `Tu visita es ma&#241;ana — ${obs}` : `Your visit is tomorrow — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios &#8212; ${isES ? "Recordatorio urgente" : "Urgent reminder"}</p>
    <h1 style="${H1_SM}">${isES ? "Tu visita es ma&#241;ana" : "Your visit is tomorrow"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Hola ${esc(data.nombre)}, te recordamos que tienes una reserva para ma&#241;ana en el Observatorio ${obs}, a las <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong> horas, para <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "persona" : "personas"}.`
        : `Hi ${esc(data.nombre)}, this is a reminder that you have a booking tomorrow at ${obs} Observatory at <strong style="color: ${TEXT};">${esc(data.horaInicio)}</strong>, for <strong style="color: ${TEXT};">${data.cantidadPersonas}</strong> ${data.cantidadPersonas === 1 ? "person" : "people"}.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(16)}

  <tr><td style="background-color: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.22); border-radius: 10px; padding: 18px 20px;">
    <p style="margin: 0 0 6px; ${EYEBROW}">${isES ? "&#191;Vas a asistir?" : "Will you attend?"}</p>
    <p style="${MUTED_S} margin: 0;">
      ${isES
        ? "Por favor conf&#237;rmanos ahora. Si no puedes asistir, an&#250;lala para que otros puedan reservar ese cupo."
        : "Please let us know now. If you cannot attend, cancel so others can take your spot."}
    </p>
  </td></tr>
  ${spacer(20)}

  <tr><td style="text-align: center; padding-bottom: 12px;">
    <a href="${data.confirmarUrl}"
       style="${BTN_AMBER} font-size: 14px; padding: 13px 36px;">
      ${isES ? "S&#237;, voy a asistir" : "Yes, I will attend"}
    </a>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.anularUrl}"
       style="display: inline-block; background-color: transparent; color: #ef4444; font-family: ${FONT}; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 28px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.40);">
      ${isES ? "No, no voy a asistir" : "No, I cannot attend"}
    </a>
  </td></tr>
  ${spacer(8)}

  <tr><td style="text-align: center;">
    <p style="margin: 0; font-size: 11px; color: ${MUTED_C};">
      ${isES
        ? "Al hacer clic quedar&#225; registrado autom&#225;ticamente. No necesitas tu contrase&#241;a."
        : "Clicking registers your response automatically. No password required."}
    </p>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── Recordatorio jueves — amigable, 2 botones ────────────────────────────────

export interface EmailRecordatorioJuevesData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  fechaLimite: string     // e.g. "el viernes 23 de mayo a las 12:00"
  confirmarUrl: string
  anularUrl: string
  portalUrl: string
  locale: "es" | "en"
}

export function emailRecordatorioJuevesHTML(data: EmailRecordatorioJuevesData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES
    ? `Confirma tu visita a ${obs} antes del viernes`
    : `Confirm your visit to ${obs} before Friday`

  const rows = `
  <tr><td style="padding-bottom: 28px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios &#8212; ${isES ? "Recordatorio" : "Reminder"}</p>
    <h1 style="${H1_SM}">${isES ? "&#161;Confirma ma&#241;ana antes de las 12:00!" : "Confirm tomorrow before 12:00 PM!"}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Hola ${esc(data.nombre)}, te recordamos que ma&#241;ana viernes a las 12:00 vence el plazo para confirmar tu visita al Observatorio ${obs}.`
        : `Hi ${esc(data.nombre)}, just a heads-up that tomorrow (Friday) at 12:00 PM is the deadline to confirm your visit to ${obs} Observatory.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(20)}

  <tr><td style="background-color: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.22); border-radius: 10px; padding: 18px 20px;">
    <p style="margin: 0 0 4px; ${EYEBROW}">${isES ? "&#191;Vas a asistir?" : "Will you attend?"}</p>
    <p style="${MUTED_S} margin: 0;">
      ${isES
        ? `Conf&#237;rmanos antes de ${esc(data.fechaLimite)}. Si no puedes asistir, an&#250;lala para liberar tu cupo.`
        : `Confirm by ${esc(data.fechaLimite)}. If you can&#39;t make it, cancel so others can book that spot.`}
    </p>
  </td></tr>
  ${spacer(24)}

  <tr><td style="text-align: center; padding-bottom: 12px;">
    <a href="${data.confirmarUrl}" style="${BTN_AMBER} font-size: 14px; padding: 13px 36px;">
      ${isES ? "&#10003;&#160;&#160;S&#237;, voy a asistir" : "&#10003;&#160;&#160;Yes, I will attend"}
    </a>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.anularUrl}"
       style="display: inline-block; background-color: transparent; color: #ef4444; font-family: ${FONT}; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 28px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.40);">
      ${isES ? "No, no voy a asistir" : "No, I cannot attend"}
    </a>
  </td></tr>
  ${spacer(12)}

  <tr><td style="text-align: center;">
    <a href="${data.portalUrl}" style="color: ${SKY_C}; font-size: 12px; text-decoration: none;">
      ${isES ? "Gestiona tu reserva en el portal" : "Manage your booking on the portal"}
    </a>
  </td></tr>
  ${spacer(16)}

  ${tipsBlock(data.locale)}
  ${spacer(8)}

  <tr><td>
    ${infoLinkRow(data.observatorio, data.locale)}
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── Recordatorio viernes — urgente, mini-card, link extender ────────────────

export interface EmailRecordatorioViernesData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  horaLimite: string    // e.g. "12:00" or "12:00 PM"
  confirmarUrl: string
  anularUrl: string
  extenderUrl: string
  locale: "es" | "en"
}

export function emailRecordatorioViernesHTML(data: EmailRecordatorioViernesData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES
    ? `Tienes hasta las ${data.horaLimite} para confirmar — ${obs}`
    : `You have until ${data.horaLimite} to confirm — ${obs}`

  const rows = `
  <tr><td style="padding-bottom: 20px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios &#8212; ${isES ? "&#9888;&#65039; &#218;ltimo aviso" : "&#9888;&#65039; Last notice"}</p>
    <h1 style="${H1_SM}">${isES
      ? `Tienes hasta las <strong style="color: ${AMBER_C};">${esc(data.horaLimite)}</strong> para confirmar`
      : `Confirm before <strong style="color: ${AMBER_C};">${esc(data.horaLimite)}</strong> today`}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Hola ${esc(data.nombre)}, a las ${esc(data.horaLimite)} vence el plazo para confirmar o anular tu reserva en el Observatorio ${obs}.`
        : `Hi ${esc(data.nombre)}, at ${esc(data.horaLimite)} the deadline to confirm or cancel your visit to ${obs} Observatory expires.`}
    </p>
  </td></tr>

  <tr><td style="${CARD_S} padding: 16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding-right: 12px; vertical-align: top;">
          <span style="${LABEL_S}">${isES ? "Reserva" : "Booking"}</span>
          <span style="color: ${AMBER_C}; font-weight: 700; font-size: 13px;">${esc(data.shortId)}</span>
        </td>
        <td style="vertical-align: top;">
          <span style="${LABEL_S}">${isES ? "Observatorio" : "Observatory"}</span>
          <span style="color: ${TEXT}; font-size: 13px; font-weight: 600;">${obs}</span>
        </td>
      </tr>
      <tr><td colspan="2" style="padding-top: 10px;">
        <span style="${LABEL_S}">${isES ? "Visita" : "Visit"}</span>
        <span style="color: ${TEXT}; font-size: 13px;">${esc(data.fecha)} &#8212; ${esc(data.horaInicio)} a ${esc(data.horaFin)}, ${data.cantidadPersonas} ${isES ? (data.cantidadPersonas === 1 ? "persona" : "personas") : (data.cantidadPersonas === 1 ? "person" : "people")}</span>
      </td></tr>
    </table>
  </td></tr>
  ${spacer(20)}

  <tr><td style="text-align: center; padding-bottom: 12px;">
    <a href="${data.confirmarUrl}" style="${BTN_AMBER} font-size: 15px; padding: 14px 44px;">
      ${isES ? "Confirmar asistencia" : "Confirm attendance"}
    </a>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 16px;">
    <a href="${data.anularUrl}"
       style="display: inline-block; background-color: transparent; color: #ef4444; font-family: ${FONT}; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 28px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.40);">
      ${isES ? "Anular reserva" : "Cancel booking"}
    </a>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <p style="margin: 0; font-size: 12px; color: ${MUTED_C};">
      ${isES
        ? `&#191;Todav&#237;a no decides? <a href="${data.extenderUrl}" style="color: ${SKY_C}; text-decoration: none;">Necesito m&#225;s tiempo (+2 horas)</a>`
        : `Not sure yet? <a href="${data.extenderUrl}" style="color: ${SKY_C}; text-decoration: none;">I need more time (+2 hours)</a>`}
    </p>
  </td></tr>
  ${spacer(8)}

  <tr><td style="text-align: center;">
    <p style="margin: 0; font-size: 11px; color: ${MUTED_C};">
      ${isES
        ? "Al hacer clic quedar&#225; registrado autom&#225;ticamente. No necesitas tu contrase&#241;a."
        : "Clicking registers your response automatically. No password required."}
    </p>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}

// ─── Email de extensión — nueva hora límite ───────────────────────────────────

export interface EmailExtensionData {
  nombre: string
  shortId: string
  observatorio: string
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadPersonas: number
  nuevaHoraLimite: string   // e.g. "14:00" or "2:00 PM"
  confirmarUrl: string
  anularUrl: string
  locale: "es" | "en"
}

export function emailExtensionHTML(data: EmailExtensionData): string {
  const isES = data.locale === "es"
  const obs = obsName(data.observatorio)
  const title = isES
    ? `Tu reserva en ${obs} — ahora tienes hasta las ${data.nuevaHoraLimite}`
    : `Your ${obs} booking — extended to ${data.nuevaHoraLimite}`

  const rows = `
  <tr><td style="padding-bottom: 24px;">
    <p style="margin: 0; ${EYEBROW}">ESO Observatorios &#8212; Extensi&#243;n concedida</p>
    <h1 style="${H1_SM}">${isES
      ? `Plazo extendido hasta las <strong style="color: ${AMBER_C};">${esc(data.nuevaHoraLimite)}</strong>`
      : `Deadline extended to <strong style="color: ${AMBER_C};">${esc(data.nuevaHoraLimite)}</strong>`}</h1>
    <p style="margin: 10px 0 0; ${MUTED_S}">
      ${isES
        ? `Hola ${esc(data.nombre)}, hemos extendido el plazo de tu reserva. Ahora tienes hasta las ${esc(data.nuevaHoraLimite)} para confirmar o anular.`
        : `Hi ${esc(data.nombre)}, we have extended your booking deadline. You now have until ${esc(data.nuevaHoraLimite)} to confirm or cancel.`}
    </p>
  </td></tr>

  ${bookingCard(data.shortId, esc(data.nombre), data.observatorio, data.fecha, data.horaInicio, data.horaFin, data.cantidadPersonas, data.locale)}
  ${spacer(16)}

  <tr><td style="background-color: rgba(125,211,252,0.06); border: 1px solid rgba(125,211,252,0.20); border-radius: 10px; padding: 14px 20px;">
    <p style="margin: 0; font-size: 13px; color: ${SKY_C}; font-weight: 600;">
      ${isES
        ? `Esta es la &#250;nica extensi&#243;n disponible. El plazo definitivo es a las ${esc(data.nuevaHoraLimite)} de hoy.`
        : `This is a one-time extension. The final deadline is today at ${esc(data.nuevaHoraLimite)}.`}
    </p>
  </td></tr>
  ${spacer(24)}

  <tr><td style="text-align: center; padding-bottom: 12px;">
    <a href="${data.confirmarUrl}" style="${BTN_AMBER} font-size: 14px; padding: 13px 36px;">
      ${isES ? "Confirmar asistencia" : "Confirm attendance"}
    </a>
  </td></tr>

  <tr><td style="text-align: center; padding-bottom: 8px;">
    <a href="${data.anularUrl}"
       style="display: inline-block; background-color: transparent; color: #ef4444; font-family: ${FONT}; font-weight: 600; font-size: 13px; text-decoration: none; padding: 10px 28px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.40);">
      ${isES ? "Anular reserva" : "Cancel booking"}
    </a>
  </td></tr>
  ${spacer(8)}

  <tr><td style="text-align: center;">
    <p style="margin: 0; font-size: 11px; color: ${MUTED_C};">
      ${isES
        ? "Al hacer clic quedar&#225; registrado autom&#225;ticamente. No necesitas tu contrase&#241;a."
        : "Clicking registers your response automatically. No password required."}
    </p>
  </td></tr>`

  return wrapEmail(data.locale, title, rows)
}
