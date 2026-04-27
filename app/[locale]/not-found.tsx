import { getTranslations } from "next-intl/server"
import { Telescope } from "lucide-react"
import { Link } from "@/i18n/navigation"

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound")

  return (
    <div className="min-h-[100dvh] bg-stone-950 flex flex-col items-center justify-center px-4 text-center">
      <Telescope className="size-12 text-amber-400 mb-6" aria-hidden="true" />

      <p className="text-8xl font-black text-amber-400 leading-none mb-4">404</p>

      <h1 className="font-playfair text-2xl font-bold text-stone-100 mb-2">
        {t("heading")}
      </h1>
      <p className="text-stone-400 text-sm max-w-sm mb-8">{t("body")}</p>

      <Link
        href="/"
        className="inline-block rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        {t("cta")}
      </Link>
    </div>
  )
}
