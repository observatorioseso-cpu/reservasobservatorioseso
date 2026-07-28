import type { Metadata } from "next"
import "./globals.css"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://reservasobservatorioseso.cl"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Reservas Observatorios ESO Chile",
    template: "%s | ESO Chile",
  },
  description:
    "Sistema oficial de reservas para visitas gratuitas a los Observatorios ESO La Silla y Paranal.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
