import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  XCircle,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
  Download,
  Mail,
  Send,
} from "lucide-react"
import { ObservatoryCard } from "@/components/landing/ObservatoryCard"
import { LandingNav } from "@/components/landing/LandingNav"
import { organizationSchema } from "@/lib/jsonld"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://reservasobservatorioseso.cl"
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
      languages: { es: `${BASE_URL}/es`, en: `${BASE_URL}/en` },
    },
    openGraph: {
      title: "Reserva tu visita guiada | ESO Observatorios Chile",
      description,
      url: canonicalUrl,
      siteName: "ESO Observatorios Chile",
      locale: locale === "en" ? "en_US" : "es_CL",
      type: "website",
      images: [{ url: `/api/og?obs=home&locale=${locale}`, width: 1200, height: 630, alt: "ESO Observatorios Chile" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Reserva tu visita guiada | ESO Observatorios Chile",
      description,
      images: [`/api/og?obs=home&locale=${locale}`],
    },
  }
}

// ── Diaguita separator — thin decorative rule ──────────────────────────────
function DiaguitaRule() {
  return (
    <div className="w-full overflow-hidden leading-none" aria-hidden="true">
      <svg viewBox="0 0 1200 12" preserveAspectRatio="none" className="w-full h-3" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dgr" x="0" y="0" width="24" height="12" patternUnits="userSpaceOnUse">
            <polygon points="12,1 23,6 12,11 1,6" fill="none" stroke="#B87020" strokeWidth="0.8" opacity="0.4" />
            <circle cx="12" cy="6" r="1" fill="#B87020" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="1200" height="12" fill="url(#dgr)" />
      </svg>
    </div>
  )
}

// ── FAQ item — native <details> accordion, zero JS ─────────────────────────
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group border-b border-tierra-500/10 last:border-0">
      <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-sm font-medium text-tinta-800 hover:text-tierra-700 transition-colors select-none">
        {q}
        <ChevronDown className="size-4 text-tierra-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm text-tinta-500 leading-relaxed">{a}</div>
    </details>
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
  const tHome = await getTranslations({ locale, namespace: "home" })

  const orgSchema = organizationSchema()

  return (
    <div className="min-h-[100dvh] bg-arena-50 text-tinta-900">
      <div className="grain-overlay" aria-hidden="true" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <LandingNav
        homeLabel={tNav("home")}
        myBookingLabel={tNav("myBooking")}
        locale={locale}
        lightBg
      />

      {/* ══════════════════════════════════════════════════════
          1. CABECERA COMPACTA
      ══════════════════════════════════════════════════════ */}
      <section className="topo-bg pt-24 pb-8 px-8 lg:px-16 border-b border-tierra-500/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-1.5 rounded-full bg-tierra-400 animate-pulse" aria-hidden="true" />
              <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] font-franklin">
                {tHome("badge")}
              </p>
            </div>
            <h1 className="font-playfair text-3xl lg:text-4xl font-black text-tinta-900 leading-tight">
              {tHome("heroTitle")}
            </h1>
            <p className="text-tinta-500 text-sm mt-2 max-w-md leading-relaxed">
              {tHome("heroSubtitle")}
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/mi-reserva"
              className="inline-flex items-center gap-2 rounded-full border border-tierra-600/30 bg-white px-5 py-2.5 text-sm font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-600/50 transition-all shadow-sm"
            >
              <CalendarCheck className="size-4 text-tierra-500" />
              {tHome("myBookingBtn")}
              <ChevronRight className="size-3.5 text-tierra-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. BARRA DE REGLAS — 3 reglas clave, sin repetir gratuita
      ══════════════════════════════════════════════════════ */}
      <div className="bg-tierra-700 text-arena-100 px-8 py-3 lg:px-16 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex items-center gap-6 text-xs whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-tierra-300 shrink-0" />
            {tHome("ruleMaxPersons")}
          </span>
          <span className="text-tierra-500" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-tierra-300 shrink-0" />
            {tHome("ruleDeadline")}
          </span>
          <span className="text-tierra-500" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="size-3.5 text-tierra-300 shrink-0" />
            {tHome("ruleModifiable")}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. SELECCIÓN DE OBSERVATORIO
          Descripciones basadas en descubrimientos recientes,
          no en fechas de fundación.
      ══════════════════════════════════════════════════════ */}
      <section id="observatorios" className="bg-arena-100 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-tinta-400 text-xs uppercase tracking-[0.2em] mb-6 font-franklin">
            {tHome("obsStep")}
          </p>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ObservatoryCard
              slug="PARANAL"
              name={tObs("PARANAL")}
              region={tObs("paranal_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description={tHome("paranalDesc")}
              schedule={tHome("paranalsched")}
              minAge={tHome("paranalminage")}
            />
            <ObservatoryCard
              slug="LA_SILLA"
              name={tObs("LA_SILLA")}
              region={tObs("lasilla_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description={tHome("lasillaDesc")}
              schedule={tHome("lasillaSched")}
              minAge={tHome("lasillaMinage")}
            />
          </div>

          {/* ── Grupos de más de 10 personas ─────────────── */}
          <div className="mt-5 rounded-2xl border border-tierra-500/15 bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="size-4 text-tierra-500 shrink-0" />
                <h2 className="text-sm font-semibold text-tinta-800">
                  {tHome("groupsTitle")}
                </h2>
              </div>
              <p className="text-xs text-tinta-500 leading-relaxed max-w-lg">
                {tHome("groupsBody").split(tHome("groupsBodySilla"))[0]}
                <strong className="text-tinta-700">{tHome("groupsBodySilla")}</strong>
                {tHome("groupsBody").split(tHome("groupsBodySilla"))[1]?.split(tHome("groupsBodyParanal"))[0]}
                <strong className="text-tinta-700">{tHome("groupsBodyParanal")}</strong>
                {tHome("groupsBody").split(tHome("groupsBodyParanal"))[1]}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <a
                href="/templates/grupo-reserva-ESO.xlsx"
                download="grupo-reserva-ESO.xlsx"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-tierra-600/30 bg-arena-50 px-4 py-2.5 text-xs font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-500/50 transition-all"
              >
                <Download className="size-3.5" />
                {tHome("groupsDownload")}
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tierra-700 px-4 py-2.5 text-xs font-semibold text-arena-50 hover:bg-tierra-600 transition-colors"
              >
                <Send className="size-3.5" />
                {tHome("groupsContact")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DiaguitaRule />

      {/* ══════════════════════════════════════════════════════
          4. PROCESO — 3 pasos compactos
      ══════════════════════════════════════════════════════ */}
      <section className="bg-arena-50 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-tinta-400 text-xs uppercase tracking-[0.2em] mb-7 font-franklin">
            {tHome("processTitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-tierra-500/10">
            {[
              {
                num: "1",
                title: tHome("step1Title"),
                desc: tHome("step1Desc"),
                icon: <MapPin className="size-4 text-tierra-500" />,
              },
              {
                num: "2",
                title: tHome("step2Title"),
                desc: tHome("step2Desc"),
                icon: <UserPlus className="size-4 text-tierra-500" />,
              },
              {
                num: "3",
                title: tHome("step3Title"),
                desc: tHome("step3Desc"),
                icon: <CalendarCheck className="size-4 text-cielo-600" />,
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 px-0 sm:px-7 py-5 sm:py-0 first:pl-0 last:pr-0">
                <span
                  className="font-playfair text-4xl font-black text-tierra-500/15 leading-none shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  {step.num}
                </span>
                <div>
                  <div className="mb-1.5">{step.icon}</div>
                  <h3 className="text-sm font-semibold text-tinta-800 mb-1">{step.title}</h3>
                  <p className="text-xs text-tinta-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DiaguitaRule />

      {/* ══════════════════════════════════════════════════════
          5. PORTAL DEL VISITANTE
          Cards son links — UX correcta: lo que parece clickeable, lo es.
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start mb-10">
            <div>
              <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] mb-2 font-franklin">
                {tHome("portalBadge")}
              </p>
              <h2 className="font-playfair text-2xl lg:text-3xl font-black text-tinta-900 mb-2">
                {tHome("portalTitle")}
              </h2>
              <p className="text-tinta-500 text-sm leading-relaxed max-w-xl">
                {tHome("portalSubtitlePre")}{" "}
                <span className="font-mono text-tinta-700 bg-arena-100 px-1.5 py-0.5 rounded text-xs">
                  ESO-XXXXXXXX
                </span>{" "}
                {tHome("portalSubtitlePost")}
              </p>
            </div>
            <Link
              href="/mi-reserva"
              className="inline-flex items-center gap-2 rounded-2xl bg-tierra-700 px-6 py-3.5 text-sm font-semibold text-arena-50 hover:bg-tierra-600 transition-colors active:scale-[0.97] shrink-0 shadow-[0_4px_16px_rgba(107,58,12,0.25)]"
            >
              <CalendarCheck className="size-4" />
              {tHome("portalCta")}
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Cards — todas son links a /mi-reserva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <CheckCircle2 className="size-5 text-cielo-600" />,
                title: tHome("cap1Title"),
                desc: tHome("cap1Desc"),
                bg: "bg-cielo-100/60",
                border: "border-cielo-200",
                ring: "hover:ring-cielo-300/50",
              },
              {
                icon: <UserPlus className="size-5 text-tierra-600" />,
                title: tHome("cap2Title"),
                desc: tHome("cap2Desc"),
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
                ring: "hover:ring-tierra-300/50",
              },
              {
                icon: <CalendarCheck className="size-5 text-tierra-600" />,
                title: tHome("cap3Title"),
                desc: tHome("cap3Desc"),
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
                ring: "hover:ring-tierra-300/50",
              },
              {
                icon: <XCircle className="size-5 text-tinta-500" />,
                title: tHome("cap4Title"),
                desc: tHome("cap4Desc"),
                bg: "bg-stone-50",
                border: "border-stone-200",
                ring: "hover:ring-stone-300/50",
              },
            ].map((cap) => (
              <Link
                key={cap.title}
                href="/mi-reserva"
                className={`group rounded-2xl border p-5 transition-all hover:ring-2 hover:-translate-y-0.5 ${cap.bg} ${cap.border} ${cap.ring}`}
              >
                <div className="mb-3">{cap.icon}</div>
                <h3 className="text-sm font-semibold text-tinta-800 mb-1.5 group-hover:text-tierra-700 transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-tinta-500 leading-relaxed">{cap.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-tierra-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{tHome("portalLink")}</span>
                  <ChevronRight className="size-3" />
                </div>
              </Link>
            ))}
          </div>

          {/* Deadline banner */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-tierra-500/20 bg-tierra-50/60 px-5 py-4">
            <AlertTriangle className="size-4 text-tierra-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-tierra-800">
                {tHome("deadlineTitle")}
              </p>
              <p className="text-xs text-tierra-600 mt-0.5 leading-relaxed">
                {tHome("deadlineBody")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <DiaguitaRule />

      {/* ══════════════════════════════════════════════════════
          6. FAQ — autoservicio que elimina tickets de soporte
      ══════════════════════════════════════════════════════ */}
      <section className="bg-arena-100 px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          <div>
            <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] mb-2 font-franklin">
              {tHome("faqBadge")}
            </p>
            <h2 className="font-playfair text-2xl font-black text-tinta-900 leading-snug">
              {tHome("faqTitle")}
            </h2>
            <p className="text-tinta-500 text-xs mt-3 leading-relaxed">
              {tHome("faqHelpPre")}{" "}
              <span className="text-tierra-600 font-medium">{tHome("faqHelpChat")}</span>{" "}
              {tHome("faqHelpPost")}
            </p>
          </div>

          <div className="divide-y divide-tierra-500/10">
            <FaqItem
              q={tHome("faq1q")}
              a={tHome("faq1a")}
            />
            <FaqItem
              q={tHome("faq2q")}
              a={tHome("faq2a")}
            />
            <FaqItem
              q={tHome("faq3q")}
              a={tHome("faq3a")}
            />
            <FaqItem
              q={tHome("faq4q")}
              a={tHome("faq4a")}
            />
            <FaqItem
              q={tHome("faq5q")}
              a={tHome("faq5a")}
            />
            <FaqItem
              q={tHome("faq6q")}
              a={
                <>
                  <strong className="text-tinta-700">{tHome("faq6aparanal")}</strong>
                  {" "}{tHome("faq6aparanalDesc")}
                  <br /><br />
                  <strong className="text-tinta-700">{tHome("faq6asilla")}</strong>
                  {" "}{tHome("faq6asillaDesc")}
                </>
              }
            />
            <FaqItem
              q={tHome("faq7q")}
              a={tHome("faq7a")}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. FOOTER — sin email expuesto, solo formulario de contacto
      ══════════════════════════════════════════════════════ */}
      <footer className="bg-tinta-900 border-t border-white/5 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-playfair font-bold text-arena-100 mb-1">
              {tHome("footerBrand")}
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-1.5 text-xs text-arena-500 hover:text-arena-300 transition-colors"
            >
              <Mail className="size-3 shrink-0" />
              {tHome("footerContact")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-arena-500">
            <Link href="/mi-reserva" className="hover:text-arena-200 transition-colors">
              {tHome("footerMyBooking")}
            </Link>
            <Link href="/contacto" className="hover:text-arena-200 transition-colors">
              {tHome("footerContactLink")}
            </Link>
            <Link href="/privacidad" className="hover:text-arena-200 transition-colors">
              {tHome("footerPrivacy")}
            </Link>
            <Link href="/terminos" className="hover:text-arena-200 transition-colors">
              {tHome("footerTerms")}
            </Link>
            <span className="text-arena-500/40">
              &copy; {new Date().getFullYear()} ESO Chile
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
