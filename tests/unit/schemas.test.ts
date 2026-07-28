import { describe, it, expect } from "vitest"
import { reservaSchema } from "@/lib/schemas"

/**
 * Reserva mínima que reservaSchema acepta.
 *
 * Tiene que ser válida de verdad: los casos que afirman `success === false`
 * solo prueban algo si el único defecto es el que introduce cada test. Si al
 * esquema le agregan un campo obligatorio y este objeto no lo trae, los tests
 * negativos siguen en verde sin cubrir nada. Al tocar reservaSchema, revisa
 * también este objeto.
 */
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
  nacionalidad: "Chile",
  ciudadResidencia: "Santiago",
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

  // El documento del acompañante es obligatorio desde que la nómina se usa como
  // lista de control de seguridad. Uno lleva RUT y el otro pasaporte, para
  // cubrir los dos caminos de validarDocumento.
  it("acepta grupo de 3 con 2 acompañantes", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 3,
      acompanantes: [
        { nombre: "Pedro", apellido: "Soto", documento: "12.345.678-5" },
        { nombre: "María", apellido: "López", documento: "AB123456" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rechaza acompañante sin documento", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 2,
      acompanantes: [{ nombre: "Pedro", apellido: "Soto", documento: "" }],
    })
    expect(result.success).toBe(false)
  })

  it("rechaza acompañantes si cantidad no coincide", () => {
    const result = reservaSchema.safeParse({
      ...baseReserva,
      cantidadPersonas: 3,
      acompanantes: [
        { nombre: "Pedro", apellido: "Soto", documento: "12.345.678-5" },
      ],
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
