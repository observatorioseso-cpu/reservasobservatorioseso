import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { Telescope, MapPin, Star, Clock, Users, ChevronRight, Zap } from "lucide-react"
import { LandingMarquee } from "@/components/landing/LandingMarquee"
import { ObservatoryCard } from "@/components/landing/ObservatoryCard"
import { LandingNav } from "@/components/landing/LandingNav"
import { organizationSchema } from "@/lib/jsonld"

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

const descriptions: Record<string, string> = {
  es: "Reserva gratis tu visita guiada a La Silla o Paranal, los observatorios de la ESO en Chile. Disponible en español e inglés.",
  en: "Book your free guided tour to La Silla or Paranal, ESO's world-class observatories in Chile.",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const description = descriptions[locale] ?? descriptions.es
  const canonicalUrl = `${BASE_URL}/${locale}`

  return {
    title: "Reserva tu visita guiada | ESO Observatorios Chile",
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: "Reserva tu visita guiada | ESO Observatorios Chile",
      description,
      url: canonicalUrl,
      siteName: "ESO Observatorios Chile",
      locale: locale === "en" ? "en_US" : "es_CL",
      type: "website",
      images: [
        {
          url: "/og/home.png",
          width: 1200,
          height: 630,
          alt: "ESO Observatorios Chile — La Silla y Paranal",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Reserva tu visita guiada | ESO Observatorios Chile",
      description,
      images: ["/og/home.png"],
    },
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "landing" })
  const tNav = await getTranslations({ locale, namespace: "nav" })
  const tObs = await getTranslations({ locale, namespace: "observatorios" })

  const orgSchema = organizationSchema()

  return (
    <div className="min-h-[100dvh] bg-stone-950 text-stone-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <LandingNav homeLabel={tNav("home")} myBookingLabel={tNav("myBooking")} locale={locale} />

      {/* ─── HERO — Split asimétrico ─── */}
      <section className="relative min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1fr_420px]">
        {/* Panel izquierdo — contenido */}
        <div className="flex flex-col justify-center px-8 pt-24 pb-16 lg:px-16 lg:pt-32">
          {/* Badge flotante */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 w-fit">
            <Zap className="size-3.5 text-sky-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-sky-300">
              {t("freeVisit")}
            </span>
          </div>

          <h1 className="font-playfair text-5xl font-black leading-[0.95] tracking-tighter text-stone-100 sm:text-6xl lg:text-7xl xl:text-8xl">
            Observatorios
            <br />
            <span className="text-amber-400">ESO</span>
            <br />
            Chile
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-stone-400 lg:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/reservar/PARANAL"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-400 active:scale-[0.97]"
            >
              {t("reserveButton")}
              <ChevronRight className="size-4" />
            </Link>
            <Link
              href="#observatorios"
              className="text-sm font-medium text-stone-400 underline underline-offset-4 hover:text-stone-200 transition-colors"
            >
              {t("selectObservatory")}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-stone-800 pt-8 max-w-md">
            <div>
              <p className="font-playfair text-2xl font-black text-amber-400">+312</p>
              <p className="mt-0.5 text-xs text-stone-500">visitas al año</p>
            </div>
            <div>
              <p className="font-playfair text-2xl font-black text-sky-400">2.4km</p>
              <p className="mt-0.5 text-xs text-stone-500">sobre el nivel del mar</p>
            </div>
            <div>
              <p className="font-playfair text-2xl font-black text-stone-200">0</p>
              <p className="mt-0.5 text-xs text-stone-500">costo de entrada</p>
            </div>
          </div>
        </div>

        {/* Panel derecho — visual atmosférico */}
        <div className="relative hidden lg:block">
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* Imagen placeholder — reemplazar con next/image en producción */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.25) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 80%, rgba(125,211,252,0.15) 0%, transparent 50%)
                `,
              }}
            />
            {/* Texto vertical decorativo */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 origin-center rotate-90 select-none">
              <p className="text-[80px] font-black tracking-[0.3em] text-stone-800/60 font-playfair leading-none">
                ATACAMA
              </p>
            </div>
            {/* Icono telescopio centrado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Telescope className="size-32 text-stone-700/40" strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <LandingMarquee />

      {/* ─── OBSERVATORIOS ─── */}
      <section id="observatorios" className="px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-2">
                {t("selectObservatory")}
              </p>
              <h2 className="font-playfair text-3xl font-black text-stone-100 lg:text-4xl">
                Dos ventanas al universo
              </h2>
            </div>
            <Star className="size-6 text-stone-700 hidden sm:block" />
          </div>

          {/* Cards asimétricas: Paranal grande, La Silla compacta */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <ObservatoryCard
              slug="PARANAL"
              name={tObs("PARANAL")}
              region={tObs("paranal_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description="El hogar del VLT — cuatro telescopios de 8,2 metros que conforman el instrumento óptico más poderoso del mundo. El desierto de Atacama ofrece más de 320 noches despejadas al año."
              schedule="09:30–13:00 · 13:30–17:00"
              minAge="4 años"
            />
            <ObservatoryCard
              slug="LA_SILLA"
              name={tObs("LA_SILLA")}
              region={tObs("lasilla_region")}
              size="small"
              reserveLabel={t("reserveButton")}
              description="El primer observatorio ESO en Chile. Telescopios históricos en la cima de un cerro del desierto de Atacama, a 600 km al norte de Santiago."
              schedule="09:30–13:00 (invierno)"
              minAge="8 años (invierno)"
            />
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section className="bg-stone-900/60 px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-2">
            Proceso simple
          </p>
          <h2 className="font-playfair text-3xl font-black text-stone-100 mb-12 lg:text-4xl">
            Reserva en 3 pasos
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                num: "01",
                icon: <MapPin className="size-5 text-amber-400" />,
                title: "Elige observatorio y fecha",
                desc: "Selecciona La Silla o Paranal. Consulta el calendario de disponibilidad en tiempo real.",
              },
              {
                num: "02",
                icon: <Users className="size-5 text-amber-400" />,
                title: "Registra tu grupo",
                desc: "Completa tus datos y los de tus acompañantes. Máximo 10 personas por reserva.",
              },
              {
                num: "03",
                icon: <Clock className="size-5 text-amber-400" />,
                title: "Confirma antes del viernes",
                desc: "Recibirás un recordatorio. Confirma tu asistencia antes del viernes a las 12:00.",
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-5">
                <div className="pt-1 shrink-0">
                  <span className="font-playfair text-3xl font-black text-stone-700 leading-none">
                    {step.num}
                  </span>
                </div>
                <div>
                  <div className="mb-2">{step.icon}</div>
                  <h3 className="font-semibold text-stone-100 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-stone-800 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-playfair font-bold text-stone-300">Observatorios ESO Chile</p>
            <p className="text-xs text-stone-600 mt-0.5">
              reservas@observatorioseso.cl
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-stone-600">
            <Link href="/mi-reserva" className="hover:text-stone-400 transition-colors">
              Mi reserva
            </Link>
            <Link href="/privacidad" className="hover:text-stone-400 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-stone-400 transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
