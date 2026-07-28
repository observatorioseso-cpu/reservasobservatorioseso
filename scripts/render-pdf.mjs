/**
 * Renderiza un HTML local a PDF con Chromium (Playwright).
 *
 * Uso:
 *   node scripts/render-pdf.mjs docs/onboarding-bernardita.html
 *
 * El PDF se escribe junto al HTML, con la misma base de nombre.
 */
import { chromium } from "playwright"
import { pathToFileURL } from "url"
import path from "path"
import fs from "fs"

const entrada = process.argv[2]
if (!entrada) {
  console.error("Uso: node scripts/render-pdf.mjs <archivo.html>")
  process.exit(1)
}

const htmlPath = path.resolve(entrada)
if (!fs.existsSync(htmlPath)) {
  console.error(`No existe: ${htmlPath}`)
  process.exit(1)
}

const pdfPath = htmlPath.replace(/\.html?$/i, ".pdf")

const browser = await chromium.launch()
const page = await browser.newPage()

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" })
await page.evaluate(() => document.fonts.ready)

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
})

await browser.close()

const kb = (fs.statSync(pdfPath).size / 1024).toFixed(0)
console.log(`PDF listo: ${pdfPath} (${kb} KB)`)
