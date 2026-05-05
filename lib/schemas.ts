import { z } from "zod"
import { validarDocumento } from "./documento"

// Zod v4: usar superRefine para mensajes de error dinámicos
export const documentoSchema = z
  .string()
  .min(5, "Ingresa tu RUT o número de pasaporte")
  .max(20, "El documento es demasiado largo")
  .superRefine((val, ctx) => {
    const result = validarDocumento(val)
    if (!result.valido) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error ?? "Documento inválido",
      })
    }
  })

export const documentoAcompananteSchema = z
  .string()
  .max(20)
  .regex(/^[A-Za-z0-9.\-\s]*$/, "Solo letras, números y guiones")
  .optional()
  .or(z.literal(""))

export const acompananteSchema = z.object({
  nombre: z.string().min(1, "Requerido").max(100),
  apellido: z.string().min(1, "Requerido").max(100),
  documento: documentoAcompananteSchema,
})

export const reservaSchema = z
  .object({
    turnoId: z.string().cuid("Turno inválido"),
    nombre: z.string().min(1, "Requerido").max(100),
    apellido: z.string().min(1, "Requerido").max(100),
    rutOPasaporte: documentoSchema,
    email: z.string().email("Correo inválido"),
    emailConfirm: z.string().email("Correo inválido"),
    telefono: z
      .string()
      .min(8, "Teléfono inválido")
      .max(20)
      .regex(/^[\d\s\+\-\(\)]+$/, "Solo números, espacios y +"),
    idioma: z.enum(["ES", "EN"]),
    cantidadPersonas: z
      .number()
      .int()
      .min(1, "Mínimo 1 persona")
      .max(10, "Máximo 10 personas por reserva"),
    tienesMenores: z.boolean().default(false),
    recibirWhatsapp: z.boolean().default(false),
    whatsappOptIn: z.boolean().default(false),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100),
    locale: z.enum(["es", "en"]).default("es"),
    acompanantes: z.array(acompananteSchema).max(9).default([]),
  })
  .refine((data) => data.email === data.emailConfirm, {
    message: "Los correos no coinciden",
    path: ["emailConfirm"],
  })
  .refine(
    (data) => data.acompanantes.length === data.cantidadPersonas - 1,
    {
      message: "El número de acompañantes no coincide con la cantidad de personas",
      path: ["acompanantes"],
    }
  )
  .refine(
    (data) => !data.recibirWhatsapp || data.whatsappOptIn,
    {
      message: "Debes aceptar el opt-in de WhatsApp para recibir mensajes por ese canal",
      path: ["whatsappOptIn"],
    }
  )

export type ReservaInput = z.infer<typeof reservaSchema>

// ---------------------------------------------------------------------------
// Esquema de modificación de acompañantes desde el portal cliente (Opción 3)
// ---------------------------------------------------------------------------

/**
 * El cliente envía la lista COMPLETA y actualizada de acompañantes.
 * El servidor calcula el delta y ajusta cuposOcupados en la misma transacción.
 *
 * Reglas validadas aquí (el servidor también verifica cupos y ventana temporal):
 * - Lista de 0 a 9 acompañantes (titular no está incluido)
 * - Total de personas = acompanantes.length + 1 ≤ 10
 * - Auth: password del titular requerida en el body
 */
export const modificacionAcompanantesSchema = z.object({
  password: z.string().min(1, "Contraseña requerida"),
  acompanantes: z
    .array(acompananteSchema)
    .min(0)
    .max(9, "Máximo 9 acompañantes (10 personas en total con el titular)"),
})

export type ModificacionAcompanantesInput = z.infer<typeof modificacionAcompanantesSchema>
