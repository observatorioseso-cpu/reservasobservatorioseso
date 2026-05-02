import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import { MapPin, Clock, Users, ChevronRight, Mail } from "lucide-react"
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

// ── Diaguita border SVG — inline pattern inspired by Diaguita ceramics ──
// Tricolor diamond/chevron pattern from the Elqui-Limarí-Choapa valley tradition
function DiaguitaBorder({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="w-full overflow-hidden leading-none"
      aria-hidden="true"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="w-full h-7"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Repeating Diaguita diamond-chevron unit: 40px × 28px */}
          <pattern
            id="diaguita-border"
            x="0"
            y="0"
            width="40"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer diamond */}
            <polygon
              points="20,2 38,14 20,26 2,14"
              fill="none"
              stroke="#B87020"
              strokeWidth="1.2"
              opacity="0.7"
            />
            {/* Inner filled diamond */}
            <polygon
              points="20,7 31,14 20,21 9,14"
              fill="#B87020"
              opacity="0.35"
            />
            {/* Center dot */}
            <circle cx="20" cy="14" r="1.5" fill="#8B4E10" opacity="0.6" />
            {/* Corner accents */}
            <rect x="0" y="12" width="4" height="4" fill="#8B4E10" opacity="0.25" />
            <rect x="36" y="12" width="4" height="4" fill="#8B4E10" opacity="0.25" />
          </pattern>
        </defs>
        {/* Top line */}
        <line x1="0" y1="1" x2="1200" y2="1" stroke="#B87020" strokeWidth="0.8" opacity="0.4" />
        {/* Diaguita pattern band */}
        <rect x="0" y="0" width="1200" height="28" fill="url(#diaguita-border)" />
        {/* Bottom line */}
        <line x1="0" y1="27" x2="1200" y2="27" stroke="#8B4E10" strokeWidth="0.8" opacity="0.3" />
      </svg>
    </div>
  )
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
    <div className="min-h-[100dvh] bg-arena-50 text-tinta-900">

      {/* Global mineral grain texture */}
      <div className="grain-overlay" aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <LandingNav
        homeLabel={tNav("home")}
        myBookingLabel={tNav("myBooking")}
        locale={locale}
      />

      {/* ════════════════════════════════════════════════
          HERO — Foto real del Observatorio Paranal
          La Vía Láctea como telón de fondo emocional
      ════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden">

        {/* Background: panoramic Milky Way photo */}
        <img
          src="/images/paranal-milkyway.jpg"
          alt="La Vía Láctea sobre los telescopios VLT del Observatorio Paranal, desierto de Atacama, Chile"
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
        />

        {/* Gradient: transparent top → dark bottom for text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(26,18,5,0.96) 0%, rgba(26,18,5,0.55) 35%, rgba(26,18,5,0.15) 65%, transparent 100%)",
          }}
        />

        {/* Top vignette for nav legibility */}
        <div
          className="absolute inset-x-0 top-0 h-44 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(26,18,5,0.40) 0%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Content: anchored to bottom-left */}
        <div className="relative z-10 px-8 pb-16 pt-32 lg:px-16 lg:pb-24">
          <div className="max-w-3xl">

            {/* Eyebrow badge */}
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full ring-1 ring-tierra-300/30 bg-tierra-400/10 px-4 py-1.5 backdrop-blur-sm">
              <span
                className="size-1.5 rounded-full bg-tierra-300 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xs font-medium tracking-widest uppercase text-tierra-200">
                {t("freeVisit")}
              </span>
            </div>

            {/* H1 */}
            <h1
              className="font-playfair font-black text-white"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                lineHeight: "0.92",
                letterSpacing: "-0.025em",
              }}
            >
              Donde el
              <br />
              <span className="text-tierra-300">desierto</span>
              <br />
              toca las estrellas
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-md text-base leading-relaxed text-arena-300/90">
              {t("subtitle")}
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/reservar/PARANAL"
                className="inline-flex items-center gap-2 rounded-full bg-tierra-400 px-7 py-3.5 text-sm font-semibold text-tinta-900 hover:bg-tierra-300 transition-colors active:scale-[0.97]"
              >
                {t("reserveButton")}
                <ChevronRight className="size-4" />
              </Link>
              <Link
                href="#observatorios"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                {t("selectObservatory")}
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-12 flex flex-wrap gap-10 border-t border-white/10 pt-6">
              <div>
                <p className="font-playfair text-2xl font-black text-tierra-300">320+</p>
                <p className="text-xs text-arena-500 mt-0.5">noches despejadas / año</p>
              </div>
              <div>
                <p className="font-playfair text-2xl font-black text-cielo-300">2.635 m</p>
                <p className="text-xs text-arena-500 mt-0.5">sobre el nivel del mar</p>
              </div>
              <div>
                <p className="font-playfair text-2xl font-black text-white">Libre</p>
                <p className="text-xs text-arena-500 mt-0.5">entrada gratuita ESO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo credit */}
        <p className="absolute bottom-4 right-5 text-[10px] text-white/25 z-10 pointer-events-none">
          © ESO / Y. Beletsky
        </p>
      </section>

      {/* ════════════════════════════════════════════════
          MARQUEE — transición photo→arena
      ════════════════════════════════════════════════ */}
      <LandingMarquee />

      {/* ════════════════════════════════════════════════
          INTRO — fondo arena, textura topográfica
          Cultura ancestral + números reales
      ════════════════════════════════════════════════ */}
      <section className="bg-arena-50 topo-bg relative px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: cultura y texto */}
          <div>
            <p className="text-tierra-500 text-xs uppercase tracking-[0.25em] mb-3 font-franklin">
              Territorio Ancestral · ESO Chile
            </p>
            <h2
              className="font-playfair text-3xl lg:text-4xl text-tinta-900 leading-tight"
            >
              Este cielo tenía dueños
              <br />
              <em className="not-italic text-tierra-600">antes que ESO</em>
            </h2>
            <p className="text-tinta-500 text-sm leading-relaxed mt-5 max-w-md">
              Los Diaguitas en Coquimbo y los Changos en Antofagasta levantaron la vista
              hacia estas mismas estrellas por milenios. El desierto de Atacama — el más árido
              del mundo — fue su hogar. Hoy, la ESO es custodio de ese mismo cielo.
            </p>
            <p className="text-tinta-500 text-sm leading-relaxed mt-3 max-w-md">
              Con más de 320 noches despejadas al año, este territorio es patrimonio
              científico y cultural de la humanidad.
            </p>
          </div>

          {/* Right: stats panel, fondo blanco, sombra suave */}
          <div className="rounded-3xl bg-white ring-1 ring-tierra-500/10 shadow-[0_4px_40px_rgba(139,78,16,0.07)] p-8 divide-y divide-tierra-500/8">
            <div className="pb-6">
              <p className="font-playfair text-3xl font-black text-tierra-700">1969</p>
              <p className="text-tinta-500 text-xs mt-1 leading-relaxed">
                La Silla — primer observatorio ESO en el hemisferio sur
              </p>
            </div>
            <div className="py-6">
              <p className="font-playfair text-3xl font-black text-tierra-700">+18</p>
              <p className="text-tinta-500 text-xs mt-1 leading-relaxed">
                telescopios activos entre ambos observatorios
              </p>
            </div>
            <div className="pt-6">
              <p className="font-playfair text-3xl font-black text-cielo-600">320+</p>
              <p className="text-tinta-500 text-xs mt-1 leading-relaxed">
                noches despejadas al año garantizadas por el Atacama
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CULTURAL STRIP — fondo oscuro, identidad Diaguita
          El ÚNICO bloque dark: crea contraste cromático fuerte
          con el cielo azul del Atacama como acento
      ════════════════════════════════════════════════ */}
      <section className="relative bg-tinta-900 overflow-hidden">

        {/* Diaguita border — top */}
        <DiaguitaBorder />

        {/* Background: subtle night photo overlay */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <img
            src="/images/paranal-night.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-15"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(26,18,5,0.85) 0%, rgba(26,18,5,0.70) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 px-8 py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Left: texto cultural */}
              <div>
                <p className="text-cielo-400 text-xs uppercase tracking-[0.25em] mb-4 font-franklin">
                  Patrimonio Astronómico · Atacama
                </p>
                <h2
                  className="font-playfair text-3xl lg:text-5xl font-black text-white leading-tight"
                >
                  Bajo el cielo de
                  <br />
                  <span className="text-cielo-300">los Diaguitas</span>
                </h2>
                <p className="text-arena-400 text-sm leading-relaxed mt-5 max-w-md">
                  El norte de Chile alberga los observatorios más avanzados del mundo
                  porque su cielo es único. Una herencia compartida entre los pueblos
                  originarios que lo nombraron y la ciencia que hoy lo descifra.
                </p>
                <p className="text-arena-500 text-sm leading-relaxed mt-3 max-w-md">
                  El pueblo Chango habitó las costas de Antofagasta. Los Diaguitas,
                  los valles de Coquimbo. Ambos conocían las estrellas del desierto
                  como conocemos hoy la palma de nuestra mano.
                </p>
              </div>

              {/* Right: cielo-blue stats */}
              <div className="flex flex-col gap-6">
                {[
                  {
                    value: "0,01%",
                    label: "contaminación lumínica — el cielo más oscuro del planeta",
                    color: "text-cielo-300",
                  },
                  {
                    value: "5.000",
                    label: "años de observación astronómica ancestral en el Atacama",
                    color: "text-tierra-300",
                  },
                  {
                    value: "#1",
                    label: "mejor cielo astronómico del hemisferio sur",
                    color: "text-cielo-300",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-5 border-b border-white/5 pb-5 last:border-0 last:pb-0"
                  >
                    <p
                      className={`font-playfair text-3xl font-black shrink-0 ${s.color}`}
                    >
                      {s.value}
                    </p>
                    <p className="text-arena-500 text-sm leading-relaxed pt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Diaguita border — bottom (flipped) */}
        <DiaguitaBorder flip />
      </section>

      {/* ════════════════════════════════════════════════
          OBSERVATORIOS — cards con fotos reales
      ════════════════════════════════════════════════ */}
      <section id="observatorios" className="bg-arena-100 px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-tierra-500 text-xs uppercase tracking-[0.25em] mb-2 font-franklin">
            {t("selectObservatory")}
          </p>
          <h2 className="font-playfair text-3xl lg:text-4xl text-tinta-900 mb-12">
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
              minAge="4 años mínimo"
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

      {/* ════════════════════════════════════════════════
          CÓMO FUNCIONA — 3 pasos, fondo arena claro
      ════════════════════════════════════════════════ */}
      <section className="bg-arena-50 topo-bg px-8 py-24 lg:px-16 border-y border-tierra-500/10">
        <div className="mx-auto max-w-6xl">
          <p className="text-tierra-500 text-xs uppercase tracking-[0.25em] mb-2 font-franklin">
            Proceso simple
          </p>
          <h2 className="font-playfair text-3xl lg:text-4xl text-tinta-900 mb-14">
            Reserva en 3 pasos
          </h2>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                icon: <MapPin className="size-5 text-tierra-600" />,
                title: "Elige observatorio y fecha",
                desc: "Selecciona La Silla o Paranal. Consulta el calendario de disponibilidad en tiempo real.",
              },
              {
                num: "02",
                icon: <Users className="size-5 text-tierra-600" />,
                title: "Registra tu grupo",
                desc: "Completa tus datos y los de tus acompañantes. Máximo 10 personas por reserva.",
              },
              {
                num: "03",
                icon: <Clock className="size-5 text-cielo-600" />,
                title: "Confirma antes del viernes",
                desc: "Recibirás un recordatorio. Confirma tu asistencia antes del viernes a las 12:00.",
              },
            ].map((step) => (
              <div key={step.num} className="group">
                <span
                  className="font-playfair text-5xl font-black text-tierra-500/15 leading-none"
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                <div className="w-8 h-px bg-tierra-500/25 my-4" aria-hidden="true" />
                <div className="mb-3">{step.icon}</div>
                <h3 className="font-semibold text-tinta-800 mb-2 text-base">
                  {step.title}
                </h3>
                <p className="text-sm text-tinta-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER — fondo tinta oscuro como ancla visual
      ════════════════════════════════════════════════ */}
      <footer className="bg-tinta-900 border-t border-white/5 px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl">

          {/* Top row */}
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between mb-10">
            <div>
              <p className="font-playfair font-bold text-arena-100 text-lg mb-1">
                Observatorios ESO Chile
              </p>
              <p className="text-xs text-arena-400 leading-relaxed max-w-xs">
                Visitas guiadas gratuitas a La Silla y Paranal,
                los observatorios de la ESO en el desierto de Atacama.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:reservas@observatorioseso.cl"
                className="inline-flex items-center gap-2 text-xs text-arena-400 hover:text-arena-100 transition-colors"
              >
                <Mail className="size-3.5 text-tierra-400" />
                reservas@observatorioseso.cl
              </a>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-6">
            <div className="flex flex-wrap items-center gap-6 text-xs text-arena-500">
              <Link href="/mi-reserva" className="hover:text-arena-200 transition-colors">
                Mi reserva
              </Link>
              <Link href="/privacidad" className="hover:text-arena-200 transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos" className="hover:text-arena-200 transition-colors">
                Términos
              </Link>
            </div>
            <p className="text-xs text-arena-500/50">
              &copy; {new Date().getFullYear()} ESO Chile · Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
