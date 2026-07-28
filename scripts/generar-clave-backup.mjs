/**
 * Genera la clave de cifrado de respaldos.
 *
 * Uso:
 *   node scripts/generar-clave-backup.mjs
 *
 * Copia el valor a BACKUP_ENCRYPTION_KEY en Vercel (production y preview).
 *
 * Guárdala también fuera de Vercel, en el gestor de contraseñas del equipo.
 * Sin esta clave los respaldos del Blob no se pueden restaurar: cifrado
 * autenticado significa que no hay puerta trasera ni recuperación parcial.
 *
 * Rotarla invalida los respaldos anteriores que estén en el Blob. Como la
 * retención es de 7 días, una rotación deja al sistema apoyado solo en el
 * respaldo que guarda la propia base de datos hasta que se acumulen copias
 * nuevas. Rota en día hábil y verifica al día siguiente.
 */
import { randomBytes } from "crypto"

const clave = randomBytes(32).toString("hex")

console.log("")
console.log("BACKUP_ENCRYPTION_KEY generada (AES-256, 32 bytes en hex):")
console.log("")
console.log(`  ${clave}`)
console.log("")
console.log("Pasos:")
console.log("  1. Guárdala en el gestor de contraseñas del equipo.")
console.log("  2. npx vercel env add BACKUP_ENCRYPTION_KEY production")
console.log("  3. Redespliega para que el cron la tome.")
console.log("")
