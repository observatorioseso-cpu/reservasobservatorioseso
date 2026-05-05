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

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      turno: true,
      acompanantes: { orderBy: { nombre: "asc" } },
    },
  })

  if (!reserva) notFound()

  const fechaLimite = formatearFechaLimite(
    reserva.fechaLimiteConfirmacion,
    locale as "es" | "en"
  )

  return (
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
        yes: t("yes"),
        no: t("no"),
        heroObservatoryLabel: t("heroObservatoryLabel"),
        bookingCodeLabel: t("bookingCodeLabel"),
        deadlineTitle: t("deadlineTitle"),
        deadlineBody: t("deadlineBody"),
        deadlineConfirmBefore: t("deadlineConfirmBefore"),
        deadlinePassed: t("deadlinePassed"),
        deadlinePassedBody: t("deadlinePassedBody"),
        detailsTitle: t("detailsTitle"),
        detailsObservatory: t("detailsObservatory"),
        detailsDate: t("detailsDate"),
        detailsGroup: t("detailsGroup"),
        detailsLanguage: t("detailsLanguage"),
        detailsConfirmedOn: t("detailsConfirmedOn"),
        detailsHolder: t("detailsHolder"),
        companions: t("companions"),
        companionsCount: t("companionsCount"),
        companionsNone: t("companionsNone"),
        companionsManage: t("companionsManage"),
        companionsAdd: t("companionsAdd"),
        actionWindowClosed: t("actionWindowClosed"),
        actionWindowClosedBody: t("actionWindowClosedBody"),
        statusConfirmed: t("statusConfirmed"),
        statusPending: t("statusPending"),
        statusCancelled: t("statusCancelled"),
        statusAbsent: t("statusAbsent"),
        statusConfirmedMsg: t("statusConfirmedMsg"),
        statusCancelledMsg: t("statusCancelledMsg"),
        statusCancelledContact: t("statusCancelledContact"),
        passwordActionLabel: t("passwordActionLabel"),
        person: t("person"),
        persons: t("persons"),
        langSpanish: t("langSpanish"),
        langEnglish: t("langEnglish"),
        errorConnection: t("errorConnection"),
        logout: t("logout"),
      }}
    />
  )
}
