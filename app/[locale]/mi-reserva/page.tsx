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
    <div className="min-h-[100dvh] bg-stone-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <Telescope className="size-5 text-amber-400 transition-transform group-hover:rotate-12" />
        <span className="font-playfair font-bold text-stone-300 text-sm tracking-tight">
          ESO Observatorios
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-6">
          <h1 className="font-playfair text-2xl font-black text-stone-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{t("login")}</p>
        </div>

        <PortalLoginForm locale={locale} />
      </div>
    </div>
  )
}
