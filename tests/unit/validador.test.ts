import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// vi.hoisted garantiza que mockCreate esté disponible cuando vi.mock se ejecuta
// (vi.mock se iza al inicio del módulo, antes de las declaraciones de variables)
// ---------------------------------------------------------------------------

const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() }
})

vi.mock("@anthropic-ai/sdk", () => {
  function MockAnthropic() {
    return {
      messages: {
        create: mockCreate,
      },
    }
  }
  return { default: MockAnthropic }
})

import { validarReserva } from "@/agents/validador"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const datosBuenos = {
  nombre: "María",
  apellido: "González",
  email: "maria@gmail.com",
  telefono: "+56912345678",
  rutOPasaporte: "12.345.678-9",
  cantidadPersonas: 2,
}

const datosFalsosEvidente = {
  nombre: "test",
  apellido: "test",
  email: "test@test.com",
  telefono: "000000000",
  rutOPasaporte: "123",
  cantidadPersonas: 1,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validarReserva", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
  })

  it("retorna valido=true cuando el modelo responde válido", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: '{"valido":true}' }],
    })

    const resultado = await validarReserva(datosBuenos)

    expect(resultado.valido).toBe(true)
    expect(resultado.duracionMs).toBeGreaterThanOrEqual(0)
  })

  it("retorna valido=false cuando el modelo detecta datos falsos", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: '{"valido":false,"motivo":"Datos parecen de prueba"}',
        },
      ],
    })

    const resultado = await validarReserva(datosFalsosEvidente)

    expect(resultado.valido).toBe(false)
    expect(resultado.motivo).toBe("Datos parecen de prueba")
    expect(resultado.duracionMs).toBeGreaterThanOrEqual(0)
  })

  it("fail open: retorna valido=true si el modelo lanza excepción", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API timeout"))

    const resultado = await validarReserva(datosBuenos)

    expect(resultado.valido).toBe(true)
    expect(resultado.duracionMs).toBeGreaterThanOrEqual(0)
  })

  it("fail open: retorna valido=true si ANTHROPIC_API_KEY no está configurada", async () => {
    delete process.env.ANTHROPIC_API_KEY

    const resultado = await validarReserva(datosBuenos)

    expect(resultado.valido).toBe(true)
    expect(resultado.duracionMs).toBe(0)
  })

  it("incluye duracionMs en el resultado", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: '{"valido":true}' }],
    })

    const resultado = await validarReserva(datosBuenos)

    expect(typeof resultado.duracionMs).toBe("number")
    expect(resultado.duracionMs).toBeGreaterThanOrEqual(0)
  })
})
