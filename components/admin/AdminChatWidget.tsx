"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, X, Send, Loader2, Bot, RotateCcw } from "lucide-react"
import { useAdminTheme } from "@/contexts/adminTheme"

interface Message {
  role: "user" | "assistant"
  content: string
}

const PAGE_CHIPS: Record<string, string[]> = {
  "/admin/dashboard":  ["¿Cómo interpreto las métricas?", "¿Qué hacer si hay pocas confirmaciones?", "Resumen del flujo de reservas"],
  "/admin/turnos":     ["¿Cómo creo un turno para el 30 de mayo?", "¿Qué turnos crea el cron automático?", "Horarios La Silla vs Paranal"],
  "/admin/reservas":   ["¿Cómo confirmo una reserva manualmente?", "¿Cuándo se anulan reservas automáticamente?", "¿Cómo cancelo con notificación?"],
  "/admin/reportes":   ["¿Cómo exporto a Excel?", "¿Qué es la tasa de confirmación?", "Cómo medir asistencia real"],
  "/admin/mensajes":   ["¿Cómo respondo un mensaje?", "¿Qué hacer con grupos grandes?", "Mensajes sin responder"],
  "/admin/bloqueos":   ["¿Cómo bloqueo una fecha?", "¿Cómo envío alerta de emergencia?", "Diferencia bloqueo vs cancelación"],
  "/admin/backup":     ["¿Qué incluye el backup?", "¿Con qué frecuencia hacer backup?", "Cómo restaurar datos"],
  "/admin/config":     ["¿Cuándo cambiar MAX_PERSONAS_CLIENTE a 10?", "¿Qué hace HORA_CIERRE_VIERNES?", "Activar WhatsApp"],
}

const DEFAULT_CHIPS = [
  "¿Cómo funciona el sistema?",
  "Reglas de negocio clave",
  "Contacto y escalación",
]

function getChips(pathname: string): string[] {
  for (const [prefix, chips] of Object.entries(PAGE_CHIPS)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return chips
  }
  return DEFAULT_CHIPS
}

function getPageLabel(pathname: string): string {
  const labels: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/turnos":    "Turnos",
    "/admin/reservas":  "Reservas",
    "/admin/reportes":  "Reportes",
    "/admin/mensajes":  "Mensajes",
    "/admin/bloqueos":  "Cierres",
    "/admin/backup":    "Backup",
    "/admin/config":    "Config",
  }
  for (const [key, label] of Object.entries(labels)) {
    if (pathname === key || pathname.startsWith(key + "/")) return label
  }
  return "Admin"
}

export function AdminChatWidget() {
  const pathname = usePathname()
  const { theme } = useAdminTheme()
  const isLight = theme === "light"

  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  const chips = getChips(pathname ?? "")
  const page  = getPageLabel(pathname ?? "")

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: "user", content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, page }),
        signal: ctrl.signal,
        credentials: "same-origin",
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages(prev => [...prev, { role: "assistant", content: err.error ?? "Error al conectar con el asistente." }])
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      let assistantText = ""
      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              assistantText += parsed.delta.text
              setMessages(prev => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: "assistant", content: assistantText }
                return copy
              })
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: "assistant", content: "Error de conexión. Por favor intenta de nuevo." }
        return copy
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [messages, streaming, page])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setMessages([])
    setStreaming(false)
    setInput("")
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  const bubble = isLight
    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200/50"
    : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/40"

  const panel = isLight
    ? "bg-[#fdfaf2] border border-[#e4d0b8] shadow-2xl shadow-tinta-900/10"
    : "bg-stone-900 border border-stone-700 shadow-2xl shadow-black/40"

  const headerBg = isLight
    ? "bg-gradient-to-r from-[#f7edd8] to-[#f0e4d0] border-b border-[#e4d0b8]"
    : "bg-stone-800 border-b border-stone-700"

  const headerText = isLight ? "text-tinta-900" : "text-stone-100"
  const subText    = isLight ? "text-tinta-600" : "text-stone-400"

  const msgArea = isLight ? "bg-[#faf4e8]" : "bg-stone-950/40"

  const userBubble = isLight
    ? "bg-amber-500 text-white ml-auto"
    : "bg-amber-500 text-white ml-auto"

  const aiBubble = isLight
    ? "bg-white border border-[#e4d0b8] text-tinta-800"
    : "bg-stone-800 border border-stone-700 text-stone-200"

  const chipClass = isLight
    ? "border border-[#d4b896] bg-[#f5edd8] text-tinta-700 hover:bg-[#ede0c4] hover:text-tinta-900"
    : "border border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-stone-100"

  const inputClass = isLight
    ? "bg-white border border-[#d4b896] text-tinta-900 placeholder:text-tinta-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
    : "bg-stone-800 border border-stone-600 text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"

  const sendBtn = streaming
    ? "opacity-40 cursor-not-allowed bg-amber-500 text-white"
    : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"

  const resetBtn = isLight
    ? "text-tinta-400 hover:text-tinta-700"
    : "text-stone-500 hover:text-stone-300"

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente Astra"
          className={[
            "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
            bubble,
          ].join(" ")}
        >
          <Bot className="size-6" aria-hidden="true" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={[
            "fixed bottom-6 right-6 z-50 flex w-[360px] flex-col rounded-2xl overflow-hidden",
            "max-h-[calc(100dvh-3rem)]",
            panel,
          ].join(" ")}
          role="dialog"
          aria-label="Asistente Astra"
          aria-modal="false"
        >
          {/* Header */}
          <div className={["flex items-center gap-3 px-4 py-3 shrink-0", headerBg].join(" ")}>
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500 shrink-0">
              <Bot className="size-4 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={["text-sm font-semibold leading-tight", headerText].join(" ")}>Astra</p>
              <p className={["text-xs leading-tight", subText].join(" ")}>
                Asistente · {page}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  title="Nueva conversación"
                  className={["rounded p-1.5 transition-colors", resetBtn].join(" ")}
                  aria-label="Nueva conversación"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                className={["rounded p-1.5 transition-colors", resetBtn].join(" ")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={["flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]", msgArea].join(" ")}>
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className={["text-xs font-medium", subText].join(" ")}>
                  Sugerencias para {page}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {chips.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => sendMessage(chip)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors text-left",
                        chipClass,
                      ].join(" ")}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user" ? userBubble : aiBubble,
                  msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm",
                ].join(" ")}
              >
                {msg.content || (
                  msg.role === "assistant" && streaming && i === messages.length - 1
                    ? <Loader2 className="size-4 animate-spin opacity-60" aria-hidden="true" />
                    : null
                )}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={["shrink-0 border-t p-3", isLight ? "border-[#e4d0b8] bg-[#fdfaf2]" : "border-stone-700 bg-stone-900"].join(" ")}>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta algo…"
                aria-label="Mensaje al asistente"
                disabled={streaming}
                className={[
                  "flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-colors max-h-32",
                  inputClass,
                  streaming ? "opacity-60" : "",
                ].join(" ")}
                style={{ lineHeight: "1.4" }}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={streaming || !input.trim()}
                aria-label="Enviar mensaje"
                className={[
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  sendBtn,
                ].join(" ")}
              >
                {streaming
                  ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  : <Send className="size-4" aria-hidden="true" />
                }
              </button>
            </div>
            <p className={["mt-1.5 text-center text-[10px]", subText].join(" ")}>
              Enter para enviar · Shift+Enter para saltar línea
            </p>
          </div>
        </div>
      )}
    </>
  )
}
