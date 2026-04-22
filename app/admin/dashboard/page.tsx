import type { Metadata } from "next"
import { cookies } from "next/headers"
import { CheckCircle2, Clock, XCircle, Users, CalendarDays } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { verifyAdminToken } from "@/lib/adminAuth"
import { AdminShell } from "@/components/admin/AdminShell"

export const metadata: Metadata = { title: "Dashboard" }

// Revalidate every 60 s so stats stay reasonably fresh without being stale
export const revalidate = 60

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day:      "2-digit",
  month:    "long",
  year:     "numeric",
})

const fmtShort = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day:      "2-digit",
  month:    "2-digit",
  year:     "numeric",
})

function startOfTodaySantiago(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const y = parts.find((p) => p.type === "year")!.value
  const m = parts.find((p) => p.type === "month")!.value
  const d = parts.find((p) => p.type === "day")!.value
  return new Date(`${y}-${m}-${d}T00:00:00.000Z`)
}

function startOfMonthSantiago(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now)
  const y = parts.find((p) => p.type === "year")!.value
  const m = parts.find((p) => p.type === "month")!.value
  return new Date(`${y}-${m}-01T00:00:00.000Z`)
}

function pct(occupied: number, capacity: number): string {
  if (capacity === 0) return "—"
  return `${Math.round((occupied / capacity) * 100)}%`
}

const OBS_LABEL: Record<string, string> = {
  LA_SILLA: "La Silla",
  PARANAL:  "Paranal",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  // ── Auth ────────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const token       = cookieStore.get("eso_admin_session")?.value
  const session     = token ? verifyAdminToken(token) : null

  // ── Date boundaries ─────────────────────────────────────────────────────
  const today        = startOfTodaySantiago()
  const startOfMonth = startOfMonthSantiago()

  // ── DB queries (parallel) ───────────────────────────────────────────────
  const [
    confirmadasTotal,
    pendientesTotal,
    anuladasMes,
    cuposMes,
    turnosProximos,
    reservasHoy,
  ] = await Promise.all([
    // 1. Total CONFIRMADAS (all time)
    prisma.reserva.count({ where: { estado: "CONFIRMADA" } }),

    // 2. Total PENDIENTES (all time)
    prisma.reserva.count({ where: { estado: "PENDIENTE_CONFIRMACION" } }),

    // 3. ANULADAS este mes
    prisma.reserva.count({
      where: {
        estado:    "ANULADA",
        createdAt: { gte: startOfMonth },
      },
    }),

    // 4. Cupos reservados (cantidadPersonas) de turnos que ocurren este mes
    prisma.reserva.aggregate({
      _sum: { cantidadPersonas: true },
      where: {
        estado: { in: ["CONFIRMADA", "PENDIENTE_CONFIRMACION"] },
        turno:  { fecha: { gte: startOfMonth } },
      },
    }),

    // 5. Próximos 5 turnos activos
    prisma.turno.findMany({
      where:   { fecha: { gte: today }, activo: true },
      orderBy: { fecha: "asc" },
      take:    5,
    }),

    // 6. Reservas del día (conteo simple)
    prisma.reserva.count({
      where: {
        estado: { in: ["CONFIRMADA", "PENDIENTE_CONFIRMACION"] },
        turno:  { fecha: { gte: today, lt: new Date(today.getTime() + 86_400_000) } },
      },
    }),
  ])

  const cuposReservadosMes = cuposMes._sum.cantidadPersonas ?? 0

  // ── Stat cards config ───────────────────────────────────────────────────
  const stats = [
    {
      label:     "Reservas confirmadas",
      value:     confirmadasTotal.toLocaleString("es-CL"),
      icon:      CheckCircle2,
      iconClass: "text-green-400 bg-green-400/10",
      borderClass: "border-green-500/20",
    },
    {
      label:     "Pendientes de confirmación",
      value:     pendientesTotal.toLocaleString("es-CL"),
      icon:      Clock,
      iconClass: "text-amber-400 bg-amber-400/10",
      borderClass: "border-amber-500/20",
    },
    {
      label:     "Anuladas este mes",
      value:     anuladasMes.toLocaleString("es-CL"),
      icon:      XCircle,
      iconClass: "text-stone-400 bg-stone-400/10",
      borderClass: "border-stone-600/40",
    },
    {
      label:     "Cupos reservados este mes",
      value:     cuposReservadosMes.toLocaleString("es-CL"),
      icon:      Users,
      iconClass: "text-sky-400 bg-sky-400/10",
      borderClass: "border-sky-500/20",
    },
  ] as const

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* ── Welcome ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-stone-100">
            Bienvenido, {session?.email ?? "Admin"}
          </h2>
          <p className="text-sm text-stone-400">
            {fmt.format(new Date())} — {reservasHoy} reserva{reservasHoy !== 1 ? "s" : ""} activa{reservasHoy !== 1 ? "s" : ""} hoy
          </p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, iconClass, borderClass }) => (
            <div
              key={label}
              className={`rounded-xl border ${borderClass} bg-stone-800 p-5 space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-400">{label}</span>
                <span className={`inline-flex size-9 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-stone-100">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Upcoming turns table ─────────────────────────────────────── */}
        <section aria-labelledby="upcoming-heading">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="size-5 text-amber-500" aria-hidden="true" />
            <h2 id="upcoming-heading" className="text-base font-semibold text-stone-100">
              Próximos turnos
            </h2>
          </div>

          {turnosProximos.length === 0 ? (
            <p className="text-sm text-stone-500">No hay turnos activos próximos.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className="w-full min-w-[640px] text-sm" role="table">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900">
                    {["Observatorio", "Fecha", "Horario", "Capacidad", "Cupos ocupados", "Ocupación"].map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {turnosProximos.map((turno, idx) => {
                    const ocupacion = pct(turno.cuposOcupados, turno.capacidadMax)
                    const pctNum    = turno.capacidadMax > 0
                      ? Math.round((turno.cuposOcupados / turno.capacidadMax) * 100)
                      : 0
                    const fillColor =
                      pctNum >= 90 ? "bg-red-500"   :
                      pctNum >= 70 ? "bg-amber-500" :
                                     "bg-green-500"

                    return (
                      <tr
                        key={turno.id}
                        className={[
                          "border-b border-stone-800 transition-colors hover:bg-stone-800/60",
                          idx % 2 === 0 ? "bg-stone-950/40" : "bg-stone-900/40",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-medium text-stone-200">
                          {OBS_LABEL[turno.observatorio] ?? turno.observatorio}
                        </td>
                        <td className="px-4 py-3 text-stone-300">
                          {fmtShort.format(new Date(turno.fecha))}
                        </td>
                        <td className="px-4 py-3 text-stone-300">
                          {turno.horaInicio} – {turno.horaFin}
                        </td>
                        <td className="px-4 py-3 text-stone-300">
                          {turno.capacidadMax}
                        </td>
                        <td className="px-4 py-3 text-stone-300">
                          {turno.cuposOcupados}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Progress bar */}
                            <div
                              className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-700"
                              role="progressbar"
                              aria-valuenow={pctNum}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${pctNum}% de capacidad ocupada`}
                            >
                              <div
                                className={`h-full rounded-full ${fillColor} transition-all`}
                                style={{ width: `${pctNum}%` }}
                              />
                            </div>
                            <span className="w-8 text-right tabular-nums text-stone-400">
                              {ocupacion}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  )
}
