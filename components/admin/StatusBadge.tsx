import { Clock, CheckCircle2, XCircle } from "lucide-react"

type EstadoReserva = "PENDIENTE_CONFIRMACION" | "CONFIRMADA" | "ANULADA"

interface StatusBadgeProps {
  estado: EstadoReserva
}

const CONFIG: Record<
  EstadoReserva,
  { label: string; icon: React.ElementType; className: string }
> = {
  PENDIENTE_CONFIRMACION: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
  },
  CONFIRMADA: {
    label: "Confirmada",
    icon: CheckCircle2,
    className: "bg-green-400/10 text-green-400 ring-green-400/20",
  },
  ANULADA: {
    label: "Anulada",
    icon: XCircle,
    className: "bg-stone-400/10 text-stone-400 ring-stone-400/20",
  },
}

export function StatusBadge({ estado }: StatusBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[estado]
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      ].join(" ")}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  )
}
