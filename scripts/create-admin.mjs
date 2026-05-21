/**
 * Crea o actualiza un admin en la BD.
 * Uso:
 *   DATABASE_URL="postgresql://..." ADMIN_EMAIL="tu@email.cl" ADMIN_PASS="tuPassword" node scripts/create-admin.mjs
 *
 * Si el email ya existe, actualiza la contraseña y el nombre.
 * NUNCA imprime la contraseña en texto plano.
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Bcrypt via dynamic import para evitar problemas ESM
const { default: bcrypt } = await import("bcryptjs")

const url    = process.env.DATABASE_URL
const email  = process.env.ADMIN_EMAIL
const pass   = process.env.ADMIN_PASS
const nombre = process.env.ADMIN_NOMBRE ?? "Admin ESO"

if (!url) {
  console.error("Falta DATABASE_URL como variable de entorno.")
  process.exit(1)
}
if (!email || !pass) {
  console.error("Falta ADMIN_EMAIL o ADMIN_PASS como variable de entorno.")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: url })
const prisma = new PrismaClient({ adapter })

const hash = await bcrypt.hash(pass, 12)

const admin = await prisma.admin.upsert({
  where:  { email },
  update: { passwordHash: hash, nombre },
  create: { email, passwordHash: hash, nombre },
})

console.log(`Admin OK: ${admin.email} (id: ${admin.id})`)
console.log("Contraseña guardada con hash bcrypt 12 rounds. No se almacena en texto plano.")

await prisma.$disconnect()
