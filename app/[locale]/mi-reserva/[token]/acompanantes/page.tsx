import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { estaDentroDeVentanaModificacion } from "@/lib/confirmacion"
import type { Metadata } from "next"
import { AcompanantesForm } from "@/components/portal/AcompanantesForm"

export const metadata: Metadata = {
  title: "Gestionar acompañantes — ESO Chile",
  robots: { index: false },
}

export default async function AcompanantesPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const { locale, token } = await params
  const t = await getTranslations({ locale, namespace: "acompanantes" })

  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      acompanantes: { orderBy: { nombre: "asc" } },
    },
  })

  if (!reserva) notFound()

  const dentroVentana =
    reserva.estado !== "ANULADA" &&
    estaDentroDeVentanaModificacion(reserva.fechaLimiteConfirmacion)

  return (
    <AcompanantesForm
      token={token}
      titular={{ nombre: reserva.nombre, apellido: reserva.apellido }}
      acompanantesIniciales={reserva.acompanantes.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        apellido: a.apellido,
        documento: a.documento ?? "",
      }))}
      dentroVentana={dentroVentana}
      reservaAnulada={reserva.estado === "ANULADA"}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        backToBooking: t("backToBooking"),
        holderLabel: t("holderLabel"),
        companionN: t("companionN"),
        noCompanionsYet: t("noCompanionsYet"),
        addCompanion: t("addCompanion"),
        remove: t("remove"),
        nombreLabel: t("nombreLabel"),
        nombrePlaceholder: t("nombrePlaceholder"),
        apellidoLabel: t("apellidoLabel"),
        apellidoPlaceholder: t("apellidoPlaceholder"),
        documentoLabel: t("documentoLabel"),
        documentoPlaceholder: t("documentoPlaceholder"),
        totalPersons: t("totalPersons"),
        maxPersons: t("maxPersons"),
        passwordLabel: t("passwordLabel"),
        passwordPlaceholder: t("passwordPlaceholder"),
        save: t("save"),
        saving: t("saving"),
        successTitle: t("successTitle"),
        successBody: t("successBody"),
        backAfterSuccess: t("backAfterSuccess"),
        errorInvalidPassword: t("errorInvalidPassword"),
        errorNoCupos: t("errorNoCupos"),
        errorWindowClosed: t("errorWindowClosed"),
        errorMax: t("errorMax"),
        errorGeneric: t("errorGeneric"),
        windowClosedTitle: t("windowClosedTitle"),
        windowClosedBody: t("windowClosedBody"),
        cancelledTitle: t("cancelledTitle"),
        cancelledBody: t("cancelledBody"),
      }}
    />
  )
}
