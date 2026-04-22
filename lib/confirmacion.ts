import { previousFriday, setHours, setMinutes, setSeconds, isFriday, format } from "date-fns"
import { es } from "date-fns/locale"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

const TIMEZONE = "America/Santiago"

export function calcularFechaLimiteConfirmacion(fechaVisita: Date): Date {
  const enSantiago = toZonedTime(fechaVisita, TIMEZONE)
  const viernes = isFriday(enSantiago) ? enSantiago : previousFriday(enSantiago)
  const limite = setSeconds(setMinutes(setHours(viernes, 12), 0), 0)
  return fromZonedTime(limite, TIMEZONE)
}

export function formatearFechaLimite(fechaLimite: Date, locale: "es" | "en"): string {
  const enSantiago = toZonedTime(fechaLimite, TIMEZONE)
  if (locale === "en") {
    return `Friday ${format(enSantiago, "MMMM d")} at 12:00 PM (Santiago time)`
  }
  return `el viernes ${format(enSantiago, "d 'de' MMMM", { locale: es })} a las 12:00`
}

/**
 * Verifica si una reserva está dentro de la ventana de modificación.
 *
 * La ventana de confirmación y la ventana de modificación son idénticas:
 * ambas se cierran el viernes previo a la visita a las 12:00 Santiago.
 * Un solo plazo para confirmar, modificar o cancelar.
 * Después de ese plazo: solo el admin puede hacer cambios.
 */
export function estaDentroDeVentanaModificacion(fechaLimiteConfirmacion: Date): boolean {
  return new Date() < fechaLimiteConfirmacion
}
