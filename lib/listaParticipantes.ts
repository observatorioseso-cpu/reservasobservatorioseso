/**
 * Parser de nóminas pegadas desde Excel o correo.
 *
 * Lo usa el panel para cargar buses y cursos completos sin escribir persona
 * por persona. Acepta los formatos que llegan en la práctica:
 *
 *   Juan Pérez
 *   Juan Pérez, 12.345.678-9
 *   Juan <TAB> Pérez <TAB> 12345678-9
 *
 * Regla: con 3 o más columnas se asume nombre / apellido / documento.
 * Con 1 o 2, la primera columna es el nombre completo y la segunda el documento.
 */

export interface ParticipanteParseado {
  nombre: string
  apellido: string
  documento: string
}

export function parseLista(texto: string): ParticipanteParseado[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const columnas = linea
        .split(/\t|;|,/)
        .map((c) => c.trim())
        .filter(Boolean)

      if (columnas.length >= 3) {
        return { nombre: columnas[0], apellido: columnas[1], documento: columnas[2] }
      }

      const palabras = (columnas[0] ?? "").split(/\s+/).filter(Boolean)
      return {
        nombre: palabras[0] ?? "",
        apellido: palabras.slice(1).join(" "),
        documento: columnas[1] ?? "",
      }
    })
    .filter((p) => p.nombre.length > 0)
}
