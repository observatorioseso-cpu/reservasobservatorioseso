import { Resend } from "resend"

// Usar || en lugar de ?? para capturar strings vacíos (env vars vacías en el build)
const resendKey = process.env.RESEND_API_KEY || "re_disabled_stub_0000000000"

if (!process.env.RESEND_API_KEY) {
  console.warn("[email] RESEND_API_KEY no configurada — emails desactivados")
}

export const resend = new Resend(resendKey)

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "ESO Chile <reservas@observatorioseso.cl>"
export const EMAIL_CONTACTO = "reservas@observatorioseso.cl"
