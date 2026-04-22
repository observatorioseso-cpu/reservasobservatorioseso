import { describe, it, expect, vi, afterEach } from "vitest"
import {
  esInviernoLaSilla,
  getTurnosDisponibles,
  getEdadMinima,
  estaAbiertaLaReserva,
} from "@/lib/horarios"

describe("esInviernoLaSilla", () => {
  it("abril es invierno", () => {
    expect(esInviernoLaSilla(new Date("2025-04-15"))).toBe(true)
  })

  it("agosto es invierno", () => {
    expect(esInviernoLaSilla(new Date("2025-08-01"))).toBe(true)
  })

  it("septiembre NO es invierno", () => {
    expect(esInviernoLaSilla(new Date("2025-09-01"))).toBe(false)
  })

  it("marzo NO es invierno", () => {
    expect(esInviernoLaSilla(new Date("2025-03-15"))).toBe(false)
  })
})

describe("getTurnosDisponibles", () => {
  it("Paranal siempre tiene 2 turnos", () => {
    const verano = getTurnosDisponibles("PARANAL", new Date("2025-01-10"))
    const invierno = getTurnosDisponibles("PARANAL", new Date("2025-06-07"))
    expect(verano).toHaveLength(2)
    expect(invierno).toHaveLength(2)
  })

  it("La Silla invierno tiene 1 turno (mañana)", () => {
    const turnos = getTurnosDisponibles("LA_SILLA", new Date("2025-07-05"))
    expect(turnos).toHaveLength(1)
    expect(turnos[0].horaInicio).toBe("09:30")
  })

  it("La Silla verano tiene 2 turnos", () => {
    const turnos = getTurnosDisponibles("LA_SILLA", new Date("2025-10-18"))
    expect(turnos).toHaveLength(2)
  })
})

describe("getEdadMinima", () => {
  it("Paranal siempre requiere mínimo 4 años", () => {
    expect(getEdadMinima("PARANAL", new Date("2025-01-10"))).toBe(4)
    expect(getEdadMinima("PARANAL", new Date("2025-06-07"))).toBe(4)
  })

  it("La Silla invierno requiere mínimo 8 años", () => {
    expect(getEdadMinima("LA_SILLA", new Date("2025-05-17"))).toBe(8)
  })

  it("La Silla verano sin restricción de edad", () => {
    expect(getEdadMinima("LA_SILLA", new Date("2025-11-22"))).toBeNull()
  })
})

// ─── estaAbiertaLaReserva ──────────────────────────────────────────────────

describe("estaAbiertaLaReserva", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // Visita: sábado 2025-07-19, horaCierre=16 → cierre: viernes 2025-07-18 a las 16:00 Santiago
  // Santiago en julio (invierno) = UTC-4 → 16:00 Santiago = 20:00 UTC
  const visitaSabado = new Date("2025-07-19T00:00:00.000Z")

  it("abierta el jueves previo a la visita", () => {
    // Jueves 2025-07-17 al mediodía Santiago
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-17T16:00:00.000Z")) // 12:00 Santiago
    expect(estaAbiertaLaReserva(visitaSabado, 16)).toBe(true)
  })

  it("abierta el viernes previo ANTES de las 16:00 Santiago", () => {
    // Viernes 2025-07-18 a las 15:00 Santiago = 19:00 UTC
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T19:00:00.000Z"))
    expect(estaAbiertaLaReserva(visitaSabado, 16)).toBe(true)
  })

  it("cerrada el viernes previo DESPUÉS de las 16:00 Santiago", () => {
    // Viernes 2025-07-18 a las 17:00 Santiago = 21:00 UTC
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T21:00:00.000Z"))
    expect(estaAbiertaLaReserva(visitaSabado, 16)).toBe(false)
  })

  it("cerrada el mismo día de la visita (sábado)", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-19T10:00:00.000Z"))
    expect(estaAbiertaLaReserva(visitaSabado, 16)).toBe(false)
  })

  it("con horaCierre=18: abierta a las 17:00 Santiago del viernes", () => {
    // 17:00 Santiago invierno = 21:00 UTC
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T21:00:00.000Z"))
    expect(estaAbiertaLaReserva(visitaSabado, 18)).toBe(true)
  })

  it("con horaCierre=18: cerrada a las 18:00 Santiago del viernes", () => {
    // 18:00 Santiago invierno = 22:00 UTC
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T22:00:00.000Z"))
    expect(estaAbiertaLaReserva(visitaSabado, 18)).toBe(false)
  })
})
