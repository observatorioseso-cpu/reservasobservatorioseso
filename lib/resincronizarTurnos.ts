/**
 * Re-sincronización de turnos regulares — lib/resincronizarTurnos.ts
 *
 * Reabre los turnos REGULAR futuros que DEBERÍAN estar disponibles según las
 * mismas reglas del generador (lib/generadorTurnos.ts), corrigiendo bloqueos
 * masivos previos (p.ej. el cierre temporal por un evento especial).
 *
 * Diseño SOLO-ACTIVACIÓN (seguro de re-ejecutar):
 * - Solo ACTIVA turnos inactivos que deberían estar activos.
 * - NUNCA desactiva turnos (no cierra nada que un admin haya abierto a mano).
 * - No toca turnos NOCTURNA ni turnos pasados.
 *
 * Regla de "debería estar activo" (idéntica al generador):
 *   activo = !esTardeVeranoLaSilla && !esBloqueado(obs, fecha)
 *   - La Silla verano (sep–mar), turno tarde 13:30 → permanece inactivo
 *   - Fecha dentro de un BloqueoCalendario → permanece inactivo
 */

import { prisma } from "@/lib/prisma"
import { esInviernoLaSilla } from "@/lib/horarios"

export interface ResyncResult {
  revisados: number   // turnos REGULAR futuros inactivos evaluados
  activados: number   // turnos efectivamente reabiertos
  omitidos: number    // inactivos que deben seguir cerrados (tarde verano La Silla / bloqueados)
}

export async function resincronizarTurnosRegulares(): Promise<ResyncResult> {
  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)
  const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)

  // Bloqueos activos vigentes
  const bloqueos = await prisma.bloqueoCalendario.findMany({
    where: { fechaFin: { gte: manana } },
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

  // Solo turnos REGULAR, futuros, actualmente inactivos
  const inactivos = await prisma.turno.findMany({
    where: { tipo: "REGULAR", activo: false, fecha: { gte: manana } },
    select: { id: true, observatorio: true, fecha: true, horaInicio: true },
  })

  const aActivar: string[] = []
  let omitidos = 0

  for (const t of inactivos) {
    const esTardeVeranoLaSilla =
      t.observatorio === "LA_SILLA" &&
      !esInviernoLaSilla(t.fecha) &&
      t.horaInicio === "13:30"

    const deberiaEstarActivo = !esTardeVeranoLaSilla && !esBloqueado(t.observatorio, t.fecha)

    if (deberiaEstarActivo) aActivar.push(t.id)
    else omitidos++
  }

  if (aActivar.length > 0) {
    await prisma.turno.updateMany({
      where: { id: { in: aActivar } },
      data: { activo: true },
    })
  }

  return { revisados: inactivos.length, activados: aActivar.length, omitidos }
}
