import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { ChevronLeft, Telescope } from "lucide-react"
import { FormularioReserva } from "@/components/reserva/FormularioReserva"

type ObservatorioSlug = "LA_SILLA" | "PARANAL"
const NOMBRES: Record<ObservatorioSlug, string> = {
  LA_SILLA: "La Silla",
  PARANAL: "Paranal (VLT)",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ observatorio: string }>
}): Promise<Metadata> {
  const { observatorio } = await params
  const slug = observatorio.toUpperCase() as ObservatorioSlug
  return { title: `Registrar grupo — ${NOMBRES[slug] ?? "ESO Chile"}` }
}

export default async function FormularioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; observatorio: string }>
  searchParams: Promise<{ turnoId?: string; fecha?: string }>
}) {
  const { observatorio, locale } = await params
  const { turnoId, fecha } = await searchParams
  const slug = observatorio.toUpperCase() as ObservatorioSlug

  if (!["LA_SILLA", "PARANAL"].includes(slug)) notFound()
  if (!turnoId || !fecha) redirect(`/${locale}/reservar/${observatorio}`)

  const t = await getTranslations({ locale, namespace: "formulario" })
  const tCommon = await getTranslations({ locale, namespace: "common" })
  const nombre = NOMBRES[slug]

  return (
    <div className="min-h-[100dvh] bg-stone-50">
      {/* Header — modo claro forzado (regla 5) */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            href={`/reservar/${observatorio}`}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 transition-colors text-sm"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Telescope className="size-4 text-amber-500" />
          <span className="font-playfair font-semibold text-stone-800 text-sm">{nombre}</span>
          <span className="text-stone-300 text-sm">·</span>
          <span className="text-xs text-stone-500">{fecha}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-playfair text-2xl font-black text-stone-900">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-stone-500">{t("maxPersons")}</p>
        </div>

        <FormularioReserva
          turnoId={turnoId}
          observatorio={slug}
          labels={{
            nombre: t("nombre"),
            apellido: t("apellido"),
            rutOPasaporte: t("rutOPasaporte"),
            rutHint: t("rutHint"),
            email: t("email"),
            emailConfirm: t("emailConfirm"),
            telefono: t("telefono"),
            cantidadPersonas: t("cantidadPersonas"),
            idioma: t("idioma"),
            idiomaES: t("idiomaES"),
            idiomaEN: t("idiomaEN"),
            tienesMenores: t("tienesMenores"),
            recibirWhatsapp: t("recibirWhatsapp"),
            whatsappOptIn: t("whatsappOptIn"),
            password: t("password"),
            passwordHint: t("passwordHint"),
            acompanantes: t("acompanantes"),
            addAcompanante: t("addAcompanante"),
            submit: t("submit"),
            edadMinima8: t("edadMinima8"),
            edadMinima4: t("edadMinima4"),
          }}
          errorLabels={{
            required: tCommon("loading"),
            emailMismatch: "Los correos no coinciden",
            invalidRut: "El RUT no es válido — formato esperado: 12.345.678-9",
            maxPersons: t("maxPersons"),
            generic: "Ocurrió un error inesperado. Intenta de nuevo.",
          }}
          backLabel={tCommon("back")}
          locale={locale}
        />
      </main>
    </div>
  )
}
