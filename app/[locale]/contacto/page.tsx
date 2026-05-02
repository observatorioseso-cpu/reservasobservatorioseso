import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import {
  ChevronLeft,
  Clock,
  Mail,
  Users,
  Download,
} from "lucide-react"
import { LandingNav } from "@/components/landing/LandingNav"
import { ContactForm } from "@/components/contacto/ContactForm"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"
).replace(/^﻿/, "").trim()

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const descriptions: Record<string, string> = {
  es: "Contacta al equipo ESO Chile para consultas generales o para solicitar una visita grupal a La Silla o Paranal.",
  en: "Contact the ESO Chile team for general enquiries or to request a group visit to La Silla or Paranal.",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const description = descriptions[locale] ?? descriptions.es
  const canonicalUrl = `${BASE_URL}/${locale}/contacto`

  return {
    title: "Contacto | ESO Observatorios Chile",
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: `${BASE_URL}/es/contacto`,
        en: `${BASE_URL}/en/contacto`,
      },
    },
    openGraph: {
      title: "Contacto | ESO Observatorios Chile",
      description,
      url: canonicalUrl,
      siteName: "ESO Observatorios Chile",
      locale: locale === "en" ? "en_US" : "es_CL",
      type: "website",
    },
  }
}

// ---------------------------------------------------------------------------
// Decorative Diaguita rule — reused from landing, kept local
// ---------------------------------------------------------------------------

function DiaguitaRule() {
  return (
    <div className="w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        className="w-full h-3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dgr-c"
            x="0"
            y="0"
            width="24"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points="12,1 23,6 12,11 1,6"
              fill="none"
              stroke="#B87020"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <circle cx="12" cy="6" r="1" fill="#B87020" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="1200" height="12" fill="url(#dgr-c)" />
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const tNav = await getTranslations({ locale, namespace: "nav" })

  return (
    <div className="min-h-[100dvh] bg-arena-50 text-tinta-900">
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── Navigation ── */}
      <LandingNav
        homeLabel={tNav("home")}
        myBookingLabel={tNav("myBooking")}
        locale={locale}
        lightBg
      />

      {/* ── Compact header ── */}
      <section className="topo-bg pt-24 pb-8 px-8 lg:px-16 border-b border-tierra-500/10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-tinta-400 hover:text-tierra-700 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="size-1.5 rounded-full bg-tierra-400 animate-pulse"
              aria-hidden="true"
            />
            <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] font-franklin">
              ESO Chile · Formulario de contacto
            </p>
          </div>
          <h1 className="font-playfair text-3xl lg:text-4xl font-black text-tinta-900 leading-tight">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="text-tinta-500 text-sm mt-2 max-w-md leading-relaxed">
            Usa el formulario de consulta general o solicita una visita para tu grupo.
            Respondemos en 2 a 3 días hábiles.
          </p>
        </div>
      </section>

      <DiaguitaRule />

      {/* ── Main two-column layout ── */}
      <main id="main-content" className="py-12 px-8 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-14 items-start">

          {/* ── Info panel ── */}
          <aside className="flex flex-col gap-6">
            {/* Response time */}
            <div className="rounded-2xl border border-tierra-500/15 bg-white p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-tierra-500 shrink-0" />
                <h2 className="text-sm font-semibold text-tinta-800">
                  Tiempo de respuesta
                </h2>
              </div>
              <p className="text-sm text-tinta-500 leading-relaxed">
                El equipo ESO revisa los mensajes de lunes a viernes y responde en{" "}
                <strong className="text-tinta-700">2 a 3 días hábiles</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-tinta-400">
                <Mail className="size-3.5 text-tierra-400" />
                reservas@observatorioseso.cl
              </div>
            </div>

            {/* Group visits */}
            <div className="rounded-2xl border border-tierra-500/15 bg-white p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-tierra-500 shrink-0" />
                <h2 className="text-sm font-semibold text-tinta-800">
                  Visitas grupales
                </h2>
              </div>
              <p className="text-sm text-tinta-500 leading-relaxed">
                Para grupos de 11 o más personas (colegios, universidades, empresas),
                selecciona la pestaña{" "}
                <strong className="text-tinta-700">Reserva grupal</strong> en el formulario.
                Descarga la planilla de participantes y adjúntala al responder nuestro email.
              </p>
              <a
                href="/templates/grupo-reserva.csv"
                download
                className="inline-flex items-center gap-2 rounded-full border border-tierra-600/30 bg-arena-50 px-4 py-2 text-xs font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-500/50 transition-all self-start"
              >
                <Download className="size-3.5" />
                Descargar planilla
              </a>
            </div>

            {/* Individual bookings reminder */}
            <div className="rounded-2xl border border-cielo-500/20 bg-cielo-100/40 p-5">
              <p className="text-xs text-tinta-500 leading-relaxed">
                Para reservas individuales de hasta 10 personas, usa directamente el{" "}
                <Link
                  href="/"
                  className="text-tierra-700 font-medium underline underline-offset-2 hover:text-tierra-600 transition-colors"
                >
                  sistema de reservas
                </Link>
                . Es mas rapido y recibes confirmacion instantanea.
              </p>
            </div>
          </aside>

          {/* ── Form panel ── */}
          <section aria-label="Formulario de contacto">
            <ContactForm />
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-tinta-900 border-t border-white/5 px-8 py-10 lg:px-16 mt-12">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-playfair font-bold text-arena-100 mb-1">
              Observatorios ESO Chile
            </p>
            <p className="text-xs text-arena-500">
              Formulario de contacto
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-arena-500">
            <Link href="/" className="hover:text-arena-200 transition-colors">
              Inicio
            </Link>
            <Link href="/mi-reserva" className="hover:text-arena-200 transition-colors">
              Mi reserva
            </Link>
            <Link href="/privacidad" className="hover:text-arena-200 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-arena-200 transition-colors">
              Terminos
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
