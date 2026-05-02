import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import type { Metadata } from "next"
import {
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Mail,
  CheckCircle2,
  UserPlus,
  XCircle,
  CalendarCheck,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"
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

// ── Diaguita separator — thin decorative rule between sections ──
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

// ── Inline FAQ item — uses native <details> for zero-JS accordion ──
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-tierra-500/10 last:border-0">
      <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-sm font-medium text-tinta-800 hover:text-tierra-700 transition-colors select-none">
        {q}
        <ChevronDown className="size-4 text-tierra-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-sm text-tinta-500 leading-relaxed">{a}</p>
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

  const orgSchema = organizationSchema()

  return (
    <div className="min-h-[100dvh] bg-arena-50 text-tinta-900">

      <div className="grain-overlay" aria-hidden="true" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* Nav always light — no dark hero on this page */}
      <LandingNav
        homeLabel={tNav("home")}
        myBookingLabel={tNav("myBooking")}
        locale={locale}
        lightBg
      />

      {/* ════════════════════════════════════════════════════════
          1. CABECERA COMPACTA — propósito claro, sin preámbulos
      ════════════════════════════════════════════════════════ */}
      <section className="topo-bg pt-24 pb-8 px-8 lg:px-16 border-b border-tierra-500/10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">

          {/* Left: título funcional */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-1.5 rounded-full bg-tierra-400 animate-pulse" aria-hidden="true" />
              <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] font-franklin">
                ESO Chile · Entrada gratuita
              </p>
            </div>
            <h1 className="font-playfair text-3xl lg:text-4xl font-black text-tinta-900 leading-tight">
              Reserva tu visita guiada
            </h1>
            <p className="text-tinta-500 text-sm mt-2 max-w-md leading-relaxed">
              Selecciona un observatorio, elige tu fecha y completa el registro.
              Todo el proceso tarda menos de 3 minutos.
            </p>
          </div>

          {/* Right: acceso rápido a reserva existente */}
          <div className="shrink-0">
            <Link
              href="/mi-reserva"
              className="inline-flex items-center gap-2 rounded-full border border-tierra-600/30 bg-white px-5 py-2.5 text-sm font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-600/50 transition-all shadow-sm"
            >
              <CalendarCheck className="size-4 text-tierra-500" />
              Ver mi reserva
              <ChevronRight className="size-3.5 text-tierra-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          2. BARRA DE REGLAS — información crítica a primera vista
      ════════════════════════════════════════════════════════ */}
      <div className="bg-tierra-700 text-arena-100 px-8 py-3 lg:px-16 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex items-center gap-6 text-xs whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-tierra-300 shrink-0" />
            Máx. 10 personas por reserva
          </span>
          <span className="text-tierra-500" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-tierra-300 shrink-0" />
            Confirmar antes del viernes 12:00 Santiago
          </span>
          <span className="text-tierra-500" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="size-3.5 text-tierra-300 shrink-0" />
            Modificable hasta el viernes 12:00
          </span>
          <span className="text-tierra-500" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-tierra-300 shrink-0" />
            Entrada completamente gratuita
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          3. SELECCIÓN DE OBSERVATORIO — el corazón de la página
          Primera acción visible sin hacer scroll
      ════════════════════════════════════════════════════════ */}
      <section id="observatorios" className="bg-arena-100 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl">

          <p className="text-tinta-400 text-xs uppercase tracking-[0.2em] mb-6 font-franklin">
            Paso 1 de 3 — Selecciona el observatorio
          </p>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ObservatoryCard
              slug="PARANAL"
              name={tObs("PARANAL")}
              region={tObs("paranal_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description="El Very Large Telescope — cuatro telescopios de 8,2 m en el desierto de Atacama. Visitas sábados y domingos programados por ESO."
              schedule="09:30–13:00 · 13:30–17:00"
              minAge="4 años mínimo"
            />
            <ObservatoryCard
              slug="LA_SILLA"
              name={tObs("LA_SILLA")}
              region={tObs("lasilla_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description="El primer observatorio ESO en Chile, desde 1969. Telescopios históricos a 2.400 m.s.n.m., a 600 km al norte de Santiago. Solo sábados."
              schedule="09:30–13:00 (abr–ago) · +13:30 (sep–mar)"
              minAge="8 años (invierno)"
            />
          </div>
        </div>
      </section>

      <DiaguitaRule />

      {/* ════════════════════════════════════════════════════════
          4. PROCESO — 3 pasos compactos, sin relleno
      ════════════════════════════════════════════════════════ */}
      <section className="bg-arena-50 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl">

          <p className="text-tinta-400 text-xs uppercase tracking-[0.2em] mb-7 font-franklin">
            Cómo completar tu reserva
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-tierra-500/10">
            {[
              {
                num: "1",
                title: "Elige observatorio y fecha",
                desc: "Selecciona arriba. Verás el calendario con fechas y turnos disponibles en tiempo real.",
                icon: <MapPin className="size-4 text-tierra-500" />,
              },
              {
                num: "2",
                title: "Completa el registro",
                desc: "Ingresa tus datos y los de tus acompañantes (máx. 10 personas). Recibirás confirmación por email.",
                icon: <UserPlus className="size-4 text-tierra-500" />,
              },
              {
                num: "3",
                title: "Confirma antes del viernes",
                desc: "Recibirás un recordatorio automático. Confirma antes del viernes 12:00 para asegurar tu cupo.",
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

      {/* ════════════════════════════════════════════════════════
          5. PORTAL DEL VISITANTE — espacio cliente de alto valor
          Reducción real de tickets y consultas de soporte
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl">

          {/* Header + CTA principal */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start mb-10">
            <div>
              <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] mb-2 font-franklin">
                Portal del visitante
              </p>
              <h2 className="font-playfair text-2xl lg:text-3xl font-black text-tinta-900 mb-2">
                ¿Ya tienes una reserva?
              </h2>
              <p className="text-tinta-500 text-sm leading-relaxed max-w-xl">
                Gestiona todo desde un solo lugar con tu código de reserva{" "}
                <span className="font-mono text-tinta-700 bg-arena-100 px-1.5 py-0.5 rounded text-xs">
                  ESO-XXXXXXXX
                </span>{" "}
                que recibiste por email. Sin login, sin contraseñas — solo tu código y
                los datos de tu reserva.
              </p>
            </div>
            <Link
              href="/mi-reserva"
              className="inline-flex items-center gap-2 rounded-2xl bg-tierra-700 px-6 py-3.5 text-sm font-semibold text-arena-50 hover:bg-tierra-600 transition-colors active:scale-[0.97] shrink-0 shadow-[0_4px_16px_rgba(107,58,12,0.25)]"
            >
              <CalendarCheck className="size-4" />
              Acceder a mi reserva
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Capacidades del portal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <CheckCircle2 className="size-5 text-cielo-600" />,
                title: "Ver estado",
                desc: "Consulta si tu reserva está pendiente de confirmación, confirmada o anulada.",
                bg: "bg-cielo-100/60",
                border: "border-cielo-200",
              },
              {
                icon: <UserPlus className="size-5 text-tierra-600" />,
                title: "Modificar acompañantes",
                desc: "Agrega o elimina personas de tu grupo. Cada cambio reinicia el plazo de confirmación.",
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
              },
              {
                icon: <CalendarCheck className="size-5 text-tierra-600" />,
                title: "Confirmar asistencia",
                desc: "Confirma que asistirás antes del viernes 12:00. Sin confirmación, el cupo se libera.",
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
              },
              {
                icon: <XCircle className="size-5 text-tinta-500" />,
                title: "Cancelar reserva",
                desc: "Cancela si tus planes cambian. Solo es posible antes del viernes anterior a la visita.",
                bg: "bg-stone-50",
                border: "border-stone-200",
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className={`rounded-2xl border p-5 ${cap.bg} ${cap.border}`}
              >
                <div className="mb-3">{cap.icon}</div>
                <h3 className="text-sm font-semibold text-tinta-800 mb-1.5">{cap.title}</h3>
                <p className="text-xs text-tinta-500 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* Deadline visual — la regla más importante */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-tierra-500/20 bg-tierra-50/60 px-5 py-4">
            <AlertTriangle className="size-4 text-tierra-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-tierra-800">
                Plazo límite: viernes anterior a tu visita, 12:00 h (hora Santiago)
              </p>
              <p className="text-xs text-tierra-600 mt-0.5 leading-relaxed">
                Pasado ese momento, el sistema cierra automáticamente la ventana de modificación.
                Solo el equipo ESO puede hacer cambios después de esa hora. Si no confirmas, el cupo queda libre para otros visitantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <DiaguitaRule />

      {/* ════════════════════════════════════════════════════════
          6. PREGUNTAS FRECUENTES — autoservicio que evita tickets
      ════════════════════════════════════════════════════════ */}
      <section className="bg-arena-100 px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">

          {/* Left: label */}
          <div>
            <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] mb-2 font-franklin">
              Preguntas frecuentes
            </p>
            <h2 className="font-playfair text-2xl font-black text-tinta-900 leading-snug">
              Todo lo que necesitas saber
            </h2>
            <p className="text-tinta-500 text-xs mt-3 leading-relaxed">
              Si no encuentras tu respuesta, escríbenos a{" "}
              <a
                href="mailto:reservas@observatorioseso.cl"
                className="text-tierra-600 underline underline-offset-2 hover:text-tierra-800 transition-colors"
              >
                reservas@observatorioseso.cl
              </a>
            </p>
          </div>

          {/* Right: FAQ items */}
          <div className="divide-y divide-tierra-500/10">
            <FaqItem
              q="¿Cuántas personas puedo incluir en una reserva?"
              a="Máximo 10 personas por reserva de cliente. Si tu grupo supera las 10 personas, debes enviar un email a reservas@observatorioseso.cl para coordinarlo directamente con el equipo ESO."
            />
            <FaqItem
              q="¿Hasta cuándo puedo modificar o cancelar?"
              a="Puedes modificar o cancelar tu reserva hasta el viernes anterior a la fecha de visita, antes de las 12:00 h hora de Santiago. Después de ese momento, el sistema cierra la ventana automáticamente y solo el equipo ESO puede hacer cambios."
            />
            <FaqItem
              q="¿Qué pasa si no confirmo mi asistencia?"
              a="Si no confirmas antes del viernes 12:00, el sistema anula automáticamente tu reserva y libera los cupos para otros visitantes. Recibirás un recordatorio por email antes del plazo."
            />
            <FaqItem
              q="¿Puedo agregar o quitar acompañantes después de reservar?"
              a="Sí. Desde el Portal del Visitante (Mi Reserva) puedes agregar personas si hay cupos disponibles en el turno, o eliminar acompañantes en cualquier momento. Cada modificación reinicia el estado de confirmación a Pendiente."
            />
            <FaqItem
              q="¿Hay edad mínima para las visitas?"
              a="En Paranal: 4 años mínimo. En La Silla durante el período invernal (abril–agosto): 8 años mínimo. En período de verano (septiembre–marzo) La Silla no tiene restricción de edad indicada, pero se recomienda consultar."
            />
            <FaqItem
              q="¿La visita es realmente gratuita? ¿Hay que pagar algo?"
              a="Sí, la entrada a ambos observatorios es completamente gratuita. La ESO ofrece estas visitas como parte de su programa de divulgación científica. Solo debes cubrir tu propio transporte y alojamiento si es necesario."
            />
            <FaqItem
              q="¿Qué diferencia hay entre Paranal y La Silla?"
              a="Paranal alberga el VLT (Very Large Telescope), el conjunto de telescopios ópticos más potente del mundo. Se ubica en Antofagasta. La Silla es el observatorio histórico de ESO desde 1969, en la Región de Coquimbo, con más de 15 telescopios activos. Paranal opera sábados y domingos según calendario ESO; La Silla solo los sábados."
            />
            <FaqItem
              q="¿Cómo llego al observatorio? ¿Hay transporte oficial?"
              a="ESO no provee transporte. Paranal se encuentra a ~130 km al sur de Antofagasta por la Ruta 1. La Silla está a ~160 km al norte de La Serena. Debes llegar en vehículo propio. ESO proporciona instrucciones detalladas de acceso al confirmar tu reserva."
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          7. FOOTER — compacto, funcional
      ════════════════════════════════════════════════════════ */}
      <footer className="bg-tinta-900 border-t border-white/5 px-8 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-playfair font-bold text-arena-100 mb-0.5">
              Observatorios ESO Chile
            </p>
            <a
              href="mailto:reservas@observatorioseso.cl"
              className="inline-flex items-center gap-1.5 text-xs text-arena-500 hover:text-arena-300 transition-colors"
            >
              <Mail className="size-3" />
              reservas@observatorioseso.cl
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-arena-500">
            <Link href="/mi-reserva" className="hover:text-arena-200 transition-colors">
              Mi reserva
            </Link>
            <Link href="/privacidad" className="hover:text-arena-200 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-arena-200 transition-colors">
              Términos
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
