import { Playfair_Display, Libre_Franklin } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { ChatWidget } from "@/components/chat/ChatWidget"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata, Viewport } from "next"
import "../globals.css"

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://reservasobservatorioseso.cl"
).replace(/^﻿/, "").trim()

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#f59e0b",
}

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-franklin",
  display: "swap",
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${libreFranklin.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-stone-950 text-stone-100 font-franklin antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          {locale === "en" ? "Skip to main content" : "Saltar al contenido principal"}
        </a>
        <NextIntlClientProvider messages={messages}>
          <div id="main">
            {children}
          </div>
          <ChatWidget />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
