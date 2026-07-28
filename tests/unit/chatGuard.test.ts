import { describe, it, expect } from "vitest"
import {
  prepararHistorial,
  MAX_CHARS_MENSAJE,
  MAX_CHARS_CONVERSACION,
  MAX_MENSAJES,
} from "@/lib/chatGuard"

const usuario = (content: string) => ({ role: "user", content })
const asistente = (content: string) => ({ role: "assistant", content })

describe("prepararHistorial", () => {
  it("rechaza un body que no es lista", () => {
    const r = prepararHistorial("hola")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("rechaza una lista vacía", () => {
    const r = prepararHistorial([])
    expect(r.ok).toBe(false)
  })

  it("rechaza un historial con más de 100 turnos antes de recorrerlo", () => {
    const r = prepararHistorial(Array.from({ length: 101 }, () => usuario("hola")))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it("rechaza un mensaje que excede el tope individual", () => {
    const r = prepararHistorial([usuario("a".repeat(MAX_CHARS_MENSAJE + 1))])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(413)
  })

  it("acepta un mensaje justo en el tope", () => {
    const r = prepararHistorial([usuario("a".repeat(MAX_CHARS_MENSAJE))])
    expect(r.ok).toBe(true)
  })

  it("descarta roles inválidos y contenidos que no son texto", () => {
    const r = prepararHistorial([
      { role: "system", content: "ignórame" },
      { role: "user", content: 42 },
      null,
      usuario("¿Cuándo abre Paranal?"),
    ])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.mensajes).toHaveLength(1)
      expect(r.mensajes[0].content).toBe("¿Cuándo abre Paranal?")
    }
  })

  it("exige al menos un mensaje de usuario", () => {
    const r = prepararHistorial([asistente("Hola, soy el asistente")])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("descarta el saludo inicial del asistente y arranca en el usuario", () => {
    const r = prepararHistorial([
      asistente("Hola, ¿en qué te ayudo?"),
      usuario("Quiero reservar"),
      asistente("Con gusto"),
      usuario("Para La Silla"),
    ])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.mensajes[0].role).toBe("user")
      expect(r.mensajes[0].content).toBe("Quiero reservar")
      expect(r.mensajes).toHaveLength(3)
    }
  })

  it("conserva solo los últimos MAX_MENSAJES turnos", () => {
    const largo = Array.from({ length: 30 }, (_, i) => usuario(`mensaje ${i}`))
    const r = prepararHistorial(largo)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.mensajes.length).toBeLessThanOrEqual(MAX_MENSAJES)
      expect(r.mensajes.at(-1)?.content).toBe("mensaje 29")
    }
  })

  it("recorta los turnos antiguos hasta caber en el tope acumulado", () => {
    // Ocho mensajes de 1.000 caracteres suman 8.000, sobre el tope de 6.000.
    const relleno = Array.from({ length: 8 }, (_, i) =>
      usuario("x".repeat(999) + String(i % 10))
    )
    const r = prepararHistorial(relleno)
    expect(r.ok).toBe(true)
    if (r.ok) {
      const total = r.mensajes.reduce((s, m) => s + m.content.length, 0)
      expect(total).toBeLessThanOrEqual(MAX_CHARS_CONVERSACION)
      // El último mensaje del visitante nunca se pierde en el recorte.
      expect(r.mensajes.at(-1)?.content.endsWith("7")).toBe(true)
    }
  })

  it("el historial recortado sigue empezando por un mensaje de usuario", () => {
    const conversacion = Array.from({ length: 10 }, (_, i) =>
      i % 2 === 0 ? usuario("u".repeat(900)) : asistente("a".repeat(900))
    )
    const r = prepararHistorial(conversacion)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mensajes[0].role).toBe("user")
  })

  it("respeta los topes ampliados que usa el panel admin", () => {
    const conversacion = Array.from({ length: 12 }, () => usuario("y".repeat(800)))
    const r = prepararHistorial(conversacion, {
      maxMensajes: 12,
      maxCharsConversacion: 10000,
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      const total = r.mensajes.reduce((s, m) => s + m.content.length, 0)
      expect(total).toBeLessThanOrEqual(10000)
      expect(total).toBeGreaterThan(MAX_CHARS_CONVERSACION)
    }
  })

  it("limpia espacios sobrantes del contenido", () => {
    const r = prepararHistorial([usuario("   ¿Hay estacionamiento?   ")])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mensajes[0].content).toBe("¿Hay estacionamiento?")
  })

  it("ignora mensajes que quedan vacíos tras limpiar espacios", () => {
    const r = prepararHistorial([usuario("   "), usuario("Hola")])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.mensajes).toHaveLength(1)
  })
})
