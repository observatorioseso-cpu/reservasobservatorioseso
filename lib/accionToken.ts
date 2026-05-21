/**
 * HMAC-signed one-click action URLs for email buttons.
 *
 * The URL encodes: reservaToken + action + expiry.
 * The HMAC prevents forgery; expiry prevents reuse after the TTL.
 * Actions are idempotent on the DB side (already CONFIRMADA / ANULADA = graceful redirect).
 */

import { createHmac, timingSafeEqual } from "crypto"

export type AccionEmail = "confirmar" | "anular" | "extender"

const VALID_ACCIONES: AccionEmail[] = ["confirmar", "anular", "extender"]

function getSecret(): string {
  const s = process.env.CRON_SECRET ?? process.env.ACTION_TOKEN_SECRET
  if (!s) {
    console.warn("[accionToken] ni CRON_SECRET ni ACTION_TOKEN_SECRET están configurados")
    return "dev-secret-insecure-do-not-use-in-production"
  }
  return s
}

/**
 * Generates a signed one-click action URL for an email button.
 * @param baseUrl    e.g. "https://nuevo.observatorioseso.cl"
 * @param reservaToken  the reservation's UUID token
 * @param accion     "confirmar" | "anular"
 * @param locale     "es" | "en"
 * @param ttlSeconds time-to-live in seconds (default: 30h)
 */
export function generarUrlAccion(
  baseUrl: string,
  reservaToken: string,
  accion: AccionEmail,
  locale: "es" | "en",
  ttlSeconds = 30 * 3600
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload = `${reservaToken}:${accion}:${exp}`
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex")
  const url = new URL(`/api/reservas/${reservaToken}/accion`, baseUrl)
  url.searchParams.set("a", accion)
  url.searchParams.set("exp", String(exp))
  url.searchParams.set("sig", sig)
  url.searchParams.set("l", locale)
  return url.toString()
}

export type VerificacionResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" }

/**
 * Verifies a signed action token.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verificarAccionToken(
  reservaToken: string,
  accion: string,
  exp: string,
  sig: string
): VerificacionResult {
  if (!VALID_ACCIONES.includes(accion as AccionEmail)) {
    return { ok: false, reason: "invalid" }
  }

  const expNum = parseInt(exp, 10)
  if (isNaN(expNum) || expNum <= 0) return { ok: false, reason: "invalid" }

  const now = Math.floor(Date.now() / 1000)
  if (now > expNum) return { ok: false, reason: "expired" }

  const payload = `${reservaToken}:${accion}:${expNum}`
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex")

  try {
    const sigBuf = Buffer.from(sig, "hex")
    const expBuf = Buffer.from(expected, "hex")
    if (sigBuf.length !== expBuf.length) return { ok: false, reason: "invalid" }
    if (!timingSafeEqual(sigBuf, expBuf)) return { ok: false, reason: "invalid" }
  } catch {
    return { ok: false, reason: "invalid" }
  }

  return { ok: true }
}
