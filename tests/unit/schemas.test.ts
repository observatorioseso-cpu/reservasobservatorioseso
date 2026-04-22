import { describe, it, expect } from "vitest"
import { reservaSchema } from "@/lib/schemas"

const baseReserva = {
  turnoId: "cm0000000000000000000000",
  nombre: "Ana",
  apellido: "Pérez",
  rutOPasaporte: "11.111.111-1",
  email: "ana@example.com",
  emailConfirm: "ana@example.com",
  telefono: "+56912345678",
  idioma: "ES" as const,
  cantidadPersonas: 1,
  tienesMenores: false,
  recibirWhatsapp: false,
  whatsappOptIn: false,
  password: "secreta123",
  locale: "es" as const,
  acompanantes: [],
}

describe("reservaSchema", () => {
  it("acepta reserva individual válida", () => {
    const result = reservaSchema.safeParse(baseReserva)
    expect(result.success).toBe(true)
  })

  it("rechaza cuando emails no coinciden", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      emailConfirm: "otro@example.com",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.emailConfirm).toBeDefined()
    }
  })

  it("rechaza más de 10 personas", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 11,
    })
    expect(result.success).toBe(false)
  })

  it("rechaza RUT inválido", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      rutOPasaporte: "12.345.678-1",
    })
    expect(result.success).toBe(false)
  })

  it("acepta grupo de 3 con 2 acompañantes", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 3,
      acompanantes: [
        { nombre: "Pedro", apellido: "Soto", documento: "" },
        { nombre: "María", apellido: "López", documento: "" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rechaza acompañantes si cantidad no coincide", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 3,
      acompanantes: [{ nombre: "Pedro", apellido: "Soto", documento: "" }],
    })
    expect(result.success).toBe(false)
  })

  it("acepta pasaporte extranjero", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      rutOPasaporte: "AB123456",
    })
    expect(result.success).toBe(true)
  })
})
