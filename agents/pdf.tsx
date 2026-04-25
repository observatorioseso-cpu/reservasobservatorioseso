/**
 * Agente 4: Generador de PDF de reserva
 *
 * Produce un PDF A4 con los datos de la reserva, un QR que apunta al portal
 * del cliente y el listado de acompañantes. Solo funciona en servidor.
 *
 * Exports:
 *   generarPDFReserva(datos)     — a partir de datos ya cargados
 *   generarPDFPorToken(token)    — carga la reserva y llama al anterior
 */

import { renderToBuffer } from "@react-pdf/renderer"
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { DocumentProps } from "@react-pdf/renderer"
import React from "react"
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface DatosReservaPDF {
  shortId: string
  token: string
  nombre: string
  apellido: string
  rutOPasaporte: string
  email: string
  telefono: string
  observatorio: "LA_SILLA" | "PARANAL"
  fecha: string        // "YYYY-MM-DD"
  horaInicio: string   // "09:30"
  horaFin: string      // "13:00"
  idioma: "ES" | "EN"
  cantidadPersonas: number
  acompanantes: Array<{ nombre: string; apellido: string; documento?: string | null }>
  locale: "es" | "en"
}

// ---------------------------------------------------------------------------
// Helpers de texto
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reservasobservatorioseso.cl"

function nombreObservatorio(obs: "LA_SILLA" | "PARANAL"): string {
  return obs === "LA_SILLA" ? "La Silla" : "Paranal (VLT)"
}

function regionObservatorio(obs: "LA_SILLA" | "PARANAL"): string {
  return obs === "LA_SILLA" ? "Región de Coquimbo" : "Región de Antofagasta"
}

function formatearFecha(fecha: string): string {
  const d = new Date(fecha + "T12:00:00Z")
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Santiago",
  }).format(d)
}

function labelIdioma(idioma: "ES" | "EN"): string {
  return idioma === "ES" ? "Español" : "English"
}

// ---------------------------------------------------------------------------
// Estilos @react-pdf (puntos PDF, NO Tailwind)
// ---------------------------------------------------------------------------

const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1c1917",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: "#1c1917",
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "column",
    gap: 4,
  },
  headerOrg: {
    color: "#f59e0b",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  headerSub: {
    color: "#f5f5f4",
    fontSize: 10,
    marginTop: 2,
  },
  headerQr: {
    width: 90,
    height: 90,
  },

  // ── Separador ─────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
    marginHorizontal: 32,
    marginVertical: 12,
  },
  dividerAmber: {
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    marginHorizontal: 32,
    marginVertical: 0,
  },

  // ── Sección principal ─────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 32,
  },

  visitaLabel: {
    fontSize: 9,
    color: "#78716c",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  visitaTitulo: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1c1917",
    marginBottom: 2,
  },
  visitaRegion: {
    fontSize: 11,
    color: "#78716c",
    marginBottom: 16,
  },

  // ── Grid de datos de visita ───────────────────────────────────────────────
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginBottom: 4,
  },
  infoItem: {
    width: "50%",
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 8,
    color: "#78716c",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 12,
    color: "#1c1917",
    fontFamily: "Helvetica-Bold",
  },

  // ── Sección titular ───────────────────────────────────────────────────────
  seccionTitulo: {
    fontSize: 9,
    color: "#f59e0b",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },

  titularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  titularItem: {
    width: "50%",
    marginBottom: 10,
  },

  // ── Acompañantes ──────────────────────────────────────────────────────────
  acompTable: {
    marginTop: 4,
    marginBottom: 4,
  },
  acompFila: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f4",
  },
  acompFilaHeader: {
    backgroundColor: "#f5f5f4",
  },
  acompNum: {
    width: 24,
    fontSize: 9,
    color: "#78716c",
    fontFamily: "Helvetica-Bold",
  },
  acompNombre: {
    flex: 1,
    fontSize: 10,
    color: "#1c1917",
  },
  acompDoc: {
    width: 100,
    fontSize: 10,
    color: "#78716c",
  },
  acompHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#78716c",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Instrucciones ─────────────────────────────────────────────────────────
  instrBox: {
    backgroundColor: "#fef9ee",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  instrTitulo: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  instrLinea: {
    fontSize: 10,
    color: "#44403c",
    marginBottom: 3,
    lineHeight: 1.4,
  },

  // ── Pie de página ─────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c1917",
    paddingHorizontal: 32,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: "#78716c",
    fontSize: 8,
  },
  footerShortId: {
    color: "#f59e0b",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
})

// ---------------------------------------------------------------------------
// Componente React PDF
// ---------------------------------------------------------------------------

interface ReservaPDFProps {
  datos: DatosReservaPDF
  qrDataUrl: string
}

function ReservaPDF({ datos, qrDataUrl }: ReservaPDFProps): React.ReactElement {
  const fechaFormateada = formatearFecha(datos.fecha)

  return (
    <Document
      title={`Reserva ${datos.shortId} — ESO Observatorios`}
      author="ESO Chile"
      subject={`Visita guiada ${nombreObservatorio(datos.observatorio)}`}
      language={datos.locale}
    >
      <Page size="LETTER" style={S.page}>
        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerOrg}>ESO CHILE</Text>
            <Text style={S.headerSub}>Observatorios Astronómicos</Text>
            <Text style={[S.headerSub, { marginTop: 8, fontSize: 9, color: "#a8a29e" }]}>
              reservasobservatorioseso.cl
            </Text>
          </View>
          <Image src={qrDataUrl} style={S.headerQr} />
        </View>

        {/* Línea acento */}
        <View style={S.dividerAmber} />

        <View style={S.body}>
          {/* ── Título visita ── */}
          <Text style={S.visitaLabel}>Visita Guiada Gratuita</Text>
          <Text style={S.visitaTitulo}>{nombreObservatorio(datos.observatorio).toUpperCase()}</Text>
          <Text style={S.visitaRegion}>{regionObservatorio(datos.observatorio)}</Text>

          {/* ── Grid datos de visita ── */}
          <View style={S.infoGrid}>
            <View style={S.infoItem}>
              <Text style={S.infoLabel}>Fecha</Text>
              <Text style={S.infoValue}>{fechaFormateada}</Text>
            </View>
            <View style={S.infoItem}>
              <Text style={S.infoLabel}>Horario</Text>
              <Text style={S.infoValue}>{datos.horaInicio} – {datos.horaFin}</Text>
            </View>
            <View style={S.infoItem}>
              <Text style={S.infoLabel}>Idioma</Text>
              <Text style={S.infoValue}>{labelIdioma(datos.idioma)}</Text>
            </View>
            <View style={S.infoItem}>
              <Text style={S.infoLabel}>Total de personas</Text>
              <Text style={S.infoValue}>{datos.cantidadPersonas}</Text>
            </View>
          </View>

          <View style={S.divider} />

          {/* ── Titular ── */}
          <Text style={S.seccionTitulo}>Titular de la Reserva</Text>
          <View style={S.titularGrid}>
            <View style={S.titularItem}>
              <Text style={S.infoLabel}>Nombre completo</Text>
              <Text style={S.infoValue}>{datos.nombre} {datos.apellido}</Text>
            </View>
            <View style={S.titularItem}>
              <Text style={S.infoLabel}>Documento</Text>
              <Text style={S.infoValue}>{datos.rutOPasaporte}</Text>
            </View>
            <View style={S.titularItem}>
              <Text style={S.infoLabel}>Email</Text>
              <Text style={[S.infoValue, { fontSize: 10, color: "#44403c" }]}>{datos.email}</Text>
            </View>
            <View style={S.titularItem}>
              <Text style={S.infoLabel}>N.° de reserva</Text>
              <Text style={[S.infoValue, { color: "#f59e0b" }]}>{datos.shortId}</Text>
            </View>
          </View>

          {/* ── Acompañantes ── */}
          {datos.acompanantes.length > 0 && (
            <>
              <View style={S.divider} />
              <Text style={S.seccionTitulo}>Acompañantes</Text>
              <View style={S.acompTable}>
                {/* Encabezado tabla */}
                <View style={[S.acompFila, S.acompFilaHeader]}>
                  <Text style={[S.acompNum, S.acompHeaderText]}>#</Text>
                  <Text style={[S.acompNombre, S.acompHeaderText]}>Nombre</Text>
                  <Text style={[S.acompDoc, S.acompHeaderText]}>Documento</Text>
                </View>
                {datos.acompanantes.map((a, i) => (
                  <View key={i} style={S.acompFila}>
                    <Text style={S.acompNum}>{i + 1}</Text>
                    <Text style={S.acompNombre}>{a.nombre} {a.apellido}</Text>
                    <Text style={S.acompDoc}>{a.documento ?? "—"}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={S.divider} />

          {/* ── Instrucciones ── */}
          <View style={S.instrBox}>
            <Text style={S.instrTitulo}>Instrucciones de llegada</Text>
            <Text style={S.instrLinea}>
              Presente este documento (impreso o en pantalla) al llegar al observatorio.
            </Text>
            <Text style={S.instrLinea}>
              Llegue con al menos 15 minutos de anticipación. No se permite el ingreso tardío.
            </Text>
            <Text style={S.instrLinea}>
              Consultas y cambios: reservas@observatorioseso.cl
            </Text>
            <Text style={[S.instrLinea, { marginTop: 4, fontSize: 9, color: "#78716c" }]}>
              Gestione su reserva en: {BASE_URL}/{datos.locale}/mi-reserva/{datos.token}
            </Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>ESO Observatorios Chile — Visitas guiadas gratuitas</Text>
          <Text style={S.footerShortId}>{datos.shortId}</Text>
          <Text style={S.footerText}>Documento generado automáticamente</Text>
        </View>
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Función principal: generarPDFReserva
// ---------------------------------------------------------------------------

export async function generarPDFReserva(datos: DatosReservaPDF): Promise<Buffer> {
  const portalUrl = `${BASE_URL}/${datos.locale}/mi-reserva/${datos.token}`

  const qrDataUrl = await QRCode.toDataURL(portalUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#1c1917", light: "#ffffff" },
  })

  const element = (<ReservaPDF datos={datos} qrDataUrl={qrDataUrl} />) as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  return Buffer.from(buffer)
}

// ---------------------------------------------------------------------------
// Función de conveniencia: generarPDFPorToken
// ---------------------------------------------------------------------------

export async function generarPDFPorToken(token: string): Promise<Buffer | null> {
  const reserva = await prisma.reserva.findUnique({
    where: { token },
    include: {
      turno: true,
      acompanantes: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!reserva) return null

  const datos: DatosReservaPDF = {
    shortId: reserva.shortId,
    token: reserva.token,
    nombre: reserva.nombre,
    apellido: reserva.apellido,
    rutOPasaporte: reserva.rutOPasaporte,
    email: reserva.email,
    telefono: reserva.telefono,
    observatorio: reserva.observatorio,
    fecha: reserva.turno.fecha.toISOString().split("T")[0],
    horaInicio: reserva.turno.horaInicio,
    horaFin: reserva.turno.horaFin,
    idioma: reserva.idioma,
    cantidadPersonas: reserva.cantidadPersonas,
    acompanantes: reserva.acompanantes.map((a) => ({
      nombre: a.nombre,
      apellido: a.apellido,
      documento: a.documento,
    })),
    locale: reserva.locale as "es" | "en",
  }

  const pdfBuffer = await generarPDFReserva(datos)

  // Registrar log en background — no bloquear
  prisma.logAgente
    .create({
      data: {
        tipo: "PDF",
        reservaId: reserva.id,
        resultado: `PDF generado para ${reserva.shortId}`,
        metadata: { via: "generarPDFPorToken", bytes: pdfBuffer.byteLength },
      },
    })
    .catch((e: unknown) => console.error("[pdf] error al registrar log:", e))

  return pdfBuffer
}
