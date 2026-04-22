import { describe, it, expect, vi, afterEach } from "vitest"
import {
  calcularFechaLimiteConfirmacion,
  formatearFechaLimite,
  estaDentroDeVentanaModificacion,
} from "@/lib/confirmacion"

describe("calcularFechaLimiteConfirmacion", () => {
  it("visita sábado → límite viernes previo a las 12:00 Santiago", () => {
    // Sábado 19 de julio 2025 → límite: viernes 18 de julio 12:00 Santiago
    // Santiago en julio usa UTC-4 (invierno DST) → 12:00 Santiago = 16:00 UTC
    const visita = new Date("2025-07-19T12:00:00.000Z")
    const limite = calcularFechaLimiteConfirmacion(visita)

    expect(limite.toISOString()).toMatch(/^2025-07-18/)
    // 12:00 Santiago (UTC-4 en invierno) = 16:00 UTC
    expect(limite.getUTCHours()).toBe(16)
  })

  it("visita domingo → límite es el viernes anterior", () => {
    // Domingo 20 julio 2025 → viernes 18 julio
    const visita = new Date("2025-07-20T12:00:00.000Z")
    const limite = calcularFechaLimiteConfirmacion(visita)
    expect(limite.toISOString()).toMatch(/^2025-07-18/)
  })
})

describe("formatearFechaLimite", () => {
  it("retorna texto en español", () => {
    const fecha = new Date("2025-07-18T16:00:00.000Z")
    const texto = formatearFechaLimite(fecha, "es")
    expect(texto).toContain("viernes")
    expect(texto).toContain("12:00")
  })

  it("retorna texto en inglés", () => {
    const fecha = new Date("2025-07-18T16:00:00.000Z")
    const texto = formatearFechaLimite(fecha, "en")
    expect(texto).toContain("Friday")
    expect(texto).toContain("12:00")
  })
})

describe("estaDentroDeVentanaModificacion", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // Límite de confirmación: viernes 2025-07-18 a las 16:00 UTC (12:00 Santiago invierno)
  const limiteConfirmacion = new Date("2025-07-18T16:00:00.000Z")

  it("dentro de la ventana: 1 hora antes del límite", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T15:00:00.000Z"))
    expect(estaDentroDeVentanaModificacion(limiteConfirmacion)).toBe(true)
  })

  it("fuera de la ventana: 1 minuto después del límite", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-18T16:01:00.000Z"))
    expect(estaDentroDeVentanaModificacion(limiteConfirmacion)).toBe(false)
  })

  it("fuera de la ventana: el sábado de la visita", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-07-19T10:00:00.000Z"))
    expect(estaDentroDeVentanaModificacion(limiteConfirmacion)).toBe(false)
  })
})
