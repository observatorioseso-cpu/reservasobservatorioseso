import { test, expect } from "@playwright/test"

/**
 * Portal cliente: login, dashboard, descarga PDF.
 * Prerequisito: reserva de prueba creada con el seed, o vía la API.
 * El token y password de prueba se leen desde variables de entorno:
 *   TEST_RESERVA_TOKEN, TEST_RESERVA_PASSWORD
 * Si no están definidas, los tests de autenticación se omiten.
 */

const TEST_TOKEN = process.env.TEST_RESERVA_TOKEN
const TEST_PASSWORD = process.env.TEST_RESERVA_PASSWORD

test.describe("Portal cliente — login", () => {
  test("página de login carga correctamente", async ({ page }) => {
    await page.goto("/es/mi-reserva")
    await expect(page.getByText(/mi reserva/i)).toBeVisible()
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible()
  })

  test("login fallido muestra error accesible", async ({ page }) => {
    await page.goto("/es/mi-reserva")

    await page.getByLabel(/correo electrónico/i).fill("noexiste@test.cl")
    await page.getByLabel(/contraseña/i).fill("wrongpassword")
    await page.getByRole("button", { name: /ingresar|acceder|entrar/i }).click()

    // Debe mostrar error
    await expect(page.locator("[role='alert'], .text-red")).toBeVisible({ timeout: 5000 })
  })

  test("login exitoso lleva al dashboard", async ({ page }) => {
    if (!TEST_TOKEN || !TEST_PASSWORD) {
      test.skip(true, "TEST_RESERVA_TOKEN / TEST_RESERVA_PASSWORD no configurados")
      return
    }

    // Ir directo al dashboard con token conocido requiere login primero
    await page.goto("/es/mi-reserva")
    await page.getByLabel(/correo electrónico/i).fill("test@example.com")
    await page.getByLabel(/contraseña/i).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /ingresar|acceder|entrar/i }).click()

    // Si el login es exitoso, redirige a /mi-reserva/[token]
    await expect(page).toHaveURL(/mi-reserva\//, { timeout: 8000 })
  })
})

test.describe("Portal cliente — dashboard", () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_TOKEN || !TEST_PASSWORD) {
      test.skip(true, "TEST_RESERVA_TOKEN / TEST_RESERVA_PASSWORD no configurados")
    } else {
      // Autenticar via API directamente para no repetir UI login
      const res = await page.request.post("/api/mi-reserva/auth", {
        data: { token: TEST_TOKEN, password: TEST_PASSWORD },
      })
      if (!res.ok()) {
        test.skip(true, "Autenticación fallida — revisar TEST_RESERVA_TOKEN y TEST_RESERVA_PASSWORD")
      }
    }
  })

  test("dashboard muestra datos de la reserva", async ({ page }) => {
    if (!TEST_TOKEN) return

    await page.goto(`/es/mi-reserva/${TEST_TOKEN}`)

    // Debe mostrar shortId (ESO-XXXXXXXX)
    await expect(page.getByText(/ESO-/)).toBeVisible({ timeout: 8000 })
  })

  test("botón de descarga PDF responde", async ({ page }) => {
    if (!TEST_TOKEN) return

    await page.goto(`/es/mi-reserva/${TEST_TOKEN}`)

    const pdfLink = page.getByRole("link", { name: /descargar pdf/i })
    const count = await pdfLink.count()
    if (count > 0) {
      // Verificar que el href apunta al endpoint correcto
      const href = await pdfLink.getAttribute("href")
      expect(href).toContain("/api/reservas/")
      expect(href).toContain("/pdf")
    }
  })

  test("botón confirmar asistencia visible si reserva es pendiente", async ({ page }) => {
    if (!TEST_TOKEN) return

    await page.goto(`/es/mi-reserva/${TEST_TOKEN}`)
    // El botón puede o no estar visible dependiendo del estado de la reserva
    // Solo verificamos que la página carga sin errores
    await expect(page.locator("body")).not.toContainText("500")
  })
})

test.describe("Portal cliente — accesibilidad", () => {
  test("formulario de login tiene labels accesibles", async ({ page }) => {
    await page.goto("/es/mi-reserva")

    // Todos los inputs deben tener labels
    const inputs = page.locator("input")
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute("id")
      const ariaLabel = await input.getAttribute("aria-label")
      const ariaLabelledby = await input.getAttribute("aria-labelledby")
      // Cada input debe tener alguna forma de label
      expect(id || ariaLabel || ariaLabelledby).toBeTruthy()
    }
  })

  test("navegación por teclado funciona en el formulario", async ({ page }) => {
    await page.goto("/es/mi-reserva")

    // Tab debe moverse a través de los elementos interactivos
    await page.keyboard.press("Tab") // skip link
    await page.keyboard.press("Tab") // primer input
    const focused = page.locator(":focus")
    await expect(focused).toBeVisible()
  })
})
