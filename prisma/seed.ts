import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Configuración del sistema — valores iniciales operacionales
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
      update: {},          // no sobreescribir si ya existe (puede haber sido cambiado por admin)
      create: item,
    })
  }

  console.log(`✓ ConfigSistema: ${config.length} valores inicializados`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
