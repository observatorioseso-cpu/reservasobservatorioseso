import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { MapPin, Clock, Users, ChevronRight } from "lucide-react"
import { LandingMarquee } from "@/components/landing/LandingMarquee"
import { ObservatoryCard } from "@/components/landing/ObservatoryCard"
import { LandingNav } from "@/components/landing/LandingNav"
import { organizationSchema } from "@/lib/jsonld"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"
).replace(/^﻿/, "").trim()

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
          url: `/api/og?obs=home&locale=${locale}`,
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
      images: [`/api/og?obs=home&locale=${locale}`],
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

  // Star positions generated deterministically to avoid hydration mismatch
  const stars = [
    { top: "8%", left: "12%", size: 1, delay: 0 },
    { top: "14%", left: "72%", size: 2, delay: 0.6 },
    { top: "22%", left: "38%", size: 1, delay: 1.2 },
    { top: "31%", left: "85%", size: 1, delay: 0.3 },
    { top: "40%", left: "20%", size: 2, delay: 0.9 },
    { top: "48%", left: "58%", size: 1, delay: 1.5 },
    { top: "57%", left: "10%", size: 1, delay: 0.4 },
    { top: "63%", left: "78%", size: 2, delay: 1.1 },
    { top: "72%", left: "45%", size: 1, delay: 0.7 },
    { top: "80%", left: "90%", size: 1, delay: 1.8 },
    { top: "88%", left: "30%", size: 2, delay: 0.2 },
    { top: "93%", left: "65%", size: 1, delay: 1.4 },
  ]

  return (
    <div className="min-h-[100dvh] bg-atacama-950 text-caliche-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <LandingNav homeLabel={tNav("home")} myBookingLabel={tNav("myBooking")} locale={locale} />

      {/* ─── HERO — El Umbral del Desierto ─── */}
      <section className="relative grid grid-cols-1 lg:grid-cols-[1fr_480px] bg-atacama-950">
        {/* Panel izquierdo — contenido */}
        <div className="flex flex-col justify-center px-8 pt-28 pb-20 lg:px-16 lg:pt-36">
          {/* Eyebrow badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full ring-1 ring-ocre-400/30 bg-ocre-400/8 px-4 py-1.5 w-fit">
            <span
              className="size-1.5 rounded-full bg-amber-400 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-xs font-medium tracking-widest uppercase text-ocre-300">
              {t("freeVisit")}
            </span>
          </div>

          {/* H1 */}
          <h1
            className="font-playfair text-6xl font-black text-caliche-50 lg:text-7xl xl:text-8xl"
            style={{ lineHeight: "0.9", letterSpacing: "-0.03em" }}
          >
            Donde el
            <br />
            <span className="text-ocre-400">desierto</span>
            <br />
            toca las estrellas
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 max-w-sm text-base leading-relaxed text-caliche-500">
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/reservar/PARANAL"
              className="inline-flex items-center gap-2 rounded-full bg-ocre-400 px-6 py-3 text-sm font-semibold text-atacama-950 transition-colors hover:bg-ocre-300 active:scale-[0.97]"
            >
              {t("reserveButton")}
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-atacama-950/10">
                <ChevronRight className="size-3.5" />
              </span>
            </Link>
            <Link
              href="#observatorios"
              className="text-sm text-caliche-500 underline underline-offset-4 hover:text-caliche-200 transition-colors"
            >
              {t("selectObservatory")}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-ocre-600/20 pt-8 max-w-sm">
            <div>
              <p className="font-playfair text-2xl font-black text-ocre-400">+312</p>
              <p className="mt-0.5 text-xs text-caliche-700">visitas al año</p>
            </div>
            <div>
              <p className="font-playfair text-2xl font-black text-cielo-400">2.635m</p>
              <p className="mt-0.5 text-xs text-caliche-700">sobre el nivel del mar</p>
            </div>
            <div>
              <p className="font-playfair text-2xl font-black text-caliche-200">Libre</p>
              <p className="mt-0.5 text-xs text-caliche-700">entrada gratuita</p>
            </div>
          </div>
        </div>

        {/* Panel derecho — visual atmosférico */}
        <div className="relative hidden lg:block">
          <div className="sticky top-0 h-screen overflow-hidden bg-atacama-900">
            {/* Capa 1: calor de la tierra */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 40% 60%, rgba(184,112,32,0.18) 0%, transparent 55%)",
              }}
            />
            {/* Capa 2: cielo nocturno */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 65% 20%, rgba(90,143,165,0.12) 0%, transparent 45%)",
              }}
            />
            {/* Capa 3: sombra base */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(13,8,4,0.7) 0%, transparent 40%)",
              }}
            />

            {/* Patrón Diaguita */}
            <svg
              width="120"
              height="200"
              viewBox="0 0 120 200"
              fill="none"
              className="absolute top-16 left-8 opacity-[0.07]"
              aria-hidden="true"
            >
              <path
                d="M60 0 L120 60 L60 120 L0 60 Z"
                stroke="#D4993A"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M60 40 L100 70 L60 100 L20 70 Z"
                stroke="#D4993A"
                strokeWidth="0.5"
                fill="rgba(212,153,58,0.05)"
              />
              <path
                d="M60 80 L80 100 L60 120 L40 100 Z"
                stroke="#D4993A"
                strokeWidth="0.5"
                fill="none"
              />
              <line
                x1="0"
                y1="130"
                x2="120"
                y2="130"
                stroke="#D4993A"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <line
                x1="0"
                y1="140"
                x2="120"
                y2="140"
                stroke="#D4993A"
                strokeWidth="0.3"
                opacity="0.2"
              />
              <line
                x1="0"
                y1="150"
                x2="120"
                y2="150"
                stroke="#D4993A"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <path
                d="M0 160 L20 170 L0 180 M20 160 L40 170 L20 180 M40 160 L60 170 L40 180 M60 160 L80 170 L60 180 M80 160 L100 170 L80 180 M100 160 L120 170 L100 180"
                stroke="#D4993A"
                strokeWidth="0.5"
                fill="none"
                opacity="0.5"
              />
            </svg>

            {/* Estrellas CSS */}
            {stars.map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-caliche-100 animate-pulse"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${2.5 + star.delay}s`,
                }}
                aria-hidden="true"
              />
            ))}

            {/* Texto vertical ATACAMA */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 origin-center rotate-90 select-none pointer-events-none"
              aria-hidden="true"
            >
              <p
                className="font-playfair font-black tracking-[0.3em] text-atacama-700/40 leading-none"
                style={{ fontSize: "100px" }}
              >
                ATACAMA
              </p>
            </div>

            {/* Línea horizontal decorativa en tercio inferior */}
            <div
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{
                bottom: "33.333%",
                background:
                  "linear-gradient(to right, transparent, rgba(139,78,16,0.20), transparent)",
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <LandingMarquee />

      {/* ─── SECCIÓN CULTURAL — Tierra de Estrellas ─── */}
      <section className="bg-atacama-900 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-center">
          {/* Columna izquierda */}
          <div>
            <p className="text-ocre-400 text-xs uppercase tracking-[0.25em] mb-4">
              Territorio Ancestral
            </p>
            <h2 className="font-playfair text-3xl lg:text-4xl text-caliche-100 leading-tight">
              Este cielo tenía dueños antes que ESO
            </h2>
            <p className="text-caliche-500 text-sm leading-relaxed max-w-md mt-4">
              Los Diaguitas en Coquimbo y los Changos en Antofagasta levantaron la vista hacia
              estas mismas estrellas. El desierto de Atacama — el más árido del mundo — fue su
              hogar durante milenios. Hoy, la ESO es custodio de ese mismo cielo.
            </p>
            <p className="text-caliche-500 text-sm leading-relaxed max-w-md mt-3">
              Con más de 320 noches despejadas al año, este territorio es patrimonio científico y
              cultural de la humanidad.
            </p>
          </div>

          {/* Columna derecha — panel de stats */}
          <div className="bg-atacama-800/60 rounded-3xl p-8 ring-1 ring-ocre-600/15">
            <div className="divide-y divide-ocre-600/10">
              <div className="pb-5">
                <p className="font-playfair text-2xl font-black text-ocre-400">1969</p>
                <p className="text-caliche-500 text-xs mt-0.5">
                  La Silla, primer observatorio ESO en el hemisferio sur
                </p>
              </div>
              <div className="py-5">
                <p className="font-playfair text-2xl font-black text-ocre-400">+18</p>
                <p className="text-caliche-500 text-xs mt-0.5">
                  telescopios activos entre ambos observatorios
                </p>
              </div>
              <div className="pt-5">
                <p className="font-playfair text-2xl font-black text-ocre-400">320+</p>
                <p className="text-caliche-500 text-xs mt-0.5">
                  noches despejadas al año garantizadas por el Atacama
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OBSERVATORIOS ─── */}
      <section id="observatorios" className="px-8 py-24 lg:px-16 bg-atacama-950">
        <div className="mx-auto max-w-6xl">
          <p className="text-ocre-400 text-xs uppercase tracking-[0.25em] mb-2">
            {t("selectObservatory")}
          </p>
          <h2 className="font-playfair text-3xl lg:text-4xl text-caliche-100 mb-12">
            Dos ventanas al universo
          </h2>

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
      <section className="bg-atacama-900/40 px-8 py-24 lg:px-16 border-y border-ocre-600/10">
        <div className="mx-auto max-w-6xl">
          <p className="text-ocre-400 text-xs uppercase tracking-[0.25em] mb-2">
            Proceso simple
          </p>
          <h2 className="font-playfair text-3xl lg:text-4xl text-caliche-100 mb-12">
            Reserva en 3 pasos
          </h2>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                icon: <MapPin className="size-5 text-ocre-400" />,
                title: "Elige observatorio y fecha",
                desc: "Selecciona La Silla o Paranal. Consulta el calendario de disponibilidad en tiempo real.",
              },
              {
                num: "02",
                icon: <Users className="size-5 text-ocre-400" />,
                title: "Registra tu grupo",
                desc: "Completa tus datos y los de tus acompañantes. Máximo 10 personas por reserva.",
              },
              {
                num: "03",
                icon: <Clock className="size-5 text-ocre-400" />,
                title: "Confirma antes del viernes",
                desc: "Recibirás un recordatorio. Confirma tu asistencia antes del viernes a las 12:00.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span
                  className="font-playfair text-4xl font-black text-atacama-700 leading-none"
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                <div className="w-6 h-px bg-ocre-600/40 my-4" aria-hidden="true" />
                <div className="mb-3">{step.icon}</div>
                <h3 className="font-semibold text-caliche-200 mb-1.5">{step.title}</h3>
                <p className="text-sm text-caliche-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-ocre-600/15 px-8 py-12 lg:px-16 bg-atacama-950">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-playfair font-bold text-caliche-200">Observatorios ESO Chile</p>
            <p className="text-xs text-caliche-700 mt-0.5">reservas@observatorioseso.cl</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-caliche-700">
            <Link href="/mi-reserva" className="hover:text-caliche-400 transition-colors">
              Mi reserva
            </Link>
            <Link href="/privacidad" className="hover:text-caliche-400 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-caliche-400 transition-colors">
              Términos
            </Link>
            <span className="text-caliche-900 hidden sm:inline">
              &copy; 2025 ESO Chile
            </span>
          </div>
          <p className="text-xs text-caliche-900 sm:hidden">&copy; 2025 ESO Chile</p>
        </div>
      </footer>
    </div>
  )
}
