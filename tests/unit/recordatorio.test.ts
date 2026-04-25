import { describe, it, expect } from "vitest"

// ---------------------------------------------------------------------------
// Funciones puras extraídas de la lógica del agente de recordatorios.
// No tocan BD — son deterministas y testables en aislamiento.
// ---------------------------------------------------------------------------

/**
 * Retorna true si la fecha del turno cae dentro de los próximos N días
 * contados desde ahora (inclusive hoy, exclusive fechas pasadas).
 */
function estaEnProximosDias(fechaTurno: Date, dias: number): boolean {
  const ahora = new Date()
  const limite = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000)
  return fechaTurno >= ahora && fechaTurno <= limite
}

/**
 * Retorna true si la fechaLimiteConfirmacion ya pasó (reserva vencida).
 */
function estaVencida(fechaLimiteConfirmacion: Date): boolean {
  return new Date() > fechaLimiteConfirmacion
}

// ---------------------------------------------------------------------------
// Tests — estaVencida
// ---------------------------------------------------------------------------

describe("estaVencida", () => {
  it("retorna true para fecha en el pasado", () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(estaVencida(ayer)).toBe(true)
  })

  it("retorna false para fecha en el futuro", () => {
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(estaVencida(manana)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tests — estaEnProximosDias
// ---------------------------------------------------------------------------

describe("estaEnProximosDias", () => {
  it("retorna true para visita mañana", () => {
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(estaEnProximosDias(manana, 3)).toBe(true)
  })

  it("retorna false para visita en 10 días (umbral 3)", () => {
    const en10dias = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    expect(estaEnProximosDias(en10dias, 3)).toBe(false)
  })

  it("retorna false para visita en el pasado", () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(estaEnProximosDias(ayer, 3)).toBe(false)
  })

  it("retorna true para visita hoy", () => {
    // Añadir 1 minuto para que sea >= ahora pero dentro de los próximos 3 días
    const ahoraPlus = new Date(Date.now() + 60 * 1000)
    expect(estaEnProximosDias(ahoraPlus, 3)).toBe(true)
  })
})
