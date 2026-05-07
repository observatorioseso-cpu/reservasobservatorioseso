/**
 * Generador automático de turnos — lib/generadorTurnos.ts
 *
 * Lee la ventana de reserva desde ConfigSistema (VENTANA_RESERVA_DIAS, default 90).
 * Itera todos los sábados en el rango [mañana, hoy+ventana] y crea los turnos
 * que no existan todavía, sin tocar los que el admin ya haya ajustado.
 *
 * Idempotente: createMany({ skipDuplicates: true }) → INSERT ON CONFLICT DO NOTHING.
 * Retorna exactamente cuántos turnos se insertaron en esta ejecución.
 *
 * Reglas de activación inicial:
 * - La Silla invierno (abr–ago): 1 turno mañana, activo = true
 * - La Silla verano (sep–mar): 1 turno mañana activo=true + 1 turno tarde activo=false
 *   (el admin habilita el turno de tarde desde el panel)
 * - Paranal todo el año: 2 turnos, ambos activo = true
 */

import { prisma } from "@/lib/prisma"
import { getTurnosDisponibles, esInviernoLaSilla } from "@/lib/horarios"
import type { Prisma } from "@prisma/client"

const CAPACIDAD: Record<"LA_SILLA" | "PARANAL", number> = {
  LA_SILLA: 40,
  PARANAL: 60,
}

const OBSERVATORIOS = ["LA_SILLA", "PARANAL"] as const

export interface GeneracionResult {
  creados: number
  laSilla: number
  paranal: number
}

/**
 * Genera todos los turnos de sábados faltantes dentro de la ventana de reserva.
 *
 * @returns Conteo de turnos efectivamente insertados (no los que ya existían).
 */
export async function generarTurnosFaltantes(): Promise<GeneracionResult> {
  // --- 1. Leer ventana desde ConfigSistema ------------------------------------
  const config = await prisma.configSistema.findUnique({
    where: { clave: "VENTANA_RESERVA_DIAS" },
    select: { valor: true },
  })

  const rawVentana = config ? parseInt(config.valor, 10) : 90
  const ventana =
    Number.isFinite(rawVentana) && rawVentana > 0 ? Math.min(rawVentana, 360) : 0

  if (ventana === 0) {
    console.info("[generadorTurnos] ventana=0 — generación desactivada")
    return { creados: 0, laSilla: 0, paranal: 0 }
  }

  // --- 2. Calcular rango de fechas (UTC midnight) ----------------------------
  const hoyUTC = new Date()
  hoyUTC.setUTCHours(0, 0, 0, 0)

  const mananaUTC = new Date(hoyUTC.getTime() + 24 * 60 * 60 * 1000)
  const limiteUTC = new Date(hoyUTC.getTime() + ventana * 24 * 60 * 60 * 1000)

  // --- 3. Avanzar hasta el primer sábado del rango --------------------------
  const primerSabado = new Date(mananaUTC)
  while (primerSabado.getUTCDay() !== 6) {
    primerSabado.setUTCDate(primerSabado.getUTCDate() + 1)
  }

  if (primerSabado > limiteUTC) {
    return { creados: 0, laSilla: 0, paranal: 0 }
  }

  // --- 4. Fetch active bloqueos to avoid activating turnos in blocked periods
  const bloqueos = await prisma.bloqueoCalendario.findMany({
    where: { fechaFin: { gte: mananaUTC } },
    select: { observatorio: true, fechaInicio: true, fechaFin: true },
  })

  function esBloqueado(obs: string, fecha: Date): boolean {
    return bloqueos.some(
      (b) =>
        (b.observatorio === null || b.observatorio === obs) &&
        fecha >= b.fechaInicio &&
        fecha <= b.fechaFin
    )
  }

  // --- 5. Construir lotes por observatorio ----------------------------------
  type TurnoData = Prisma.TurnoCreateManyInput

  const loteLaSilla: TurnoData[] = []
  const loteParanal: TurnoData[] = []

  for (
    let sabado = new Date(primerSabado);
    sabado <= limiteUTC;
    sabado = new Date(sabado.getTime() + 7 * 24 * 60 * 60 * 1000)
  ) {
    // Fecha como UTC midnight puro para evitar desfases de zona horaria
    const fechaTurno = new Date(
      Date.UTC(sabado.getUTCFullYear(), sabado.getUTCMonth(), sabado.getUTCDate())
    )

    for (const obs of OBSERVATORIOS) {
      const horarios = getTurnosDisponibles(obs, fechaTurno)

      for (const horario of horarios) {
        // La Silla verano: el turno de tarde nace inactivo (admin lo activa)
        const esTardeVeranoLaSilla =
          obs === "LA_SILLA" &&
          !esInviernoLaSilla(fechaTurno) &&
          horario.horaInicio === "13:30"

        const entrada: TurnoData = {
          observatorio: obs,
          fecha: fechaTurno,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          capacidadMax: CAPACIDAD[obs],
          cuposOcupados: 0,
          activo: !esTardeVeranoLaSilla && !esBloqueado(obs, fechaTurno),
        }

        if (obs === "LA_SILLA") {
          loteLaSilla.push(entrada)
        } else {
          loteParanal.push(entrada)
        }
      }
    }
  }

  // --- 6. Insertar en batch (idempotente) -----------------------------------
  const [resLS, resP] = await Promise.all([
    loteLaSilla.length > 0
      ? prisma.turno.createMany({ data: loteLaSilla, skipDuplicates: true })
      : Promise.resolve({ count: 0 }),
    loteParanal.length > 0
      ? prisma.turno.createMany({ data: loteParanal, skipDuplicates: true })
      : Promise.resolve({ count: 0 }),
  ])

  const creados = resLS.count + resP.count

  if (creados > 0) {
    console.info(
      `[generadorTurnos] ${creados} turno(s) creado(s) — La Silla: ${resLS.count}, Paranal: ${resP.count}`
    )
  }

  return { creados, laSilla: resLS.count, paranal: resP.count }
}
