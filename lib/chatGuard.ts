/**
 * Guardas del endpoint de chat — lib/chatGuard.ts
 *
 * Cada turno del chat llama a Sonnet, así que un endpoint sin freno es una
 * factura sin freno. Tres capas, en este orden de importancia:
 *
 * 1. Tamaño del payload. Es la palanca más cara y la más barata de cerrar: sin
 *    tope, un único POST con 2 MB de historial vale más de un dólar en tokens
 *    de entrada. El límite de peticiones no sirve de nada si cada petición
 *    puede costar lo que quiera el atacante.
 * 2. Límite por IP. Frena al bot ingenuo que reintenta desde una sola dirección.
 * 3. Techo diario global. Frena al ataque distribuido, que es el único capaz de
 *    vaciar la tarjeta en una noche.
 *
 * Si Redis no responde, las capas 2 y 3 caen a un contador en memoria del
 * propio proceso. Cada instancia serverless lleva su propia cuenta, así que
 * protege menos que Redis. Sigue acotando el daño, que es lo que importa
 * cuando la alternativa es no tener ningún tope.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import {
  MAX_CHARS_MENSAJE,
  MAX_CHARS_CONVERSACION,
  MAX_MENSAJES,
} from "@/lib/chatLimites"

export { MAX_CHARS_MENSAJE, MAX_CHARS_CONVERSACION, MAX_MENSAJES }

// ---------------------------------------------------------------------------
// Topes de frecuencia
// ---------------------------------------------------------------------------

/** Mensajes por IP en la ventana corta. Cubre una conversación normal. */
const IP_POR_VENTANA = 12
const IP_VENTANA = "5 m"
const IP_VENTANA_MS = 5 * 60 * 1000

/** Mensajes por IP en un día. */
const IP_POR_DIA = 60
const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Techo diario de turnos para todo el sitio.
 *
 * El uso normal ronda los 30 turnos diarios. 250 deja ocho veces de holgura y
 * acota el peor día imaginable a unos pocos dólares.
 */
const LIMITE_DIARIO_GLOBAL = Math.max(
  50,
  Number(process.env.CHAT_LIMITE_DIARIO_GLOBAL) || 250
)

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface MensajeChat {
  role: "user" | "assistant"
  content: string
}

export type Veredicto =
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfter?: number }

// ---------------------------------------------------------------------------
// Rate limiters (init perezoso, compartido entre invocaciones tibias)
// ---------------------------------------------------------------------------

let limitadorIp: Ratelimit | null = null
let limitadorIpDia: Ratelimit | null = null
let limitadorGlobal: Ratelimit | null = null
let redisResuelto = false

function hayRedis(): boolean {
  if (redisResuelto) return limitadorIp !== null
  redisResuelto = true
  try {
    const redis = Redis.fromEnv()
    limitadorIp = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(IP_POR_VENTANA, IP_VENTANA),
      analytics: false,
      prefix: "chat:ip",
    })
    limitadorIpDia = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(IP_POR_DIA, "24 h"),
      analytics: false,
      prefix: "chat:ip:dia",
    })
    limitadorGlobal = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(LIMITE_DIARIO_GLOBAL, "24 h"),
      analytics: false,
      prefix: "chat:global",
    })
    return true
  } catch {
    limitadorIp = null
    limitadorIpDia = null
    limitadorGlobal = null
    return false
  }
}

// ---------------------------------------------------------------------------
// Contador de respaldo en memoria
// ---------------------------------------------------------------------------

const memoria = new Map<string, { conteo: number; expira: number }>()

function podar(ahora: number): void {
  if (memoria.size < 5000) return
  for (const [clave, valor] of memoria) {
    if (valor.expira <= ahora) memoria.delete(clave)
  }
}

/** Devuelve true si la petición cabe dentro del tope. */
function contarEnMemoria(clave: string, tope: number, ventanaMs: number): boolean {
  const ahora = Date.now()
  podar(ahora)

  const actual = memoria.get(clave)
  if (!actual || actual.expira <= ahora) {
    memoria.set(clave, { conteo: 1, expira: ahora + ventanaMs })
    return true
  }
  if (actual.conteo >= tope) return false
  actual.conteo += 1
  return true
}

// ---------------------------------------------------------------------------
// IP del cliente
// ---------------------------------------------------------------------------

export function extraerIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida"
  )
}

// ---------------------------------------------------------------------------
// Capa 1 — forma y tamaño del payload
// ---------------------------------------------------------------------------

/**
 * Valida la lista de mensajes y devuelve el historial recortado y listo para
 * el modelo: solo roles válidos, arrancando en un mensaje de usuario, con el
 * largo acotado por mensaje y en total.
 */
export function prepararHistorial(
  bruto: unknown,
  opciones: { maxMensajes?: number; maxCharsConversacion?: number } = {}
):
  | { ok: true; mensajes: MensajeChat[] }
  | { ok: false; status: number; error: string } {
  const maxMensajes = opciones.maxMensajes ?? MAX_MENSAJES
  const maxCharsConversacion = opciones.maxCharsConversacion ?? MAX_CHARS_CONVERSACION

  if (!Array.isArray(bruto) || bruto.length === 0) {
    return { ok: false, status: 400, error: "messages requerido" }
  }

  // Un historial larguísimo se descarta antes de recorrerlo entero.
  if (bruto.length > 100) {
    return { ok: false, status: 413, error: "Historial demasiado largo" }
  }

  const limpios: MensajeChat[] = []
  for (const item of bruto) {
    if (typeof item !== "object" || item === null) continue
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (role !== "user" && role !== "assistant") continue
    if (typeof content !== "string") continue

    const texto = content.trim()
    if (texto.length === 0) continue
    if (texto.length > MAX_CHARS_MENSAJE) {
      return {
        ok: false,
        status: 413,
        error: `Cada mensaje admite hasta ${MAX_CHARS_MENSAJE} caracteres.`,
      }
    }
    limpios.push({ role, content: texto })
  }

  const ultimos = limpios.slice(-maxMensajes)

  // El historial tiene que empezar en un mensaje de usuario: el saludo inicial
  // del asistente lo inyecta el cliente y la API lo rechaza como primer turno.
  const primerUsuario = ultimos.findIndex((m) => m.role === "user")
  if (primerUsuario === -1) {
    return {
      ok: false,
      status: 400,
      error: "Se requiere al menos un mensaje de usuario",
    }
  }
  const historial = ultimos.slice(primerUsuario)

  // Tope acumulado: se recortan los turnos más antiguos hasta caber, nunca el
  // último mensaje del visitante, que es el que le da sentido a la respuesta.
  let total = historial.reduce((suma, m) => suma + m.content.length, 0)
  while (total > maxCharsConversacion && historial.length > 1) {
    total -= historial[0].content.length
    historial.shift()
  }
  if (historial[0]?.role === "assistant") historial.shift()
  if (historial.length === 0 || total > maxCharsConversacion) {
    return {
      ok: false,
      status: 413,
      error: "La conversación es demasiado larga. Empieza una nueva.",
    }
  }

  return { ok: true, mensajes: historial }
}

// ---------------------------------------------------------------------------
// Capas 2 y 3 — frecuencia
// ---------------------------------------------------------------------------

const MENSAJE_LENTO = "Vas muy rápido. Espera un momento antes de escribir de nuevo."

const MENSAJE_CUOTA_DIARIA =
  "Alcanzaste el máximo de mensajes por hoy. Escríbenos a reservas@observatorioseso.cl."

const MENSAJE_SATURADO =
  "El asistente recibió muchas consultas hoy. Escríbenos a reservas@observatorioseso.cl y te respondemos."

function segundosHasta(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000))
}

export async function revisarLimites(ip: string): Promise<Veredicto> {
  if (!hayRedis()) {
    // Sin Redis, cada instancia cuenta lo suyo. Ventanas más estrictas para
    // compensar que el atacante puede repartirse entre varias instancias.
    if (!contarEnMemoria(`ip:${ip}`, IP_POR_VENTANA, IP_VENTANA_MS)) {
      return { ok: false, status: 429, error: MENSAJE_LENTO, retryAfter: 60 }
    }
    if (!contarEnMemoria("global", LIMITE_DIARIO_GLOBAL, DIA_MS)) {
      return { ok: false, status: 429, error: MENSAJE_SATURADO, retryAfter: 3600 }
    }
    return { ok: true }
  }

  const porIp = await limitadorIp!.limit(ip)
  if (!porIp.success) {
    return {
      ok: false,
      status: 429,
      error: MENSAJE_LENTO,
      retryAfter: segundosHasta(porIp.reset),
    }
  }

  const porDia = await limitadorIpDia!.limit(ip)
  if (!porDia.success) {
    return {
      ok: false,
      status: 429,
      error: MENSAJE_CUOTA_DIARIA,
      retryAfter: segundosHasta(porDia.reset),
    }
  }

  const global = await limitadorGlobal!.limit("todos")
  if (!global.success) {
    console.error(
      `[chat] techo diario global alcanzado (${LIMITE_DIARIO_GLOBAL} turnos). Última IP: ${ip}`
    )
    return {
      ok: false,
      status: 429,
      error: MENSAJE_SATURADO,
      retryAfter: segundosHasta(global.reset),
    }
  }

  return { ok: true }
}
