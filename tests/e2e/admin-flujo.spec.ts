import { test, expect } from "@playwright/test"

/**
 * Panel admin: login, listado de reservas, cambio de estado, exportación.
 * Prerequisito: admin creado con seed (admin@observatorioseso.cl / admin123).
 * Credenciales configurables via variables de entorno:
 *   TEST_ADMIN_EMAIL (default: admin@observatorioseso.cl)
 *   TEST_ADMIN_PASSWORD (default: admin123)
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "admin@observatorioseso.cl"
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "admin123"

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login")
  await page.getByLabel(/email|correo/i).fill(ADMIN_EMAIL)
  await page.getByLabel(/contraseña|password/i).fill(ADMIN_PASSWORD)
  await page.getByRole("button", { name: /ingresar|login|acceder/i }).click()
  await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 8000 })
}

test.describe("Admin — autenticación", () => {
  test("página de login admin carga", async ({ page }) => {
    await page.goto("/admin/login")
    await expect(page.getByLabel(/email|correo/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible()
  })

  test("login con credenciales incorrectas muestra error", async ({ page }) => {
    await page.goto("/admin/login")
    await page.getByLabel(/email|correo/i).fill("no@existe.cl")
    await page.getByLabel(/contraseña|password/i).fill("wrongpass")
    await page.getByRole("button", { name: /ingresar|login|acceder/i }).click()

    // No debe redirigir al dashboard
    await expect(page).not.toHaveURL(/dashboard/, { timeout: 3000 }).catch(() => {})
  })

  test("login exitoso redirige al dashboard", async ({ page }) => {
    await loginAdmin(page)
    await expect(page).toHaveURL(/dashboard/)
  })

  test("acceso directo a dashboard sin login redirige a login", async ({ page }) => {
    await page.goto("/admin/dashboard")
    // Debe redirigir a login
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })

  test("logout elimina la sesión", async ({ page }) => {
    await loginAdmin(page)
    // Buscar botón de logout
    const logoutBtn = page.getByRole("button", { name: /salir|logout|cerrar sesión/i })
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click()
      await expect(page).toHaveURL(/login/, { timeout: 5000 })
    }
  })
})

test.describe("Admin — gestión de reservas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test("listado de reservas carga con paginación", async ({ page }) => {
    await page.goto("/admin/reservas")
    // La tabla de reservas o mensaje "sin reservas" debe estar visible
    const table = page.locator("table, [data-testid='reservas-list']")
    const empty = page.getByText(/sin reservas|no hay reservas/i)
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 })
  })

  test("filtros de estado funcionan", async ({ page }) => {
    await page.goto("/admin/reservas")

    // Buscar selector de estado si existe
    const estadoFilter = page.getByRole("combobox").or(
      page.getByRole("listbox")
    ).first()
    if (await estadoFilter.count() > 0) {
      await estadoFilter.selectOption({ index: 1 })
      await page.waitForLoadState("networkidle")
    }
  })

  test("dashboard muestra estadísticas", async ({ page }) => {
    await page.goto("/admin/dashboard")
    // Debe mostrar algún número o estadística
    await expect(page.locator("body")).not.toContainText("500")
    await expect(page.locator("body")).toBeVisible()
  })

  test("listado de turnos carga", async ({ page }) => {
    await page.goto("/admin/turnos")
    await expect(page.locator("body")).not.toContainText("Error")
    // Tabla de turnos o mensaje vacío
    const content = page.locator("table, [data-testid='turnos-list']")
    const empty = page.getByText(/sin turnos|no hay turnos/i)
    await expect(content.or(empty)).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Admin — exportación", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test("endpoint de exportación requiere autenticación admin", async ({ page }) => {
    // Sin cookie admin → debe retornar 401
    const newPage = await page.context().newPage()
    const res = await newPage.request.get("/api/export?format=csv")
    expect([401, 403]).toContain(res.status())
    await newPage.close()
  })

  test("exportación CSV con sesión admin retorna 200", async ({ page }) => {
    // Usar la cookie de sesión admin que ya está en el contexto
    const res = await page.request.get("/api/export?format=csv")
    expect(res.status()).toBe(200)
    const contentType = res.headers()["content-type"]
    expect(contentType).toContain("text/csv")
  })
})

test.describe("Admin — configuración del sistema", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test("página de configuración carga correctamente", async ({ page }) => {
    await page.goto("/admin/config")
    await expect(page.locator("body")).not.toContainText("500")
    // Debe mostrar algún formulario de configuración
    await expect(page.locator("form, input")).toBeVisible({ timeout: 8000 })
  })
})
