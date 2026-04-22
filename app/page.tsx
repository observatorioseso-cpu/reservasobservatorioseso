import { redirect } from "next/navigation"

// La raíz redirige al locale por defecto (next-intl lo maneja en middleware,
// pero este fallback evita 404 si alguien llega directamente a "/")
export default function RootPage() {
  redirect("/es")
}
