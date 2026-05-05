import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "[prisma] DATABASE_URL no está configurado. Revisa tus variables de entorno."
    )
  }
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

/**
 * Lazy getter — el cliente Prisma se crea la primera vez que se accede a `prisma`,
 * no al importar el módulo. Esto evita errores de build cuando DATABASE_URL no está
 * configurado en el entorno de compilación (ej: Vercel build sin env vars).
 */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
