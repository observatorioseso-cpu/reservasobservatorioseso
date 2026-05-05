"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, MapPin, Users } from "lucide-react"

interface ReservaResumen {
  shortId: string
  observatorio: string
  fecha: string
  turno: string
  personas: number
}

/**
 * Muestra un resumen visual de la reserva recién creada.
 * Lee los datos de sessionStorage que el formulario guardó antes de redirigir.
 * Si no hay datos (acceso directo a /exito), el componente no renderiza nada.
 */
export function ExitoSummary() {
  const [reserva, setReserva] = useState<ReservaResumen | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("reserva_exito")
      if (raw) {
        setReserva(JSON.parse(raw))
        sessionStorage.removeItem("reserva_exito")
      }
    } catch {
      // sessionStorage inaccesible (modo privado extremo, etc.)
    }
  }, [])

  if (!reserva) return null

  return (
    <div className="mb-8 rounded-2xl border border-stone-700 bg-stone-900/60 p-6 text-left">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
          {reserva.shortId}
        </span>
        <span className="text-xs text-stone-500">Código de reserva</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-2.5">
          <MapPin className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-stone-400 text-xs mb-0.5">Observatorio</p>
            <p className="text-stone-100 font-medium">{reserva.observatorio}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CalendarCheck className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-stone-400 text-xs mb-0.5">Fecha y turno</p>
            <p className="text-stone-100 font-medium">{reserva.fecha}</p>
            <p className="text-stone-400 text-xs">{reserva.turno}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Users className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-stone-400 text-xs mb-0.5">Personas</p>
            <p className="text-stone-100 font-medium">{reserva.personas}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
