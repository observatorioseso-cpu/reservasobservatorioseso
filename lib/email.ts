import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  console.warn("[email] RESEND_API_KEY no configurada — emails desactivados")
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_STUB")

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "ESO Chile <reservas@observatorioseso.cl>"
export const EMAIL_CONTACTO = "reservas@observatorioseso.cl"
