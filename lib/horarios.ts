import { fromZonedTime } from "date-fns-tz"

export type TurnoHorario = { horaInicio: string; horaFin: string; label: string }

const TIMEZONE = "America/Santiago"

/** Invierno La Silla: abril–agosto (meses 4–8 inclusive).
 *  Usa getUTCMonth para evitar desfase cuando la fecha viene como UTC midnight desde la BD.
 */
export function esInviernoLaSilla(fecha: Date): boolean {
  const mes = fecha.getUTCMonth() + 1
  return mes >= 4 && mes <= 8
}

export function getTurnosDisponibles(
  observatorio: "LA_SILLA" | "PARANAL",
  fecha: Date
): TurnoHorario[] {
  if (observatorio === "PARANAL") {
    return [
      { horaInicio: "09:30", horaFin: "13:00", label: "Mañana" },
      { horaInicio: "13:30", horaFin: "17:00", label: "Tarde" },
    ]
  }

  if (esInviernoLaSilla(fecha)) {
    return [{ horaInicio: "09:30", horaFin: "13:00", label: "Mañana" }]
  }

  return [
    { horaInicio: "09:30", horaFin: "13:00", label: "Mañana" },
    { horaInicio: "13:30", horaFin: "17:00", label: "Tarde" },
  ]
}

export function getEdadMinima(
  observatorio: "LA_SILLA" | "PARANAL",
  fecha: Date
): number | null {
  if (observatorio === "PARANAL") return 4
  if (observatorio === "LA_SILLA" && esInviernoLaSilla(fecha)) return 8
  return null
}

/**
 * Verifica si las reservas para una fechaVisita siguen abiertas.
 *
 * El cierre ocurre el día anterior a la visita a las horaCierre:00 Santiago.
 * - La Silla (sábados): cierre el viernes a las horaCierre
 * - Paranal (días programados): cierre el día anterior a las horaCierre
 *
 * Nota: el admin puede modificar horaCierre desde ConfigSistema (default: 16).
 * Después de la hora de cierre, solo el admin puede crear o mover reservas.
 */
export function estaAbiertaLaReserva(
  fechaVisita: Date,
  horaCierre: number = 16
): boolean {
  // fechaVisita siempre es UTC midnight desde la BD (ej. "2025-07-05T00:00:00.000Z")
  // Obtenemos la fecha ISO del día anterior usando aritmética UTC pura
  const prevDayUTC = new Date(fechaVisita.getTime() - 24 * 60 * 60 * 1000)
  const prevISO = prevDayUTC.toISOString().split("T")[0] // "2025-07-04"

  // Construir el timestamp de cierre como string de hora local en Santiago
  // (fromZonedTime interpreta el string como hora en la zona indicada)
  const horaCierreStr = String(horaCierre).padStart(2, "0")
  const cutoffSantiagoStr = `${prevISO}T${horaCierreStr}:00:00`

  // Convertir a UTC para comparar con new Date()
  const cutoffUTC = fromZonedTime(cutoffSantiagoStr, TIMEZONE)

  return new Date() < cutoffUTC
}
