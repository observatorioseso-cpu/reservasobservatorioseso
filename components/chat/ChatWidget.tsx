"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Mensaje {
  role: "user" | "assistant"
  content: string
}

const MENSAJE_INICIAL: Mensaje = {
  role: "assistant",
  content:
    "Hola. Soy el asistente de ESO Chile. Puedo ayudarte con reservas, horarios, cómo llegar y preguntas sobre los observatorios. ¿En qué puedo ayudarte?",
}

export function ChatWidget() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()

  // No mostrar el widget en páginas de admin
  const esAdmin = pathname?.includes("/admin")
  if (esAdmin) return null

  // Mostrar mensaje inicial la primera vez que se abre
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([MENSAJE_INICIAL])
    }
  }, [abierto, mensajes.length])

  // Scroll automático al último mensaje
  useEffect(() => {
    if (abierto) {
      mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [mensajes, abierto])

  // Focus en el input al abrir
  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [abierto])

  const enviar = useCallback(async () => {
    if (!input.trim() || cargando) return

    const userMsg: Mensaje = { role: "user", content: input.trim() }
    const nuevosMensajes = [...mensajes, userMsg]
    setMensajes(nuevosMensajes)
    setInput("")
    setCargando(true)

    // Agregar placeholder de assistant mientras carga
    setMensajes([...nuevosMensajes, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nuevosMensajes, locale: "es" }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Error HTTP ${res.status}`)
      }

      // Leer stream SSE del SDK de Anthropic
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let respuesta = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (
                data.type === "content_block_delta" &&
                data.delta?.type === "text_delta"
              ) {
                respuesta += data.delta.text
                setMensajes([
                  ...nuevosMensajes,
                  { role: "assistant", content: respuesta },
                ])
              }
            } catch {
              // ignorar líneas no parseables (ping, etc.)
            }
          }
        }
      }

      // Si no se recibió contenido, mostrar error genérico
      if (!respuesta) {
        setMensajes([
          ...nuevosMensajes,
          {
            role: "assistant",
            content: "Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.",
          },
        ])
      }
    } catch {
      setMensajes([
        ...nuevosMensajes,
        {
          role: "assistant",
          content:
            "Lo siento, ocurrió un error al conectar. Por favor intenta de nuevo o escríbenos a reservas@observatorioseso.cl",
        },
      ])
    } finally {
      setCargando(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, cargando, mensajes])

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <>
      {/* Panel de chat */}
      {abierto && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50",
            "w-80 sm:w-80",
            "w-[calc(100vw-2rem)] sm:w-80",
            "h-96",
            "bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden",
          )}
          role="dialog"
          aria-label="Asistente ESO"
          aria-modal="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 bg-stone-900 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-stone-100 font-franklin">
                Asistente ESO
              </span>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-stone-400 hover:text-stone-100 transition-colors rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              aria-label="Cerrar asistente"
            >
              <X size={16} />
            </button>
          </div>

          {/* Lista de mensajes */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth"
            aria-live="polite"
            aria-atomic="false"
          >
            {mensajes.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-amber-500/10 text-stone-100 border border-amber-500/20"
                      : "bg-stone-800 text-stone-100",
                  )}
                >
                  {msg.content === "" && cargando ? (
                    <span
                      className="inline-flex gap-1 items-center text-stone-400"
                      aria-label="El asistente está escribiendo"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={mensajesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-stone-700 bg-stone-900 rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={manejarKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                disabled={cargando}
                className={cn(
                  "flex-1 resize-none rounded-xl px-3 py-2 text-sm",
                  "bg-stone-800 text-stone-100 placeholder-stone-500",
                  "border border-stone-700 focus:border-amber-500/50",
                  "focus:outline-none focus:ring-1 focus:ring-amber-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "max-h-28 overflow-y-auto",
                  "font-franklin leading-relaxed",
                )}
                style={{ minHeight: "2.5rem" }}
                aria-label="Mensaje para el asistente"
              />
              <button
                onClick={enviar}
                disabled={!input.trim() || cargando}
                className={cn(
                  "flex-shrink-0 p-2 rounded-xl transition-colors",
                  "bg-amber-500 text-stone-950 hover:bg-amber-400",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                )}
                aria-label="Enviar mensaje"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-stone-600 mt-1.5 text-center">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto((prev) => !prev)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "bg-amber-500 text-stone-950 hover:bg-amber-400",
          "flex items-center justify-center",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950",
          abierto && "rotate-0",
        )}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente ESO"}
        aria-expanded={abierto}
        aria-haspopup="dialog"
      >
        {abierto ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
