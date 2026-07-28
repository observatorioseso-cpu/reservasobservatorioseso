/**
 * Fechas de turno — lib/fechas.ts
 *
 * `Turno.fecha` es `DateTime @db.Date`: un día del calendario, sin hora. Prisma
 * lo entrega como medianoche UTC, y las APIs lo serializan como
 * "2026-08-22T00:00:00.000Z".
 *
 * Formatear ese valor con la zona de Chile devuelve el día anterior, porque
 * medianoche UTC son las 20:00 del día previo en Santiago. Un sábado aparece
 * como viernes, y en un sistema de reservas eso manda gente al observatorio el
 * día equivocado.
 *
 * La regla, y vale para cualquier pantalla nueva:
 *
 * - Día del calendario (Turno.fecha, BloqueoCalendario.fechaInicio): se formatea
 *   siempre en UTC. Usa `formatearFechaTurno`.
 * - Instante real (createdAt, fechaLimiteConfirmacion, confirmadaEn): se formatea
 *   en la zona local, porque ahí sí importa la hora que vivió el usuario.
 *
 * Antes de este módulo cada pantalla resolvía el problema por su cuenta. Siete
 * lo hacían bien con el truco del mediodía, y tres del panel de administración
 * mostraban los sábados como viernes.
 */

const FORMATO_CORTO: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}

/**
 * Normaliza a medianoche UTC. Acepta el Date que devuelve Prisma, la cadena ISO
 * completa que viaja por JSON, o un "2026-08-22" pelado.
 */
export function aDiaUTC(fecha: Date | string): Date {
  if (fecha instanceof Date) return fecha
  return new Date(`${fecha.slice(0, 10)}T00:00:00.000Z`)
}

/**
 * Formatea un día del calendario sin que la zona horaria lo corra.
 *
 * `timeZone: "UTC"` se aplica al final a propósito: pisa cualquier zona que
 * llegue dentro de `opciones`, para que ningún llamador pueda reintroducir el
 * desfase sin darse cuenta.
 */
export function formatearFechaTurno(
  fecha: Date | string,
  locale: string = "es-CL",
  opciones: Intl.DateTimeFormatOptions = FORMATO_CORTO
): string {
  return aDiaUTC(fecha).toLocaleDateString(locale, {
    ...opciones,
    timeZone: "UTC",
  })
}
