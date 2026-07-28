import { describe, it, expect } from "vitest"
import { aDiaUTC, formatearFechaTurno } from "@/lib/fechas"

/**
 * 2026-08-22 es sábado. El generador solo crea sábados, así que cualquier
 * pantalla que muestre viernes 21 está corriendo la fecha un día.
 */
const SABADO = new Date("2026-08-22T00:00:00.000Z")

describe("aDiaUTC", () => {
  it("deja pasar el Date que entrega Prisma", () => {
    expect(aDiaUTC(SABADO).toISOString()).toBe("2026-08-22T00:00:00.000Z")
  })

  it("acepta la cadena ISO completa que viaja por JSON", () => {
    expect(aDiaUTC("2026-08-22T00:00:00.000Z").toISOString()).toBe(
      "2026-08-22T00:00:00.000Z"
    )
  })

  it("acepta un día pelado", () => {
    expect(aDiaUTC("2026-08-22").toISOString()).toBe("2026-08-22T00:00:00.000Z")
  })
})

describe("formatearFechaTurno", () => {
  it("muestra el día correcto en formato corto", () => {
    expect(formatearFechaTurno(SABADO)).toBe("22-08-2026")
  })

  it("da lo mismo recibir Date o cadena", () => {
    expect(formatearFechaTurno("2026-08-22T00:00:00.000Z")).toBe(
      formatearFechaTurno(SABADO)
    )
  })

  it("nombra el sábado como sábado", () => {
    const largo = formatearFechaTurno(SABADO, "es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    expect(largo).toContain("sábado")
    expect(largo).toContain("22")
  })

  it("traduce al inglés sin correr la fecha", () => {
    expect(
      formatearFechaTurno(SABADO, "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    ).toBe("Saturday, August 22, 2026")
  })

  // ---------------------------------------------------------------------------
  // Regresión: el bug que este módulo existe para impedir
  // ---------------------------------------------------------------------------

  it("no repite el desfase que mostraba los sábados como viernes", () => {
    // Así se formateaba antes en el panel: medianoche UTC leída en Santiago
    // cae a las 20:00 del día anterior.
    const comoAntes = SABADO.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Santiago",
    })

    expect(comoAntes).toBe("21-08-2026")
    expect(formatearFechaTurno(SABADO)).toBe("22-08-2026")
  })

  it("ignora una zona horaria pasada en las opciones", () => {
    expect(
      formatearFechaTurno(SABADO, "es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Santiago",
      })
    ).toBe("22-08-2026")
  })

  it("conserva el día de la semana en todos los sábados del rango", () => {
    for (const dia of ["2026-08-01", "2026-08-08", "2026-08-15", "2026-08-22", "2026-08-29"]) {
      const texto = formatearFechaTurno(dia, "es-CL", { weekday: "long" })
      expect(texto).toBe("sábado")
    }
  })
})
