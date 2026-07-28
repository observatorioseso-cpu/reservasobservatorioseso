import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { randomBytes } from "crypto"

// ---------------------------------------------------------------------------
// vi.hoisted deja mockFindUnique listo antes de que vi.mock se ejecute
// ---------------------------------------------------------------------------

const { mockFindUnique } = vi.hoisted(() => ({ mockFindUnique: vi.fn() }))

vi.mock("@/lib/prisma", () => ({
  prisma: { configSistema: { findUnique: mockFindUnique } },
}))

import {
  resolverClaveBackup,
  origenClaveBackup,
  CLAVE_BACKUP_CONFIG,
} from "@/lib/claveBackup"
import { ClaveBackupInvalida } from "@/lib/cifradoBackup"

const CLAVE = randomBytes(32)
const HEX = CLAVE.toString("hex")
const original = process.env.BACKUP_ENCRYPTION_KEY

beforeEach(() => {
  mockFindUnique.mockReset()
  delete process.env.BACKUP_ENCRYPTION_KEY
})

afterEach(() => {
  if (original === undefined) delete process.env.BACKUP_ENCRYPTION_KEY
  else process.env.BACKUP_ENCRYPTION_KEY = original
})

describe("resolverClaveBackup", () => {
  it("usa el entorno y ni consulta la base de datos", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = HEX

    const resuelta = await resolverClaveBackup()

    expect(resuelta?.origen).toBe("entorno")
    expect(resuelta?.clave.equals(CLAVE)).toBe(true)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it("cae a ConfigSistema cuando no hay variable de entorno", async () => {
    mockFindUnique.mockResolvedValue({ valor: HEX })

    const resuelta = await resolverClaveBackup()

    expect(resuelta?.origen).toBe("config")
    expect(resuelta?.clave.equals(CLAVE)).toBe(true)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clave: CLAVE_BACKUP_CONFIG },
      select: { valor: true },
    })
  })

  it("acepta la clave guardada en base64", async () => {
    mockFindUnique.mockResolvedValue({ valor: CLAVE.toString("base64") })

    const resuelta = await resolverClaveBackup()

    expect(resuelta?.clave.equals(CLAVE)).toBe(true)
  })

  it("devuelve null cuando no hay clave en ninguna parte", async () => {
    mockFindUnique.mockResolvedValue(null)
    expect(await resolverClaveBackup()).toBeNull()
  })

  it("trata una fila en blanco como ausencia de clave", async () => {
    mockFindUnique.mockResolvedValue({ valor: "   " })
    expect(await resolverClaveBackup()).toBeNull()
  })

  it("lanza si la clave guardada en la base de datos mide otra cosa", async () => {
    mockFindUnique.mockResolvedValue({ valor: randomBytes(16).toString("hex") })
    await expect(resolverClaveBackup()).rejects.toThrow(ClaveBackupInvalida)
  })

  it("lanza por una variable de entorno mal formada en vez de tapar el error con la base de datos", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = "esto-no-es-una-clave"
    mockFindUnique.mockResolvedValue({ valor: HEX })

    await expect(resolverClaveBackup()).rejects.toThrow(ClaveBackupInvalida)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })
})

describe("origenClaveBackup", () => {
  it("informa el entorno", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = HEX
    expect(await origenClaveBackup()).toBe("entorno")
  })

  it("informa la base de datos", async () => {
    mockFindUnique.mockResolvedValue({ valor: HEX })
    expect(await origenClaveBackup()).toBe("config")
  })

  it("devuelve null sin clave", async () => {
    mockFindUnique.mockResolvedValue(null)
    expect(await origenClaveBackup()).toBeNull()
  })

  it("devuelve null en vez de lanzar cuando la clave está mal formada", async () => {
    process.env.BACKUP_ENCRYPTION_KEY = "rota"
    expect(await origenClaveBackup()).toBeNull()
  })
})
