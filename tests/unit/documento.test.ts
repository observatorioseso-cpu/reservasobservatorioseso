import { describe, it, expect } from "vitest"
import {
  validarRut,
  validarDocumento,
  detectarTipoDocumento,
  formatearDocumento,
} from "@/lib/documento"

// Valid Chilean RUTs verified with the modulo-11 algorithm:
// 11.111.111-1 → DV=1 ✓
// 8.765.432-K  → DV=K ✓

describe("validarRut", () => {
  it("acepta RUT con dígito numérico correcto", () => {
    expect(validarRut("11.111.111-1")).toBe(true)
  })

  it("acepta RUT con dígito K correcto", () => {
    expect(validarRut("8.765.432-K")).toBe(true)
  })

  it("rechaza RUT con dígito incorrecto", () => {
    expect(validarRut("11.111.111-2")).toBe(false)
  })

  it("acepta RUT sin puntos ni guión", () => {
    expect(validarRut("111111111")).toBe(true)
  })

  it("acepta RUT con puntos y guión", () => {
    expect(validarRut("11.111.111-1")).toBe(true)
  })
})

describe("detectarTipoDocumento", () => {
  it("detecta RUT chileno", () => {
    expect(detectarTipoDocumento("11.111.111-1")).toBe("rut")
  })

  it("detecta pasaporte con letras", () => {
    expect(detectarTipoDocumento("AB123456")).toBe("pasaporte")
  })

  it("retorna desconocido para string vacío", () => {
    expect(detectarTipoDocumento("")).toBe("desconocido")
  })
})

describe("validarDocumento", () => {
  it("valida RUT correcto", () => {
    const result = validarDocumento("11.111.111-1")
    expect(result.valido).toBe(true)
    expect(result.tipo).toBe("rut")
  })

  it("invalida RUT con dígito errado", () => {
    const result = validarDocumento("11.111.111-5")
    expect(result.valido).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("valida pasaporte alfanumérico", () => {
    const result = validarDocumento("AB123456")
    expect(result.valido).toBe(true)
    expect(result.tipo).toBe("pasaporte")
  })

  it("rechaza documento demasiado corto", () => {
    const result = validarDocumento("AB1")
    expect(result.valido).toBe(false)
  })
})

describe("formatearDocumento", () => {
  it("formatea RUT con puntos y guión", () => {
    expect(formatearDocumento("111111111")).toBe("11.111.111-1")
  })

  it("deja pasaporte en mayúsculas sin formatear", () => {
    expect(formatearDocumento("ab123456")).toBe("AB123456")
  })
})
