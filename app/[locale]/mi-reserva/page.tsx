import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { PortalLoginForm } from "@/components/portal/PortalLoginForm"

export const metadata: Metadata = {
  title: "Mi reserva — ESO Chile",
  robots: { index: false },
}

export default async function MiReservaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "miReserva" })

  return (
    <PortalLoginForm
      labels={{
        title: t("title"),
        login: t("login"),
        loginSubtitle: t("loginSubtitle"),
        emailLabel: t("emailLabel"),
        emailPlaceholder: t("emailPlaceholder"),
        passwordLabel: t("passwordLabel"),
        passwordHint: t("passwordHint"),
        forgotPassword: t("forgotPassword"),
        forgotPasswordContact: t("forgotPasswordContact"),
        submitLogin: t("submitLogin"),
        backToHome: t("backToHome"),
        errorNotFound: t("errorNotFound"),
        errorConnection: t("errorConnection"),
      }}
    />
  )
}
