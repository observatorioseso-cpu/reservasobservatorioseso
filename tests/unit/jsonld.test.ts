import { describe, it, expect } from "vitest"
import {
  organizationSchema,
  touristAttractionSchema,
  breadcrumbSchema,
} from "@/lib/jsonld"

// ---------------------------------------------------------------------------
// organizationSchema
// ---------------------------------------------------------------------------

describe("organizationSchema", () => {
  it('retorna "@context": "https://schema.org"', () => {
    const schema = organizationSchema()
    expect(schema["@context"]).toBe("https://schema.org")
  })

  it('retorna "@type": "Organization"', () => {
    const schema = organizationSchema()
    expect(schema["@type"]).toBe("Organization")
  })

  it('tiene name "ESO Observatorios Chile"', () => {
    const schema = organizationSchema()
    expect(schema.name).toBe("ESO Observatorios Chile")
  })

  it('sameAs incluye "https://www.eso.org"', () => {
    const schema = organizationSchema()
    expect(schema.sameAs).toContain("https://www.eso.org")
  })
})

// ---------------------------------------------------------------------------
// touristAttractionSchema — LA_SILLA
// ---------------------------------------------------------------------------

describe('touristAttractionSchema("LA_SILLA")', () => {
  const schema = touristAttractionSchema("LA_SILLA")

  it('retorna "@type": "TouristAttraction"', () => {
    expect(schema["@type"]).toBe("TouristAttraction")
  })

  it("isAccessibleForFree es true", () => {
    expect(schema.isAccessibleForFree).toBe(true)
  })

  it("publicAccess es true", () => {
    expect(schema.publicAccess).toBe(true)
  })

  it("geo.latitude es aproximadamente -29.25 (±0.1)", () => {
    expect(schema.geo.latitude).toBeCloseTo(-29.25, 1)
  })

  it("geo.longitude es aproximadamente -70.73 (±0.1)", () => {
    expect(schema.geo.longitude).toBeCloseTo(-70.73, 1)
  })

  it('containedInPlace.address.addressCountry === "CL"', () => {
    expect(schema.containedInPlace.address?.addressCountry).toBe("CL")
  })

  it('containedInPlace.address.addressRegion === "Coquimbo"', () => {
    expect(schema.containedInPlace.address?.addressRegion).toBe("Coquimbo")
  })
})

// ---------------------------------------------------------------------------
// touristAttractionSchema — PARANAL
// ---------------------------------------------------------------------------

describe('touristAttractionSchema("PARANAL")', () => {
  const schema = touristAttractionSchema("PARANAL")

  it("geo.latitude es aproximadamente -24.62 (±0.1)", () => {
    expect(schema.geo.latitude).toBeCloseTo(-24.62, 1)
  })

  it("geo.longitude es aproximadamente -70.40 (±0.1)", () => {
    expect(schema.geo.longitude).toBeCloseTo(-70.40, 1)
  })

  it('containedInPlace.address.addressRegion === "Antofagasta"', () => {
    expect(schema.containedInPlace.address?.addressRegion).toBe("Antofagasta")
  })
})

// ---------------------------------------------------------------------------
// breadcrumbSchema — lista vacía
// ---------------------------------------------------------------------------

describe("breadcrumbSchema([])", () => {
  const schema = breadcrumbSchema([])

  it('retorna "@type": "BreadcrumbList"', () => {
    expect(schema["@type"]).toBe("BreadcrumbList")
  })

  it("itemListElement es un array vacío", () => {
    expect(schema.itemListElement).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// breadcrumbSchema — dos items
// ---------------------------------------------------------------------------

describe("breadcrumbSchema con dos items", () => {
  const items = [
    { name: "Inicio", url: "https://example.com" },
    { name: "Reservar", url: "https://example.com/reservar" },
  ]
  const schema = breadcrumbSchema(items)

  it("retorna 2 items en itemListElement", () => {
    expect(schema.itemListElement).toHaveLength(2)
  })

  it("primer item tiene position === 1 y name === 'Inicio'", () => {
    const first = schema.itemListElement[0]
    expect(first.position).toBe(1)
    expect(first.name).toBe("Inicio")
  })

  it("segundo item tiene position === 2, name === 'Reservar' e item correcto", () => {
    const second = schema.itemListElement[1]
    expect(second.position).toBe(2)
    expect(second.name).toBe("Reservar")
    expect(second.item).toBe("https://example.com/reservar")
  })
})
