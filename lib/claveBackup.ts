/**
 * Resolución de la clave de cifrado de respaldos — lib/claveBackup.ts
 *
 * La clave vive en BACKUP_ENCRYPTION_KEY. Cuando nadie puede entrar al panel de
 * Vercel a cargar esa variable, el cifrado queda bloqueado y las copias se
 * quedan solo dentro de la base de datos.
 *
 * Para no depender de ese acceso, la clave también puede guardarse en
 * ConfigSistema, que se administra desde /admin/config. El entorno manda: si la
 * variable existe, la fila de la base de datos ni se consulta. Así, el día que
 * alguien recupere Vercel y cargue la variable, el sistema cambia de fuente sin
 * que haya que borrar nada.
 *
 * Sobre guardar la clave junto a los datos que protege: el respaldo completo ya
 * vive sin cifrar en BackupJob.datosJson, así que quien lee la base de datos
 * tiene los datos con clave o sin ella. Lo que el cifrado defiende es el objeto
 * del Blob, que es público y se sirve a cualquiera que adivine la URL. Esa
 * defensa queda intacta.
 *
 * Lo que sí cambia es la restauración ante desastre. Si se pierde la base de
 * datos y la clave solo estaba ahí, los respaldos del Blob quedan ilegibles.
 * Por eso la clave tiene que estar además en el gestor de contraseñas del
 * equipo, y el panel lo advierte.
 */

import { prisma } from "@/lib/prisma"
import { leerClave, normalizarClave } from "@/lib/cifradoBackup"

/** Fila de ConfigSistema que guarda la clave cuando no hay variable de entorno. */
export const CLAVE_BACKUP_CONFIG = "BACKUP_ENCRYPTION_KEY"

export type OrigenClave = "entorno" | "config"

export interface ClaveResuelta {
  clave: Buffer
  origen: OrigenClave
}

/**
 * Busca la clave en el entorno y, si no está, en ConfigSistema.
 *
 * @returns La clave y de dónde salió, o null si no hay clave en ninguna parte.
 * @throws ClaveBackupInvalida si la clave existe pero está mal formada. Se
 *   propaga a propósito: una clave con un error de tipeo es un problema que
 *   conviene ver en los logs, no uno que se deba tapar cayendo a la otra fuente.
 */
export async function resolverClaveBackup(): Promise<ClaveResuelta | null> {
  const delEntorno = leerClave()
  if (delEntorno) return { clave: delEntorno, origen: "entorno" }

  const fila = await prisma.configSistema.findUnique({
    where: { clave: CLAVE_BACKUP_CONFIG },
    select: { valor: true },
  })

  const guardada = fila?.valor?.trim()
  if (!guardada) return null

  return { clave: normalizarClave(guardada), origen: "config" }
}

/**
 * De dónde saldría la clave ahora mismo, sin devolverla.
 *
 * La usa el panel de administración para mostrar el estado sin que el valor
 * llegue nunca al navegador.
 */
export async function origenClaveBackup(): Promise<OrigenClave | null> {
  try {
    const resuelta = await resolverClaveBackup()
    return resuelta?.origen ?? null
  } catch {
    return null
  }
}
