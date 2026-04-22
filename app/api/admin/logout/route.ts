import { NextResponse } from "next/server"
import { clearAdminCookie } from "@/lib/adminAuth"

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true })
  clearAdminCookie(response)
  return response
}
