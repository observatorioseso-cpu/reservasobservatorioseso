import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AdminThemeProvider } from "@/contexts/adminTheme"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: { default: "Admin | ESO Chile", template: "%s | Admin ESO" },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-sans min-h-[100dvh] antialiased`}>
      <AdminThemeProvider>
        {children}
      </AdminThemeProvider>
    </div>
  )
}
