import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Telescope } from "lucide-react"
import { Link } from "@/i18n/navigation"
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
    <div className="min-h-[100dvh] bg-tinta-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <Telescope className="size-5 text-tierra-500 transition-transform group-hover:rotate-12" />
        <span className="font-playfair font-bold text-arena-200 text-sm tracking-tight">
          ESO Observatorios
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="font-playfair text-2xl font-black text-arena-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-tinta-300">{t("login")}</p>
        </div>

        <PortalLoginForm locale={locale} />
      </div>
    </div>
  )
}
