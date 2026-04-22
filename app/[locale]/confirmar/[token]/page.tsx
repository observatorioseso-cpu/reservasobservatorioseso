import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { formatearFechaLimite } from "@/lib/confirmacion"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Confirma tu reserva",
  robots: { index: false },
}

export default async function ConfirmacionPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const t = await getTranslations("confirmacion")

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: { turno: true },
  })

  if (!reserva) notFound()

  const fechaLimite = formatearFechaLimite(
    reserva.fechaLimiteConfirmacion,
    locale as "es" | "en"
  )

  const nombreObs =
    reserva.observatorio === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
  const tokenCorto = reserva.token.slice(0, 8).toUpperCase()

  return (
    <main className="min-h-[100dvh] bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full rounded-2xl border border-stone-800 bg-stone-900 p-8">
        <p className="text-amber-500 text-sm font-medium uppercase tracking-widest mb-3">
          {t("bookingNumber")}: {tokenCorto}
        </p>

        <h1 className="font-playfair text-3xl font-bold text-stone-100 mb-2">
          {t("title")}
        </h1>

        <p className="text-stone-400 mb-6">{t("subtitle")}</p>

        <div className="border border-stone-700 rounded-lg p-4 bg-stone-800 mb-6 text-sm text-stone-300">
          <p className="font-medium text-stone-100">{nombreObs}</p>
          <p>{reserva.turno.fecha.toISOString().split("T")[0]}</p>
          <p>
            {reserva.turno.horaInicio} – {reserva.turno.horaFin}
          </p>
          <p className="mt-2 text-stone-100">
            {reserva.nombre} {reserva.apellido}
          </p>
          <p>{reserva.cantidadPersonas} persona{reserva.cantidadPersonas !== 1 ? "s" : ""}</p>
        </div>

        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 mb-6">
          <p className="text-amber-400 text-sm">
            {t("deadline", { fecha: fechaLimite })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/56XXXXXXXXX?text=Confirmo+mi+reserva+%23${tokenCorto}+para+el+${reserva.turno.fecha.toISOString().split("T")[0]}+en+${nombreObs}`}
            className="block text-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("confirmWhatsapp")}
          </a>
          <a
            href={`/${locale}/mi-reserva/${token}`}
            className="block text-center rounded-lg bg-sky-500/20 border border-sky-500/40 hover:bg-sky-500/30 text-sky-300 font-medium px-6 py-3 transition-colors"
          >
            {t("confirmPortal")}
          </a>
          <a
            href={`mailto:reservas@observatorioseso.cl?subject=Confirmo+reserva+${tokenCorto}`}
            className="block text-center rounded-lg border border-stone-700 hover:border-stone-500 text-stone-400 px-6 py-3 transition-colors text-sm"
          >
            {t("confirmEmail")}
          </a>
        </div>
      </div>
    </main>
  )
}
