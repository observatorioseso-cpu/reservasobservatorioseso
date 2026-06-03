/**
 * Envía (fire-and-forget) un email de "reserva modificada" al titular.
 * Usado por las acciones de admin: reagendar y gestión de participantes.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export interface ReservaParaNotificar {
  nombre: string
  shortId: string
  observatorio: string
  email: string
  locale: string
  turno: { fecha: Date; horaInicio: string; horaFin: string }
}

export function enviarNotificacionCambio(
  reserva: ReservaParaNotificar,
  cantidadPersonas: number,
  token: string
): void {
  const locale = (reserva.locale === "en" ? "en" : "es") as "es" | "en"
  const fechaNueva = new Date(toISODate(reserva.turno.fecha) + "T12:00:00").toLocaleDateString(
    locale === "es" ? "es-CL" : "en-US",
    { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
  )

  import("@/components/email/templates")
    .then(({ emailModificadaHTML }) =>
      import("@/lib/email").then(({ resend, EMAIL_FROM }) => {
        const html = emailModificadaHTML({
          nombre: reserva.nombre,
          shortId: reserva.shortId,
          observatorio: reserva.observatorio,
          fechaNueva,
          horaInicioNueva: reserva.turno.horaInicio,
          horaFinNueva: reserva.turno.horaFin,
          cantidadPersonas,
          portalUrl: `${BASE_URL}/${locale}/mi-reserva/${token}`,
          locale,
        })
        const subject = locale === "es"
          ? `Tu reserva ESO fue actualizada — ${reserva.shortId}`
          : `Your ESO booking was updated — ${reserva.shortId}`
        return resend.emails.send({ from: EMAIL_FROM, to: reserva.email, subject, html })
      })
    )
    .catch(() => {})
}
