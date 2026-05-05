import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { ExitoSummary } from "./ExitoSummary"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "exito" })
  return { title: t("title"), robots: { index: false } }
}

export default async function ExitoPage() {
  const t = await getTranslations("exito")

  return (
    <main className="min-h-[100dvh] bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40">
          {/* CheckCircle icon */}
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="font-playfair text-3xl font-bold text-stone-100 mb-3">
          {t("title")}
        </h1>

        <p className="text-stone-400 mb-8">{t("subtitle")}</p>

        <ExitoSummary />

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-6 text-left text-sm text-stone-400">
          <p className="font-medium text-stone-200 mb-2">{t("instructions")}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ul>
          <p className="mt-4 text-sky-400 text-xs">{t("contact")}</p>
        </div>
      </div>
    </main>
  )
}
