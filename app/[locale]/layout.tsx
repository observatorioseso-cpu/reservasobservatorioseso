import { Playfair_Display, Libre_Franklin } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { ChatWidget } from "@/components/chat/ChatWidget"
import "../globals.css"

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
        <NextIntlClientProvider messages={messages}>
          {children}
          <ChatWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
