import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function proximosSabados(cantidad: number): Date[] {
  const sabados: Date[] = []
  const d = new Date()
  // Avanzar al próximo sábado (día 6)
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  for (let i = 0; i < cantidad; i++) {
    sabados.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return sabados
}

/** Mes 4–8 (abril–agosto) es invierno para La Silla */
function esInviernoLaSilla(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1 // 1-indexed
  return mes >= 4 && mes <= 8
}

/** Devuelve el primer y tercer domingo del mes de una fecha dada */
function primerYTercerDomingo(año: number, mes: number): Date[] {
  const domingos: Date[] = []
  const d = new Date(año, mes - 1, 1) // primer día del mes
  // Avanzar al primer domingo
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
  domingos.push(new Date(d))
  // Tercer domingo = primer domingo + 14 días
  const tercero = new Date(d)
  tercero.setDate(tercero.getDate() + 14)
  domingos.push(tercero)
  return domingos
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

  // ── 3. Turnos de prueba ───────────────────────────────────────────────────

  let turnosCreados = 0

  // — La Silla: próximos 8 sábados —
  const sabados = proximosSabados(8)

  for (const fecha of sabados) {
    const esinvierno = esInviernoLaSilla(fecha)
    const turnosDia: Array<{ horaInicio: string; horaFin: string }> = [
      { horaInicio: "09:30", horaFin: "13:00" },
    ]
    if (!esinvierno) {
      turnosDia.push({ horaInicio: "13:30", horaFin: "17:00" })
    }

    for (const t of turnosDia) {
      // Normalizar a medianoche UTC para campo @db.Date
      const fechaDate = new Date(
        Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
      )

      const existing = await prisma.turno.findUnique({
        where: {
          observatorio_fecha_horaInicio: {
            observatorio: "LA_SILLA",
            fecha: fechaDate,
            horaInicio: t.horaInicio,
          },
        },
      })

      if (!existing) {
        await prisma.turno.create({
          data: {
            observatorio: "LA_SILLA",
            fecha: fechaDate,
            horaInicio: t.horaInicio,
            horaFin: t.horaFin,
            capacidadMax: 30,
            cuposOcupados: 0,
            activo: true,
          },
        })
        turnosCreados++
      }
    }
  }

  // — Paranal: primer y tercer domingo de cada uno de los próximos 2 meses —
  const hoy = new Date()
  const meses: Array<{ año: number; mes: number }> = []
  for (let i = 0; i < 2; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
    meses.push({ año: d.getFullYear(), mes: d.getMonth() + 1 })
  }

  const turnosParanal: Array<{ horaInicio: string; horaFin: string }> = [
    { horaInicio: "09:30", horaFin: "13:00" },
    { horaInicio: "13:30", horaFin: "17:00" },
  ]

  for (const { año, mes } of meses) {
    const fechasParanal = primerYTercerDomingo(año, mes)

    for (const fecha of fechasParanal) {
      // Solo turnos futuros
      if (fecha <= hoy) continue

      for (const t of turnosParanal) {
        const fechaDate = new Date(
          Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
        )

        const existing = await prisma.turno.findUnique({
          where: {
            observatorio_fecha_horaInicio: {
              observatorio: "PARANAL",
              fecha: fechaDate,
              horaInicio: t.horaInicio,
            },
          },
        })

        if (!existing) {
          await prisma.turno.create({
            data: {
              observatorio: "PARANAL",
              fecha: fechaDate,
              horaInicio: t.horaInicio,
              horaFin: t.horaFin,
              capacidadMax: 20,
              cuposOcupados: 0,
              activo: true,
            },
          })
          turnosCreados++
        }
      }
    }
  }

  console.log(`✓ Turnos creados: ${turnosCreados} (La Silla sábados + Paranal domingos)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
