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
    valor: "4",
    descripcion: "Máx. personas por reserva (4 = visita nocturna 30 mayo; restablecer a 10 tras el evento)",
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

// MAX_PERSONAS_CLIENTE forzado a 4 (evento nocturno)
await prisma.configSistema.update({
  where: { clave: "MAX_PERSONAS_CLIENTE" },
  data:  { valor: "4" },
})
console.log("MAX_PERSONAS_CLIENTE → 4 ✓")

await prisma.$disconnect()
