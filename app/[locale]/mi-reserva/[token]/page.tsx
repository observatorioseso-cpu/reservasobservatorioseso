import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { formatearFechaLimite } from "@/lib/confirmacion"
import type { Metadata } from "next"
import { PortalDashboard } from "@/components/portal/PortalDashboard"

export const metadata: Metadata = {
  title: "Portal de reserva — ESO Chile",
  robots: { index: false },
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const t = await getTranslations({ locale, namespace: "miReserva" })
  const tCommon = await getTranslations({ locale, namespace: "common" })

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      turno: true,
      acompanantes: { orderBy: { nombre: "asc" } },
    },
  })

  if (!reserva) notFound()

  const fechaLimite = formatearFechaLimite(reserva.fechaLimiteConfirmacion, locale as "es" | "en")

  return (
    <div className="min-h-[100dvh] bg-stone-950">
      <PortalDashboard
        reserva={{
          id: reserva.id,
          token: reserva.token,
          shortId: reserva.shortId,
          estado: reserva.estado,
          observatorio: reserva.observatorio,
          nombre: reserva.nombre,
          apellido: reserva.apellido,
          email: reserva.email,
          cantidadPersonas: reserva.cantidadPersonas,
          idioma: reserva.idioma,
          fechaLimiteConfirmacion: reserva.fechaLimiteConfirmacion.toISOString(),
          confirmadaEn: reserva.confirmadaEn?.toISOString() ?? null,
          turno: {
            fecha: reserva.turno.fecha.toISOString().split("T")[0],
            horaInicio: reserva.turno.horaInicio,
            horaFin: reserva.turno.horaFin,
          },
          acompanantes: reserva.acompanantes.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            apellido: a.apellido,
            documento: a.documento,
          })),
        }}
        fechaLimiteFormateada={fechaLimite}
        labels={{
          confirm: t("confirm"),
          cancel: t("cancel"),
          cancelConfirm: t("cancelConfirm"),
          changeDate: t("changeDate"),
          back: tCommon("back"),
          yes: tCommon("yes"),
          no: tCommon("no"),
        }}
      />
    </div>
  )
}
