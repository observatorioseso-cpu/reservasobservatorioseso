/**
 * Topes del chat — lib/chatLimites.ts
 *
 * Módulo sin dependencias a propósito. El widget del navegador necesita el
 * largo máximo de mensaje para topar el textarea, y si lo importara desde
 * lib/chatGuard.ts se llevaría @upstash/redis al bundle del cliente.
 */

/** Largo máximo de un mensaje individual del visitante. */
export const MAX_CHARS_MENSAJE = 1500

/** Largo máximo del historial completo que viaja al modelo. */
export const MAX_CHARS_CONVERSACION = 6000

/** Turnos de historial que se conservan. */
export const MAX_MENSAJES = 10
