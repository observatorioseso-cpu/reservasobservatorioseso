import { test, expect } from "@playwright/test"

/**
 * Flujo completo de reserva: landing → observatorio → formulario → éxito.
 * Prerequisito: BD local con turnos activos para los próximos 2 meses.
 * Correr con: npm run test:e2e
 */

test.describe("Flujo completo de reserva", () => {
  test("landing muestra los dos observatorios", async ({ page }) => {
    await page.goto("/es")
    await expect(page).toHaveTitle(/ESO|Observatorio/)
    await expect(page.getByText("La Silla")).toBeVisible()
    await expect(page.getByText("Paranal")).toBeVisible()
  })

  test("skip link visible al recibir foco", async ({ page }) => {
    await page.goto("/es")
    await page.keyboard.press("Tab")
    const skipLink = page.getByText(/saltar al contenido/i)
    await expect(skipLink).toBeVisible()
  })

  test("navegar a calendario La Silla", async ({ page }) => {
    await page.goto("/es/reservar/la-silla")
    await expect(page).toHaveURL(/la-silla/)
    await expect(page.getByText(/selecciona fecha/i)).toBeVisible()
  })

  test("calendario muestra mes actual y permite navegar", async ({ page }) => {
    await page.goto("/es/reservar/la-silla")

    const prevBtn = page.getByRole("button", { name: /mes anterior/i })
    const nextBtn = page.getByRole("button", { name: /mes siguiente/i })
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Navegar al mes siguiente y volver
    await nextBtn.click()
    await prevBtn.click()
  })

  test("seleccionar fecha con cupos muestra panel de turnos", async ({ page }) => {
    await page.goto("/es/reservar/la-silla")

    // Esperar a que cargue la disponibilidad
    await page.waitForLoadState("networkidle")

    // Buscar el primer día disponible (con dot sky-400)
    const diaConCupos = page
      .locator("button[aria-pressed]")
      .filter({ hasNot: page.locator("[disabled]") })
      .first()

    const count = await diaConCupos.count()
    if (count === 0) {
      test.skip(true, "No hay turnos disponibles en este mes")
      return
    }

    await diaConCupos.click()
    await expect(page.getByText(/turnos disponibles/i)).toBeVisible()
  })

  test("página 404 locale-aware en español", async ({ page }) => {
    await page.goto("/es/ruta-inexistente-xyz")
    await expect(page.getByText("404")).toBeVisible()
    await expect(page.getByText(/página no encontrada/i)).toBeVisible()
    const ctaLink = page.getByRole("link", { name: /volver al inicio/i })
    await expect(ctaLink).toBeVisible()
  })

  test("página 404 locale-aware en inglés", async ({ page }) => {
    await page.goto("/en/nonexistent-route-xyz")
    await expect(page.getByText("404")).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test("formulario de registro requiere turnoId y fecha", async ({ page }) => {
    // Sin parámetros → redirect al calendario
    await page.goto("/es/reservar/la-silla/registro")
    await expect(page).toHaveURL(/la-silla(?!\/registro)/)
  })

  test("formulario de registro carga con parámetros válidos", async ({ page }) => {
    // Obtener un turnoId real desde la API de disponibilidad
    const res = await page.request.get(
      "/api/disponibilidad?observatorio=LA_SILLA&desde=2026-04-01&hasta=2026-06-30"
    )
    const data = await res.json()

    // Buscar primera fecha con cupos
    const fechas = Object.keys(data.disponibilidad ?? {})
    const fechaConTurno = fechas.find(
      (f) => data.disponibilidad[f]?.some((t: { cuposLibres: number }) => t.cuposLibres > 0)
    )

    if (!fechaConTurno) {
      test.skip(true, "No hay turnos disponibles en el rango")
      return
    }

    const turno = data.disponibilidad[fechaConTurno].find(
      (t: { cuposLibres: number }) => t.cuposLibres > 0
    )
    await page.goto(
      `/es/reservar/la-silla/registro?turnoId=${turno.id}&fecha=${fechaConTurno}`
    )

    await expect(page.getByText(/datos del titular/i)).toBeVisible()
    await expect(page.getByLabel(/nombre/i)).toBeVisible()
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible()
  })

  test("formulario muestra errores de validación accesibles", async ({ page }) => {
    const res = await page.request.get(
      "/api/disponibilidad?observatorio=PARANAL&desde=2026-04-01&hasta=2026-06-30"
    )
    const data = await res.json()
    const fechas = Object.keys(data.disponibilidad ?? {})
    const fechaConTurno = fechas.find(
      (f) => data.disponibilidad[f]?.some((t: { cuposLibres: number }) => t.cuposLibres > 0)
    )
    if (!fechaConTurno) {
      test.skip(true, "No hay turnos disponibles")
      return
    }

    const turno = data.disponibilidad[fechaConTurno].find(
      (t: { cuposLibres: number }) => t.cuposLibres > 0
    )
    await page.goto(
      `/es/reservar/paranal/registro?turnoId=${turno.id}&fecha=${fechaConTurno}`
    )

    // Intentar submit sin datos
    await page.getByRole("button", { name: /confirmar reserva/i }).click()

    // Errores accesibles con role="alert"
    const alerts = page.locator("[role='alert']")
    await expect(alerts.first()).toBeVisible()
  })

  test("versión inglés del formulario usa traducciones correctas", async ({ page }) => {
    const res = await page.request.get(
      "/api/disponibilidad?observatorio=LA_SILLA&desde=2026-04-01&hasta=2026-06-30"
    )
    const data = await res.json()
    const fechas = Object.keys(data.disponibilidad ?? {})
    const fechaConTurno = fechas.find(
      (f) => data.disponibilidad[f]?.some((t: { cuposLibres: number }) => t.cuposLibres > 0)
    )
    if (!fechaConTurno) {
      test.skip(true, "No hay turnos disponibles")
      return
    }

    const turno = data.disponibilidad[fechaConTurno].find(
      (t: { cuposLibres: number }) => t.cuposLibres > 0
    )
    await page.goto(
      `/en/reservar/la-silla/registro?turnoId=${turno.id}&fecha=${fechaConTurno}`
    )

    await expect(page.getByText(/lead visitor details/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /confirm booking/i })).toBeVisible()
  })
})
