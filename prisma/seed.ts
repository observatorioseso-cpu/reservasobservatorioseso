import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextNSaturdays(n: number): Date[] {
  const result: Date[] = []
  const d = new Date()
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  for (let i = 0; i < n; i++) {
    result.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return result
}

function toUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // ── 1. ConfigSistema ──────────────────────────────────────────────────────
  const config = [
    {
      clave: "HORA_CIERRE_VIERNES",
      valor: "16",
      descripcion:
        "Hora límite (Santiago) para recibir nuevas reservas el día antes de cada visita. " +
        "El admin puede cambiarla a 17 o 18 en invierno (baja demanda). Valores válidos: 14–20.",
    },
    {
      clave: "HORA_RECORDATORIO_VIERNES",
      valor: "8",
      descripcion:
        "Hora (Santiago) a la que se envía el recordatorio de confirmación el viernes. " +
        "Corresponde al cron '0 11 * * 5' en vercel.json (11 UTC = 08:00 Santiago invierno).",
    },
    {
      clave: "EMAIL_CONTACTO_RESERVAS",
      valor: "reservas@observatorioseso.cl",
      descripcion: "Email público del equipo ESO para consultas y reservas de grupos grandes.",
    },
    {
      clave: "TELEFONO_WHATSAPP_ESO",
      valor: "56XXXXXXXXX",
      descripcion:
        "Número de WhatsApp ESO Chile para el botón de confirmación (sin + ni espacios).",
    },
    {
      clave: "MAX_PERSONAS_CLIENTE",
      valor: "10",
      descripcion:
        "Máximo de personas por reserva individual de cliente. " +
        "El admin puede superar este límite desde el panel.",
    },
    {
      clave: "VENTANA_RESERVA_DIAS",
      valor: "90",
      descripcion:
        "Días hacia adelante que el sistema mantiene turnos disponibles (ventana rodante). " +
        "El cron 2× al día crea automáticamente los sábados faltantes dentro de esta ventana. " +
        "0 = desactivar generación automática. Rango válido: 0–360.",
    },
  ]

  for (const item of config) {
    await prisma.configSistema.upsert({
      where: { clave: item.clave },
      update: {}, // no sobreescribir si ya existe (puede haber sido cambiado por admin)
      create: item,
    })
  }

  console.log(`✓ ConfigSistema: ${config.length} valores inicializados`)

  // ── 2. Admin de desarrollo ────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash("admin123", 12)
  await prisma.admin.upsert({
    where: { email: "admin@observatorioseso.cl" },
    update: {},
    create: {
      email: "admin@observatorioseso.cl",
      passwordHash: adminPasswordHash,
      nombre: "Admin ESO",
    },
  })
  console.log("✓ Admin: admin@observatorioseso.cl / admin123")

  // ── 3. Limpiar turnos de Paranal en domingos (datos de seed antiguo) ─────
  // Los domingos tienen getUTCDay() === 0
  const paranálTurnosExistentes = await prisma.turno.findMany({
    where: { observatorio: "PARANAL" },
    select: { id: true, fecha: true },
  })
  const idsDomingosParanal = paranálTurnosExistentes
    .filter((t) => t.fecha.getUTCDay() === 0)
    .map((t) => t.id)

  if (idsDomingosParanal.length > 0) {
    await prisma.turno.deleteMany({
      where: { id: { in: idsDomingosParanal } },
    })
    console.log(`✓ Eliminados ${idsDomingosParanal.length} turno(s) de Paranal en domingo`)
  }

  // ── 4. Turnos de prueba ───────────────────────────────────────────────────

  const sabados = nextNSaturdays(16)

  // — La Silla: próximos 16 sábados, un solo turno por día (09:30–13:00) —
  let laSillaCount = 0

  for (const fecha of sabados) {
    const fechaUTC = toUTCDate(fecha)

    const existing = await prisma.turno.findUnique({
      where: {
        observatorio_fecha_horaInicio: {
          observatorio: "LA_SILLA",
          fecha: fechaUTC,
          horaInicio: "09:30",
        },
      },
    })

    if (!existing) {
      await prisma.turno.create({
        data: {
          observatorio: "LA_SILLA",
          fecha: fechaUTC,
          horaInicio: "09:30",
          horaFin: "13:00",
          capacidadMax: 40,
          cuposOcupados: 0,
          activo: true,
        },
      })
      laSillaCount++
    }
  }

  // — Paranal: próximos 16 sábados, dos turnos por día —
  const turnosParanal = [
    { horaInicio: "09:30", horaFin: "13:00" },
    { horaInicio: "13:30", horaFin: "17:00" },
  ]

  let paranálCount = 0

  for (const fecha of sabados) {
    const fechaUTC = toUTCDate(fecha)

    for (const t of turnosParanal) {
      const existing = await prisma.turno.findUnique({
        where: {
          observatorio_fecha_horaInicio: {
            observatorio: "PARANAL",
            fecha: fechaUTC,
            horaInicio: t.horaInicio,
          },
        },
      })

      if (!existing) {
        await prisma.turno.create({
          data: {
            observatorio: "PARANAL",
            fecha: fechaUTC,
            horaInicio: t.horaInicio,
            horaFin: t.horaFin,
            capacidadMax: 60,
            cuposOcupados: 0,
            activo: true,
          },
        })
        paranálCount++
      }
    }
  }

  console.log(`✓ Turnos creados — La Silla: ${laSillaCount} | Paranal: ${paranálCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
