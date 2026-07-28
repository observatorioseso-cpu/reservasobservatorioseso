import { describe, it, expect, afterEach } from "vitest"
import { randomBytes } from "crypto"
import {
  cifrar,
  descifrar,
  esSobreCifrado,
  leerClave,
  hayClave,
  normalizarClave,
  ClaveBackupInvalida,
} from "@/lib/cifradoBackup"

const CLAVE = randomBytes(32)
const original = process.env.BACKUP_ENCRYPTION_KEY

afterEach(() => {
  if (original === undefined) delete process.env.BACKUP_ENCRYPTION_KEY
  else process.env.BACKUP_ENCRYPTION_KEY = original
})

describe("cifrar y descifrar", () => {
  it("devuelve el texto original", () => {
    const texto = JSON.stringify({ reservas: [{ rut: "11.111.111-1" }] })
    expect(descifrar(cifrar(texto, CLAVE), CLAVE)).toBe(texto)
  })

  it("no deja el contenido legible en el sobre", () => {
    const sobre = cifrar("rut 11.111.111-1 correo ana@example.com", CLAVE)
    expect(JSON.stringify(sobre)).not.toContain("11.111.111-1")
    expect(JSON.stringify(sobre)).not.toContain("ana@example.com")
  })

  it("usa un IV distinto en cada llamada", () => {
    const a = cifrar("mismo texto", CLAVE)
    const b = cifrar("mismo texto", CLAVE)
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it("falla con una clave distinta", () => {
    const sobre = cifrar("secreto", CLAVE)
    expect(() => descifrar(sobre, randomBytes(32))).toThrow()
  })

  it("falla si alguien altera el contenido cifrado", () => {
    const sobre = cifrar("secreto que no se debe tocar", CLAVE)
    const bytes = Buffer.from(sobre.data, "base64")
    bytes[0] ^= 0xff
    const alterado = { ...sobre, data: bytes.toString("base64") }
    expect(() => descifrar(alterado, CLAVE)).toThrow()
  })

  it("falla si alguien altera la etiqueta de autenticación", () => {
    const sobre = cifrar("secreto", CLAVE)
    const tag = Buffer.from(sobre.tag, "base64")
    tag[0] ^= 0xff
    expect(() =>
      descifrar({ ...sobre, tag: tag.toString("base64") }, CLAVE)
    ).toThrow()
  })

  it("sobrevive a un texto con acentos y emojis", () => {
    const texto = "Ñandú, José Muñoz, Coquimbo 🔭"
    expect(descifrar(cifrar(texto, CLAVE), CLAVE)).toBe(texto)
  })
})

describe("esSobreCifrado", () => {
  it("reconoce un sobre válido", () => {
    expect(esSobreCifrado(cifrar("hola", CLAVE))).toBe(true)
  })

  it("rechaza un respaldo antiguo en texto plano", () => {
    const legado = { version: "2.0", timestamp: "2026-07-01", data: {} }
    expect(esSobreCifrado(legado)).toBe(false)
  })

  it("rechaza null y primitivos", () => {
    expect(esSobreCifrado(null)).toBe(false)
    expect(esSobreCifrado("texto")).toBe(false)
    expect(esSobreCifrado(7)).toBe(false)
  })
})

describe("normalizarClave", () => {
  it("acepta 64 caracteres hex", () => {
    expect(normalizarClave(CLAVE.toString("hex")).equals(CLAVE)).toBe(true)
  })

  it("acepta base64", () => {
    expect(normalizarClave(CLAVE.toString("base64")).equals(CLAVE)).toBe(true)
  })

  it("ignora espacios alrededor, que es lo que deja copiar y pegar", () => {
    expect(normalizarClave(`  ${CLAVE.toString("hex")}\n`).equals(CLAVE)).toBe(true)
  })

  it("rechaza una clave corta", () => {
    expect(() => normalizarClave(randomBytes(16).toString("hex"))).toThrow(
      ClaveBackupInvalida
    )
  })

  it("rechaza texto que no es una clave", () => {
    expect(() => normalizarClave("clave-secreta")).toThrow(ClaveBackupInvalida)
  })

  it("rechaza la cadena vacía", () => {
    expect(() => normalizarClave("")).toThrow(ClaveBackupInvalida)
  })
})

describe("leerClave", () => {
  it("devuelve null cuando no está configurada", () => {
    delete process.env.BACKUP_ENCRYPTION_KEY
    expect(leerClave()).toBeNull()
    expect(hayClave()).toBe(false)
  })

  it("acepta 64 caracteres hex", () => {
    process.env.BACKUP_ENCRYPTION_KEY = CLAVE.toString("hex")
    expect(leerClave()?.equals(CLAVE)).toBe(true)
  })

  it("acepta base64", () => {
    process.env.BACKUP_ENCRYPTION_KEY = CLAVE.toString("base64")
    expect(leerClave()?.equals(CLAVE)).toBe(true)
  })

  it("rechaza una clave corta en vez de aceptarla a medias", () => {
    process.env.BACKUP_ENCRYPTION_KEY = randomBytes(16).toString("hex")
    expect(() => leerClave()).toThrow(ClaveBackupInvalida)
    expect(hayClave()).toBe(false)
  })

  it("descifra lo que cifró usando la clave del entorno", () => {
    process.env.BACKUP_ENCRYPTION_KEY = CLAVE.toString("hex")
    const clave = leerClave()!
    expect(descifrar(cifrar("ida y vuelta", clave), clave)).toBe("ida y vuelta")
  })
})
