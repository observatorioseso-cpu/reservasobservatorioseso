/**
 * Crea los turnos nocturnos del 30 de mayo en La Silla y Paranal.
 * Uso: DATABASE_URL="postgresql://..." node scripts/seed-turnos-mayo30.mjs
 *
 * Idem potente — comprueba si ya existen antes de crear.
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

// 30 de mayo de 2026 al mediodía UTC (evita ambigüedades de zona horaria)
const fecha = new Date("2026-05-30T12:00:00.000Z")

const turnos = [
  {
    observatorio: "LA_SILLA",
    fecha,
    horaInicio: "16:30",
    horaFin:    "20:30",
    capacidadMax:        40,
    tipo:                "NOCTURNA",
    maxPersonasPorReserva: 4,
  },
  {
    observatorio: "PARANAL",
    fecha,
    horaInicio: "16:30",
    horaFin:    "20:30",
    capacidadMax:        40,
    tipo:                "NOCTURNA",
    maxPersonasPorReserva: 4,
  },
]

for (const t of turnos) {
  // Verificar si ya existe un turno NOCTURNA para este obs/fecha/hora
  const existing = await prisma.turno.findFirst({
    where: {
      observatorio: t.observatorio,
      fecha:        t.fecha,
      horaInicio:   t.horaInicio,
      tipo:         "NOCTURNA",
    },
  })

  if (existing) {
    console.log(`Ya existe: ${t.observatorio} ${t.horaInicio}–${t.horaFin} (ID: ${existing.id}) — omitiendo`)
    continue
  }

  const result = await prisma.turno.create({ data: t })
  console.log(`Creado:    ${result.observatorio} ${result.fecha.toISOString().slice(0, 10)} ${result.horaInicio}–${result.horaFin} | cap: ${result.capacidadMax} | máx/reserva: ${result.maxPersonasPorReserva} (ID: ${result.id})`)
}

await prisma.$disconnect()
