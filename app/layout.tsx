import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://reservasobservatorioseso.cl"),
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
