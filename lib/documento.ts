export type TipoDocumento = "rut" | "pasaporte" | "desconocido"

function pareceRut(valor: string): boolean {
  const clean = valor.replace(/[.\-\s]/g, "").toUpperCase()
  return /^\d{7,9}[0-9K]$/.test(clean)
}

export function detectarTipoDocumento(valor: string): TipoDocumento {
  if (!valor) return "desconocido"
  if (pareceRut(valor)) return "rut"
  if (/[A-Z]/i.test(valor) || valor.length < 7) return "pasaporte"
  return "desconocido"
}

export function validarRut(rut: string): boolean {
  const clean = rut.replace(/[.\-\s]/g, "").toUpperCase()
  if (clean.length < 2) return false

  const cuerpo = clean.slice(0, -1)
  const dv     = clean.slice(-1)

  if (!/^\d+$/.test(cuerpo)) return false

  let suma   = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const dvEsperado = 11 - (suma % 11)
  const dvStr = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : String(dvEsperado)

  return dv === dvStr
}

export function validarDocumento(valor: string): {
  valido: boolean
  tipo: TipoDocumento
  error?: string
} {
  const trimmed = valor.trim()

  if (trimmed.length < 5) {
    return { valido: false, tipo: "desconocido", error: "Ingresa tu RUT o número de pasaporte" }
  }

  const tipo = detectarTipoDocumento(trimmed)

  if (tipo === "rut") {
    const esValido = validarRut(trimmed)
    return {
      valido: esValido,
      tipo: "rut",
      error: esValido ? undefined : "El RUT no coincide — formato esperado: 12.345.678-9",
    }
  }

  const pasaporteValido = /^[A-Z0-9\-\s]{5,20}$/i.test(trimmed)
  return {
    valido: pasaporteValido,
    tipo: "pasaporte",
    error: pasaporteValido ? undefined : "El pasaporte solo puede contener letras, números y guiones",
  }
}

export function formatearDocumento(valor: string): string {
  if (detectarTipoDocumento(valor) !== "rut") return valor.toUpperCase()

  const clean = valor.replace(/[.\-\s]/g, "")
  if (clean.length < 2) return valor
  const cuerpo = clean.slice(0, -1)
  const dv     = clean.slice(-1).toUpperCase()
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv
}
