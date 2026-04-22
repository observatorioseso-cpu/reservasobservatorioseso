import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: { default: "Admin | ESO Chile", template: "%s | Admin ESO" },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-sans min-h-[100dvh] bg-stone-950 text-stone-100 antialiased`}>
      {children}
    </div>
  )
}
