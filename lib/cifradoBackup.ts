/**
 * Cifrado de respaldos — lib/cifradoBackup.ts
 *
 * Los respaldos llevan RUT, correo y teléfono de todos los visitantes. Vercel
 * Blob en la versión que usamos solo ofrece objetos públicos: la URL es
 * impredecible, pero quien la consiga lee el archivo entero sin autenticarse.
 * Bajo la Ley 21.719 eso es una exposición evitable.
 *
 * La respuesta es cifrar el contenido antes de subirlo, con AES-256-GCM y una
 * clave que vive solo en las variables de entorno. Aunque la URL se filtre, o
 * aunque se filtre el token de Blob, lo que hay al otro lado es ruido.
 *
 * GCM se elige por ser cifrado autenticado: si alguien altera un byte del
 * respaldo, el descifrado falla en vez de devolver datos corrompidos.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITMO = "aes-256-gcm"
const IV_BYTES = 12 // recomendado para GCM
const CLAVE_BYTES = 32

/** Sobre autodescriptivo que se guarda en el Blob. */
export interface SobreCifrado {
  v: 1
  alg: typeof ALGORITMO
  iv: string
  tag: string
  data: string
}

export class ClaveBackupInvalida extends Error {}

/**
 * Convierte una clave escrita en texto a los 32 bytes que exige AES-256.
 * Acepta 64 caracteres hex o 32 bytes en base64.
 *
 * La clave puede llegar desde la variable de entorno o desde ConfigSistema, así
 * que el mensaje de error no nombra ninguna fuente en particular.
 *
 * @throws ClaveBackupInvalida si no mide 32 bytes.
 */
export function normalizarClave(bruto: string): Buffer {
  const limpio = bruto.trim()

  const buffer = /^[0-9a-fA-F]{64}$/.test(limpio)
    ? Buffer.from(limpio, "hex")
    : Buffer.from(limpio, "base64")

  if (buffer.length !== CLAVE_BYTES) {
    throw new ClaveBackupInvalida(
      `La clave de respaldo debe medir ${CLAVE_BYTES} bytes: 64 caracteres hexadecimales o 44 en base64. Recibidos: ${buffer.length} bytes.`
    )
  }
  return buffer
}

/**
 * Lee BACKUP_ENCRYPTION_KEY del entorno.
 *
 * Para resolver la clave con el respaldo de ConfigSistema incluido, usa
 * `resolverClaveBackup()` de lib/claveBackup.ts.
 *
 * @returns La clave, o null si la variable no está definida.
 * @throws ClaveBackupInvalida si está definida pero no mide 32 bytes.
 */
export function leerClave(): Buffer | null {
  const bruto = process.env.BACKUP_ENCRYPTION_KEY?.trim()
  if (!bruto) return null
  return normalizarClave(bruto)
}

/** true si el sistema puede cifrar respaldos ahora mismo. */
export function hayClave(): boolean {
  try {
    return leerClave() !== null
  } catch {
    return false
  }
}

export function cifrar(textoPlano: string, clave: Buffer): SobreCifrado {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITMO, clave, iv)
  const cifrado = Buffer.concat([
    cipher.update(textoPlano, "utf8"),
    cipher.final(),
  ])
  return {
    v: 1,
    alg: ALGORITMO,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: cifrado.toString("base64"),
  }
}

export function descifrar(sobre: SobreCifrado, clave: Buffer): string {
  const decipher = createDecipheriv(
    ALGORITMO,
    clave,
    Buffer.from(sobre.iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(sobre.tag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(sobre.data, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

/**
 * Distingue un sobre cifrado de un respaldo antiguo en texto plano.
 *
 * Los respaldos subidos antes de este cambio siguen en el Blob durante la
 * ventana de retención, así que la restauración tiene que aceptar los dos
 * formatos hasta que expiren.
 */
export function esSobreCifrado(valor: unknown): valor is SobreCifrado {
  if (typeof valor !== "object" || valor === null) return false
  const v = valor as Partial<SobreCifrado>
  return (
    v.v === 1 &&
    v.alg === ALGORITMO &&
    typeof v.iv === "string" &&
    typeof v.tag === "string" &&
    typeof v.data === "string"
  )
}
