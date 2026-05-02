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

      {/* ══════════════════════════════════════════════════════
          2. BARRA DE REGLAS — 3 reglas clave, sin repetir gratuita
      ══════════════════════════════════════════════════════ */}
      <div className="bg-tierra-700 text-arena-100 px-8 py-3 lg:px-16 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex items-center gap-6 text-xs whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-tierra-300 shrink-0" />
            Máx. 10 personas por reserva individual
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
            Paso 1 de 3 — Selecciona el observatorio
          </p>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ObservatoryCard
              slug="PARANAL"
              name={tObs("PARANAL")}
              region={tObs("paranal_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description="En 2024 detectó 32 protoestrellas en erupción y fotografió la supernova SN 2024ggi solo 26 horas tras su detección. El primer observatorio en fotografiar directamente un exoplaneta (2004)."
              schedule="09:30–13:00 · 13:30–17:00"
              minAge="4 años mínimo"
            />
            <ObservatoryCard
              slug="LA_SILLA"
              name={tObs("LA_SILLA")}
              region={tObs("lasilla_region")}
              size="large"
              reserveLabel={t("reserveButton")}
              description="HARPS, el espectrógrafo más preciso del mundo para detectar exoplanetas, opera aquí. En diciembre de 2025 el nuevo instrumento SOXS realizó sus primeras observaciones, abriendo el estudio de eventos astrofísicos rápidos."
              schedule="09:30–13:00 (abr–ago) · +13:30 (sep–mar)"
              minAge="8 años (período invernal)"
            />
          </div>

          {/* ── Grupos de más de 10 personas ─────────────── */}
          <div className="mt-5 rounded-2xl border border-tierra-500/15 bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="size-4 text-tierra-500 shrink-0" />
                <h2 className="text-sm font-semibold text-tinta-800">
                  ¿Grupo de más de 10 personas?
                </h2>
              </div>
              <p className="text-xs text-tinta-500 leading-relaxed max-w-lg">
                Cursos universitarios, colegios, empresas —{" "}
                <strong className="text-tinta-700">hasta 40 cupos en La Silla</strong> y{" "}
                <strong className="text-tinta-700">hasta 60 cupos en Paranal</strong>.
                Las visitas grupales operan los sábados en temporada de invierno.
                Descarga la planilla, complétala con los datos del grupo y envíala
                solicitando tu fecha. El equipo ESO coordinará directamente contigo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <a
                href="/templates/grupo-reserva.csv"
                download="grupo-reserva-ESO.csv"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-tierra-600/30 bg-arena-50 px-4 py-2.5 text-xs font-medium text-tierra-700 hover:bg-arena-100 hover:border-tierra-500/50 transition-all"
              >
                <Download className="size-3.5" />
                Descargar planilla
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tierra-700 px-4 py-2.5 text-xs font-semibold text-arena-50 hover:bg-tierra-600 transition-colors"
              >
                <Send className="size-3.5" />
                Solicitar visita grupal
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
            Cómo completar tu reserva
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-tierra-500/10">
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

      {/* ══════════════════════════════════════════════════════
          5. PORTAL DEL VISITANTE
          Cards son links — UX correcta: lo que parece clickeable, lo es.
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white px-8 py-14 lg:px-16">
        <div className="mx-auto max-w-6xl">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start mb-10">
            <div>
              <p className="text-tierra-500 text-xs uppercase tracking-[0.2em] mb-2 font-franklin">
                Portal del visitante
              </p>
              <h2 className="font-playfair text-2xl lg:text-3xl font-black text-tinta-900 mb-2">
                ¿Ya tienes una reserva?
              </h2>
              <p className="text-tinta-500 text-sm leading-relaxed max-w-xl">
                Gestiona todo desde un solo lugar con tu código{" "}
                <span className="font-mono text-tinta-700 bg-arena-100 px-1.5 py-0.5 rounded text-xs">
                  ESO-XXXXXXXX
                </span>{" "}
                que recibiste por email. Sin login, sin contraseña — solo tu código y
                los últimos 4 dígitos de tu documento.
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

          {/* Cards — todas son links a /mi-reserva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <CheckCircle2 className="size-5 text-cielo-600" />,
                title: "Ver estado",
                desc: "Consulta si tu reserva está pendiente de confirmación, confirmada o anulada.",
                bg: "bg-cielo-100/60",
                border: "border-cielo-200",
                ring: "hover:ring-cielo-300/50",
              },
              {
                icon: <UserPlus className="size-5 text-tierra-600" />,
                title: "Modificar acompañantes",
                desc: "Agrega o elimina personas de tu grupo. Cada cambio reinicia el plazo de confirmación.",
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
                ring: "hover:ring-tierra-300/50",
              },
              {
                icon: <CalendarCheck className="size-5 text-tierra-600" />,
                title: "Confirmar asistencia",
                desc: "Confirma que asistirás antes del viernes 12:00. Sin confirmación, el cupo se libera.",
                bg: "bg-arena-100/80",
                border: "border-tierra-200/60",
                ring: "hover:ring-tierra-300/50",
              },
              {
                icon: <XCircle className="size-5 text-tinta-500" />,
                title: "Cancelar reserva",
                desc: "Cancela si tus planes cambian. Solo es posible antes del viernes anterior a la visita.",
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
                  <span>Ir al portal</span>
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
                Plazo límite: viernes anterior a tu visita, 12:00 h (hora Santiago)
              </p>
              <p className="text-xs text-tierra-600 mt-0.5 leading-relaxed">
                Pasado ese momento, el sistema cierra la ventana de modificación automáticamente.
                Solo el equipo ESO puede hacer cambios después de esa hora.
                Si no confirmas, el cupo queda libre para otros visitantes.
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
              Preguntas frecuentes
            </p>
            <h2 className="font-playfair text-2xl font-black text-tinta-900 leading-snug">
              Todo lo que necesitas saber
            </h2>
            <p className="text-tinta-500 text-xs mt-3 leading-relaxed">
              Si no encuentras tu respuesta, usa el formulario de contacto o el{" "}
              <span className="text-tierra-600 font-medium">chat de asistencia</span>{" "}
              en la esquina inferior derecha.
            </p>
          </div>

          <div className="divide-y divide-tierra-500/10">
            <FaqItem
              q="¿Cuántas personas puedo incluir en una reserva individual?"
              a="Máximo 10 personas. Si tu grupo supera ese número (cursos, colegios, visitas empresariales), usa el flujo de reserva grupal: descarga la planilla desde la sección de observatorios y solicita tu visita a través del formulario de grupos."
            />
            <FaqItem
              q="¿Hasta cuándo puedo modificar o cancelar?"
              a="Hasta el viernes anterior a la fecha de visita, antes de las 12:00 h hora de Santiago. Pasado ese momento, el sistema cierra la ventana automáticamente. Solo el equipo ESO puede hacer cambios después de esa hora."
            />
            <FaqItem
              q="¿Qué pasa si no confirmo mi asistencia?"
              a="El sistema anula automáticamente tu reserva y libera los cupos para otros visitantes. Recibirás un recordatorio por email antes del plazo. La confirmación es obligatoria y debe hacerse desde el portal Mi Reserva con tu código ESO-XXXXXXXX."
            />
            <FaqItem
              q="¿Puedo agregar o quitar acompañantes después de reservar?"
              a="Sí. Desde Mi Reserva puedes agregar personas si hay cupos disponibles en el turno, o eliminar acompañantes en cualquier momento (sin restricción de cupos para eliminaciones). Cada modificación reinicia el estado de confirmación a Pendiente."
            />
            <FaqItem
              q="¿Hay edad mínima para las visitas?"
              a="En Paranal: 4 años mínimo. En La Silla durante el período invernal (abril–agosto): 8 años mínimo. En período estival (septiembre–marzo) ambos observatorios reciben familias con niños pequeños."
            />
            <FaqItem
              q="¿Qué diferencia hay entre Paranal y La Silla?"
              a={
                <>
                  <strong className="text-tinta-700">Paranal</strong> alberga el VLT (Very Large Telescope) — cuatro telescopios de 8,2 metros que operan como un solo instrumento. En 2024 detectó 32 protoestrellas en erupción y fotografió la supernova SN 2024ggi solo 26 horas después de su detección. Hasta 60 cupos por visita. Opera los sábados en temporada de invierno; en verano el calendario es variable según lo que defina el equipo ESO.
                  <br /><br />
                  <strong className="text-tinta-700">La Silla</strong> opera HARPS, el espectrógrafo más preciso para detectar exoplanetas de baja masa. En 2025 sumó SOXS, instrumento de nueva generación para el estudio de transitorios astrofísicos rápidos. Hasta 40 cupos por visita. Opera los sábados en temporada de invierno; en verano el calendario puede abrirse a días adicionales según disponibilidad ESO.
                </>
              }
            />
            <FaqItem
              q="¿Cómo llego? ¿Hay transporte oficial?"
              a="ESO no provee transporte. Paranal está a ~130 km al sur de Antofagasta por la Ruta 1. La Silla está a ~160 km al norte de La Serena. Se requiere vehículo propio. ESO envía instrucciones de acceso detalladas al confirmar tu reserva."
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
              Observatorios ESO Chile
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-1.5 text-xs text-arena-500 hover:text-arena-300 transition-colors"
            >
              <Mail className="size-3 shrink-0" />
              Formulario de contacto
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-arena-500">
            <Link href="/mi-reserva" className="hover:text-arena-200 transition-colors">
              Mi reserva
            </Link>
            <Link href="/contacto" className="hover:text-arena-200 transition-colors">
              Contacto
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
