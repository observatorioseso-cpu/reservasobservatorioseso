/**
 * Siembra valores iniciales en ConfigSistema.
 * Uso: DATABASE_URL="postgresql://..." node scripts/seed-config.mjs
 *
 * Es un upsert seguro — nunca borra datos existentes.
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("Falta DATABASE_URL como variable de entorno.")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: url })
const prisma = new PrismaClient({ adapter })

const configs = [
  {
    clave: "MAX_PERSONAS_CLIENTE",
    valor: "10",
    descripcion: "Máx. personas por reserva individual (visitas regulares). Las visitas nocturnas usan maxPersonasPorReserva del Turno.",
  },
  {
    clave: "HORA_CIERRE_VIERNES",
    valor: "15",
    descripcion: "Hora (14-20) en que se cierran las reservas el viernes previo. Santiago.",
  },
  {
    clave: "VENTANA_RESERVA_DIAS",
    valor: "60",
    descripcion: "Días hacia adelante que el cron mantiene turnos disponibles.",
  },
  {
    clave: "WHATSAPP_ENABLED",
    valor: "false",
    descripcion: "Activa o desactiva notificaciones por WhatsApp.",
  },
]

for (const cfg of configs) {
  const result = await prisma.configSistema.upsert({
    where:  { clave: cfg.clave },
    update: { descripcion: cfg.descripcion },  // no sobreescribe valor si ya existe
    create: cfg,
  })
  console.log(`${result.clave} = ${result.valor}`)
}

// MAX_PERSONAS_CLIENTE → 10 (valor normal para visitas regulares)
// Las visitas nocturnas controlan su límite a través de Turno.maxPersonasPorReserva
await prisma.configSistema.update({
  where: { clave: "MAX_PERSONAS_CLIENTE" },
  data:  { valor: "10" },
})
console.log("MAX_PERSONAS_CLIENTE → 10 ✓")

await prisma.$disconnect()
