import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic() // usa ANTHROPIC_API_KEY del entorno

export interface ResultadoValidacion {
  valido: boolean
  motivo?: string
  duracionMs: number
}

export interface DatosParaValidar {
  nombre: string
  apellido: string
  email: string
  telefono: string
  rutOPasaporte: string
  cantidadPersonas: number
}

const SYSTEM_PROMPT = `You are a booking validator for ESO Chile astronomical observatories.
Analyze reservation data and detect obvious spam, test submissions, or fake data.

Return ONLY valid JSON: {"valido": true} or {"valido": false, "motivo": "reason in Spanish"}

Mark as INVALID only if clearly fake:
- Name is obviously fake: "test", "aaa", "asdf", single letter repetitions, "John Doe", all same characters
- Email is a known test domain: test.com, example.com, fake.com, or obviously nonsensical
- Phone has obvious test patterns: "000000000", "111111111", "123456789"
- All fields look like test data simultaneously (not just one suspicious field)

Be PERMISSIVE. Real people have unusual names. Only reject when overwhelmingly obvious.
Respond in under 50 tokens.`

export async function validarReserva(datos: DatosParaValidar): Promise<ResultadoValidacion> {
  const inicio = Date.now()

  // Si la API key no está configurada, dejar pasar (fail open)
  if (!process.env.ANTHROPIC_API_KEY) {
    return { valido: true, duracionMs: 0 }
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            telefono: datos.telefono,
            cantidadPersonas: datos.cantidadPersonas,
          }),
        },
      ],
    })

    const texto =
      response.content[0].type === "text" ? response.content[0].text.trim() : ""
    const duracionMs = Date.now() - inicio

    // Parsear respuesta JSON del modelo
    // El modelo retorna: {"valido": true} o {"valido": false, "motivo": "..."}
    const parsed = JSON.parse(texto) as { valido: boolean; motivo?: string }
    return { valido: parsed.valido, motivo: parsed.motivo, duracionMs }
  } catch {
    // Fail open: si el modelo falla, dejamos pasar la reserva
    return { valido: true, duracionMs: Date.now() - inicio }
  }
}
