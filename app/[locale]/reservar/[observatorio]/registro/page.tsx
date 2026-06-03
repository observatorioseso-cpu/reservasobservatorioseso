import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { ChevronLeft, Telescope } from "lucide-react"
import { FormularioReserva } from "@/components/reserva/FormularioReserva"
import { prisma } from "@/lib/prisma"

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
  const tErrors = await getTranslations({ locale, namespace: "errors" })
  const nombre = NOMBRES[slug]

  // Max personas: turno override tiene prioridad sobre ConfigSistema global
  const turnoData = await prisma.turno.findUnique({
    where: { id: turnoId },
    select: { tipo: true, maxPersonasPorReserva: true },
  })
  let maxPersonas = 10
  if (turnoData?.maxPersonasPorReserva != null) {
    maxPersonas = turnoData.maxPersonasPorReserva
  } else {
    const configMax = await prisma.configSistema.findUnique({ where: { clave: "MAX_PERSONAS_CLIENTE" } })
    maxPersonas = configMax ? Math.min(parseInt(configMax.valor, 10) || 10, 50) : 10
  }
  const esNocturna = turnoData?.tipo === "NOCTURNA"

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
          <p className="mt-1 text-sm text-stone-500">
            {locale === "en"
              ? `Up to ${maxPersonas} people per booking`
              : `Máximo ${maxPersonas} personas por reserva`}
          </p>
          {esNocturna && (
            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">🌙</span>
              <div className="text-sm text-amber-900">
                <p className="font-semibold">
                  {locale === "en" ? "Special nocturnal visit" : "Visita nocturna especial"}
                </p>
                <p className="mt-0.5 text-amber-800">
                  {locale === "en"
                    ? "Access exclusively by ESO bus (round trip). Personal vehicles are not permitted. Pick-up points and times will be communicated to registered attendees."
                    : "El acceso es únicamente en bus oficial ESO (ida y vuelta). No se permite ingreso en vehículo propio. Los puntos y horarios de recogida se informarán a los inscritos."}
                </p>
              </div>
            </div>
          )}
        </div>

        <FormularioReserva
          turnoId={turnoId}
          observatorio={slug}
          fecha={fecha}
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
            sectionTitular: t("sectionTitular"),
            sectionVisita: t("sectionVisita"),
            sectionPassword: t("sectionPassword"),
            reducirPersonas: t("reducirPersonas"),
            aumentarPersonas: t("aumentarPersonas"),
            titularEsMenor: t("titularEsMenor"),
            nacionalidad: t("nacionalidad"),
            nacionalidadPlaceholder: t("nacionalidadPlaceholder"),
            ciudadResidencia: t("ciudadResidencia"),
            ciudadPlaceholder: t("ciudadPlaceholder"),
            sectionGrupo: t("sectionGrupo"),
            tipoVisitante: t("tipoVisitante"),
            tipoPersonal: t("tipoPersonal"),
            tipoColegio: t("tipoColegio"),
            tipoInstituto: t("tipoInstituto"),
            tipoUniversidad: t("tipoUniversidad"),
            tipoEmpresa: t("tipoEmpresa"),
            tipoAgencia: t("tipoAgencia"),
            tipoOtro: t("tipoOtro"),
            organizacion: t("organizacion"),
            organizacionPlaceholder: t("organizacionPlaceholder"),
            infoAdicional: t("infoAdicional"),
            infoAdicionalPlaceholder: t("infoAdicionalPlaceholder"),
            acompananteLabel: t("acompananteLabel"),
            acompananteDocumento: t("acompananteDocumento"),
            acompananteDocumentoHint: t("acompananteDocumentoHint"),
            acompananteEsMenor: t("acompananteEsMenor"),
          }}
          errorLabels={{
            required: tErrors("required"),
            emailMismatch: tErrors("emailMismatch"),
            invalidRut: tErrors("invalidRut"),
            maxPersons: tErrors("maxPersons"),
            generic: tErrors("generic"),
          }}
          backLabel={tCommon("back")}
          locale={locale}
          maxPersonas={maxPersonas}
        />
      </main>
    </div>
  )
}
