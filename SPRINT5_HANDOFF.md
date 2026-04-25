# ESO Observatorios — Sprint 5 Handoff

> Context-continuity artifact. Dense facts, minimal prose. Paste at the start of a new agent session.

---

## Quick Start for New Agent (5 Most Important Facts)

1. **Next.js 16** — route handler params arrive as `Promise`: always `await context.params`. Read `node_modules/next/dist/docs/` before writing new route handlers.
2. **`prisma.$transaction` is mandatory** for every operation that touches `cuposOcupados`. No exceptions.
3. **All 5 AI agents are complete and integrated** as of Sprint 4. Sprint 5 added only SEO + deploy infrastructure. Do not rewrite or re-scaffold agents.
4. **OG images and PWA icons do not exist yet** — `/og/home.png`, `/og/la-silla.png`, `/og/paranal.png`, `/icons/icon-192.png`, `/icons/icon-512.png` are referenced in metadata/manifest but the files are missing. Sprint 6 candidate.
5. **`ADMIN_SECRET_KEY`** replaced `ADMIN_JWT_SECRET` from Sprint 4 — the auth system uses HMAC-SHA256 via `lib/adminAuth.ts`, not JWT. Update any `.env` files accordingly.

---

## Project Identity

- **Product:** Reservation system for free guided visits to La Silla and Paranal observatories
- **URL:** https://reservasobservatorioseso.cl
- **Stack:** Next.js 16.2.4 App Router · React 19 · TypeScript 5 · Tailwind v4 · Prisma 7 (PostgreSQL) · next-intl 4 · Zod v4 · Vitest 4
- **Git branch:** master
- **Commits:** 5 (initial setup through Sprint 5)
- **Tests:** 55 passing (44 integration + 11 unit)
- **TypeScript:** 0 errors

---

## Sprints Completed

| Sprint | Scope |
|--------|-------|
| 1 | DB schema, Prisma setup, booking flow pages, base API routes |
| 2 | Admin panel, export, multi-step form, portal cliente |
| 3 | Full i18n (ES/EN), all remaining API routes, middleware |
| 4 | All 5 AI agents complete, seed data |
| 5 | SEO infrastructure, deploy pipeline, CI, health endpoint |

---

## Sprint 5 Deliverables

### New Files

| File | Description |
|------|-------------|
| `app/sitemap.ts` | Dynamic XML sitemap (MetadataRoute.Sitemap). Generates es + en variants for `/`, `/reservar/la-silla`, `/reservar/paranal`, `/mi-reserva` |
| `app/robots.ts` | Disallows /admin, /api, /confirmar; allows everything else |
| `public/manifest.webmanifest` | PWA manifest. theme_color: #f59e0b, background_color: #0c0a09, icons at /icons/icon-{192,512}.png |
| `lib/jsonld.ts` | JSON-LD builders: `organizationSchema()`, `touristAttractionSchema(obs)`, `breadcrumbSchema(items)` using schema-dts or plain objects |
| `app/api/health/route.ts` | Health check: DB ping via `prisma.$queryRaw\`SELECT 1\``. Returns 200 `{status:"ok"}` or 503 `{status:"error"}` |
| `DEPLOY.md` | Step-by-step deploy: GitHub → Supabase/Neon → Upstash → Resend → Anthropic keys → Vercel → `prisma migrate deploy` → domain |
| `.env.production.example` | All env var templates with inline comments |
| `.github/workflows/ci.yml` | GitHub Actions CI on push to main: `tsc --noEmit` + `vitest run` + `next build` |

### Updated Files

| File | Change |
|------|--------|
| `app/[locale]/page.tsx` | Added Organization JSON-LD via `<script type="application/ld+json">`, improved `generateMetadata` with full OG/Twitter cards + `alternates.canonical` |
| `app/[locale]/reservar/[obs]/page.tsx` | Added TouristAttraction + BreadcrumbList JSON-LD, per-observatory OG image references |
| `app/[locale]/layout.tsx` | Added `manifest` link, `themeColor` (#f59e0b), `metadataBase` (NEXT_PUBLIC_BASE_URL) |

---

## Complete File Inventory

```
reservasobservatorioseso/
├── app/
│   ├── layout.tsx                         root layout (html+body minimal, no fonts)
│   ├── page.tsx                           redirect to /es
│   ├── globals.css
│   ├── sitemap.ts                         [SPRINT 5] MetadataRoute.Sitemap
│   ├── robots.ts                          [SPRINT 5] MetadataRoute.Robots
│   ├── [locale]/
│   │   ├── layout.tsx                     [SPRINT 5 UPDATED] Playfair+Franklin, ChatWidget, NextIntlClientProvider, manifest/themeColor/metadataBase
│   │   ├── page.tsx                       [SPRINT 5 UPDATED] landing + Organization JSON-LD
│   │   ├── reservar/[obs]/
│   │   │   ├── page.tsx                   [SPRINT 5 UPDATED] TouristAttraction + BreadcrumbList JSON-LD
│   │   │   └── registro/page.tsx          multi-step form (4 steps, sessionStorage fallback)
│   │   ├── confirmar/[token]/page.tsx
│   │   ├── exito/page.tsx
│   │   └── mi-reserva/
│   │       ├── page.tsx                   client portal login
│   │       └── [token]/page.tsx           client portal dashboard
│   ├── admin/
│   │   ├── layout.tsx                     Inter font, dark base, no i18n
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx             stats (Server Component)
│   │   ├── turnos/page.tsx                CRUD + attendance
│   │   ├── reservas/page.tsx              paginated list + export
│   │   ├── reservas/[token]/page.tsx      detail + admin edit
│   │   └── config/page.tsx                ConfigSistema editor
│   └── api/
│       ├── disponibilidad/route.ts        GET public slots
│       ├── reservas/
│       │   ├── route.ts                   POST create reservation
│       │   └── [token]/
│       │       ├── route.ts               GET/PUT/DELETE by token
│       │       ├── confirmar/route.ts     POST client confirm
│       │       ├── anular/route.ts        POST client cancel
│       │       ├── pdf/route.ts           GET PDF download
│       │       └── acompanantes/route.ts  PUT group management
│       ├── mi-reserva/auth/route.ts       POST client portal login
│       ├── admin/
│       │   ├── login/route.ts             POST + rate limit
│       │   ├── logout/route.ts
│       │   ├── turnos/route.ts            GET + POST
│       │   ├── turnos/[id]/route.ts       GET + PUT + DELETE
│       │   ├── turnos/[id]/asistencia/route.ts  PUT
│       │   ├── reservas/route.ts          GET paginated
│       │   ├── reservas/[token]/route.ts  GET + PUT admin (no window/limit restrictions)
│       │   ├── reservas/[token]/anular/route.ts
│       │   ├── reservas/[token]/confirmar/route.ts
│       │   ├── reservas/[token]/nota/route.ts
│       │   └── config/route.ts            GET + PUT (upsert)
│       ├── export/route.ts                GET xlsx/csv (X-Admin-Token + exceljs)
│       ├── cron/recordatorio/route.ts     GET (Vercel Cron, CRON_SECRET header)
│       ├── chat/route.ts                  POST SSE streaming (Agent 5)
│       └── health/route.ts               [SPRINT 5] GET DB ping
├── agents/
│   ├── validador.ts                       Agent 1: claude-haiku-4-5-20251001, pre-persist, sync, fail-open
│   ├── comunicaciones.ts                  Agent 2: email + WhatsApp orchestrator, no LLM, async
│   ├── recordatorio.ts                    Agent 3: deterministic auto-cancel + reminders
│   ├── pdf.tsx                            Agent 4: @react-pdf JSX impl, LETTER size, QR code
│   ├── pdf.ts                             Agent 4: re-export barrel (allowImportingTsExtensions)
│   └── chat.ts                            Agent 5: claude-sonnet-4-6-20251001, prompt caching
├── components/
│   ├── chat/
│   │   └── ChatWidget.tsx                 floating widget, hidden on /admin, SSE parser
│   ├── ui/
│   │   ├── Button.tsx                     framer-motion, variants: primary/secondary/ghost/danger
│   │   ├── Input.tsx
│   │   ├── FormField.tsx
│   │   ├── Spinner.tsx
│   │   └── index.ts
│   ├── reserva/
│   │   ├── CalendarioReservas.tsx
│   │   ├── FormularioReserva.tsx
│   │   ├── AcompananteField.tsx
│   │   └── TurnoCard.tsx
│   ├── landing/
│   │   ├── LandingNav.tsx
│   │   ├── LandingMarquee.tsx
│   │   └── ObservatoryCard.tsx
│   ├── portal/
│   │   ├── PortalLoginForm.tsx
│   │   └── PortalDashboard.tsx
│   ├── admin/
│   │   ├── AdminShell.tsx                 collapsible sidebar, mobile drawer
│   │   └── StatusBadge.tsx
│   └── email/
│       └── templates.ts                   emailConfirmacionHTML()
├── lib/
│   ├── prisma.ts                          PrismaClient singleton
│   ├── adminAuth.ts                       HMAC-SHA256, cookie eso_admin_session 8h
│   ├── confirmacion.ts                    calcularFechaLimiteConfirmacion, ventana check
│   ├── documento.ts                       detectarTipoDocumento(), validarRut()
│   ├── email.ts                           Resend client, EMAIL_FROM
│   ├── horarios.ts                        esInviernoLaSilla, getTurnosDisponibles, estaAbiertaLaReserva
│   ├── jsonld.ts                          [SPRINT 5] JSON-LD schema builders
│   ├── schemas.ts                         reservaSchema, acompananteSchema, modificacionAcompanantesSchema
│   └── utils.ts                           cn()
├── i18n/
│   ├── routing.ts                         locales: ["es","en"], defaultLocale: "es", localePrefix: "always"
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── es.json
│   └── en.json
├── middleware.ts                          next-intl public + /admin/* cookie protection
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                            Admin + ConfigSistema + La Silla/Paranal slots (2 months)
│   └── migrations/
├── tests/
│   ├── unit/
│   │   ├── validador.test.ts              5 tests (Anthropic SDK mocked)
│   │   └── recordatorio.test.ts           6 tests (date logic, no DB)
│   └── integration/                       44 tests from Sprints 1-2
├── public/
│   └── manifest.webmanifest              [SPRINT 5]
├── .github/
│   └── workflows/
│       └── ci.yml                         [SPRINT 5] tsc + vitest + build
├── vercel.json                            crons: 0 12 * * * and 0 21 * * *
├── next.config.ts                         withNextIntl, CSP headers, image domains
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── DEPLOY.md                             [SPRINT 5]
├── .env.production.example               [SPRINT 5]
├── CLAUDE.md
├── AGENTS.md
├── SPRINT4_HANDOFF.md
└── SPRINT5_HANDOFF.md                    this file
```

---

## Environment Variables (Complete)

```bash
# Database — Neon or Supabase, pooler URL, sslmode=require
DATABASE_URL="postgresql://user:pass@host:5432/eso_reservas?sslmode=require"

# Public base URL
NEXT_PUBLIC_BASE_URL="https://reservasobservatorioseso.cl"

# Admin auth — HMAC-SHA256 — 64 hex chars minimum
ADMIN_SECRET_KEY="<64-hex-chars>"

# Anthropic — used by Agent 1 (haiku) and Agent 5 (sonnet)
ANTHROPIC_API_KEY="sk-ant-..."

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@reservasobservatorioseso.cl"

# WhatsApp via Twilio (optional — silent fail if absent)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# Chat rate limiting (Upstash — fail-open if absent)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Vercel Cron auth
CRON_SECRET="<random-string>"
```

> Note: Sprint 4 used `ADMIN_JWT_SECRET`. Sprint 5 uses `ADMIN_SECRET_KEY`. Update `.env` files if migrating from Sprint 4 state.

---

## Prisma Schema (Complete)

```prisma
enum Observatorio { LA_SILLA  PARANAL }
enum EstadoReserva { PENDIENTE_CONFIRMACION  CONFIRMADA  ANULADA }
enum IdiomaVisita  { ES  EN }
enum TipoLogAgente {
  VALIDACION COMUNICACION RECORDATORIO AUTOANULACION
  PDF MODIFICACION CONFIRMACION ANULACION EMAIL WHATSAPP ERROR
}

model Turno {
  id            String       @id @default(cuid())
  observatorio  Observatorio
  fecha         DateTime     @db.Date
  horaInicio    String       // "09:30"
  horaFin       String       // "13:00"
  capacidadMax  Int
  cuposOcupados Int          @default(0)
  activo        Boolean      @default(true)
  asistentesReales        Int?
  asistenciaRegistradaEn  DateTime?
  asistenciaRegistradaPor String?
  reservas  Reserva[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([observatorio, fecha, horaInicio])
}

model Reserva {
  id      String @id @default(cuid())
  token   String @unique @default(cuid())
  shortId String @unique            // "ESO-A1B2C3D4"
  observatorio             Observatorio
  turnoId                  String
  turno                    Turno         @relation(fields: [turnoId], references: [id])
  estado                   EstadoReserva @default(PENDIENTE_CONFIRMACION)
  fechaLimiteConfirmacion  DateTime
  confirmadaEn             DateTime?
  nombre         String
  apellido       String
  rutOPasaporte  String
  email          String
  telefono       String
  idioma         IdiomaVisita @default(ES)
  cantidadPersonas Int
  tienesMenores    Boolean @default(false)
  recibirWhatsapp  Boolean @default(false)
  whatsappOptIn    Boolean @default(false)
  passwordHash     String
  locale           String  @default("es")
  pdfUrl           String?
  notaAdmin        String?
  acompanantes Acompanante[]
  logsAgente   LogAgente[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Acompanante {
  id        String  @id @default(cuid())
  reservaId String
  reserva   Reserva @relation(fields: [reservaId], references: [id])
  nombre    String
  apellido  String
  documento String?
  createdAt DateTime @default(now())
}

model LogAgente {
  id        String        @id @default(cuid())
  tipo      TipoLogAgente
  reservaId String?
  reserva   Reserva?      @relation(fields: [reservaId], references: [id])
  resultado  String
  metadata   Json?
  duracionMs Int?
  createdAt DateTime @default(now())
}

model Admin {
  id           String @id @default(cuid())
  email        String @unique
  passwordHash String
  nombre       String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ConfigSistema {
  clave       String   @id
  valor       String
  descripcion String?
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}
```

---

## The 5 AI Agents (All Complete)

| # | Agent | Model | File | Trigger | Behavior on failure |
|---|-------|-------|------|---------|---------------------|
| 1 | Reservation validator | claude-haiku-4-5-20251001 | `agents/validador.ts` | Sync, pre-`$transaction` in `POST /api/reservas` | Fail-open (allow reservation) |
| 2 | Post-reservation comms | No LLM (orchestrator) | `agents/comunicaciones.ts` | Async, post-persist + on modification | Logs error, does not throw |
| 3 | Reminders + auto-cancel | No LLM (deterministic) | `agents/recordatorio.ts` | Vercel Cron × 2/day via `GET /api/cron/recordatorio` | Idempotent; logs each action |
| 4 | PDF generator | No LLM (@react-pdf) | `agents/pdf.tsx` + `agents/pdf.ts` | Post-confirmation + `GET /api/reservas/[token]/pdf` | Returns null, logs error |
| 5 | Chat assistant | claude-sonnet-4-6-20251001 | `agents/chat.ts` | POST /api/chat, SSE streaming | Fail-open; widget shows error state |

### Agent 5 caching pattern
```typescript
// agents/chat.ts — system prompt uses cache_control
{
  role: "user",
  content: [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" }
    }
  ]
}
```

---

## API Routes

### Public (no auth)
```
GET  /api/disponibilidad?obs=LA_SILLA&fecha=YYYY-MM-DD
POST /api/reservas                          body: reservaSchema
GET  /api/reservas/[token]
POST /api/reservas/[token]/confirmar
POST /api/reservas/[token]/anular
GET  /api/reservas/[token]/pdf
PUT  /api/reservas/[token]/acompanantes
POST /api/mi-reserva/auth                   body: { token, password }
POST /api/chat                              body: { messages, sessionId }
GET  /api/health
```

### Admin UI routes (cookie: eso_admin_session)
```
POST /api/admin/login                       body: { email, password }
POST /api/admin/logout
GET  /api/admin/turnos                      ?obs&desde&hasta&activo
POST /api/admin/turnos
GET/PUT/DELETE /api/admin/turnos/[id]
PUT  /api/admin/turnos/[id]/asistencia      body: { asistentesReales }
GET  /api/admin/reservas                    ?obs&estado&q&turnoId&page&limit
GET/PUT /api/admin/reservas/[token]
POST /api/admin/reservas/[token]/anular     body: { motivo? }
POST /api/admin/reservas/[token]/confirmar
PUT  /api/admin/reservas/[token]/nota       body: { nota }
GET  /api/admin/config
PUT  /api/admin/config                      body: { entries: [{clave, valor}] }
```

### Protected by X-Admin-Token header
```
GET  /api/export                            ?obs&desde&hasta&estado&format=xlsx|csv
```

### Vercel Cron (CRON_SECRET header)
```
GET  /api/cron/recordatorio                 runs at 0 12 * * * and 0 21 * * *
```

---

## Critical Rules (Never Break)

1. `prisma.$transaction` for every operation touching `cuposOcupados` — create, cancel, modify group
2. `shortId` = `"ESO-" + randomBytes(4).toString("hex").toUpperCase()` — only in `POST /api/reservas`, never as Prisma default
3. `ConfigSistema.HORA_CIERRE_VIERNES` read from DB on each `POST /api/reservas` — never hardcode
4. `estaAbiertaLaReserva(turno.fecha, horaCierre)` checked server-side before creating any reservation
5. No `h-screen` — always `min-h-[100dvh]`
6. WCAG AA contrast 4.5:1 minimum on all text in all modes
7. Form steps 3-4: `bg-stone-50 text-stone-900` (forced light)
8. bcryptjs 12 rounds — no plain-text passwords anywhere
9. Admin auth: `X-Admin-Token` for `/api/export`; cookie `eso_admin_session` for `/api/admin/*` and `/admin` UI
10. No emojis — lucide-react only for all iconography
11. All user-facing strings through next-intl — no hardcoded es/en strings in UI
12. Client portal: max 10 persons — admin panel has no this restriction
13. Modification window: before `fechaLimiteConfirmacion` only (Friday 12:00 Santiago) — after that, admin-only
14. Contact only the titular — never send email or WhatsApp to acompanantes
15. Agents are fail-open — no agent failure can block a reservation

---

## Business Logic

### Schedules
| Period | La Silla | Paranal |
|--------|----------|---------|
| April-August (winter) | Saturdays only, 09:30-13:00 | ESO-scheduled days, 09:30-13:00 + 13:30-17:00 |
| Sept-March (summer) | Saturdays, 09:30-13:00 + 13:30-17:00 | ESO-scheduled days, 09:30-13:00 + 13:30-17:00 |

### Reservation window
- Closes: day before visit at `HORA_CIERRE_VIERNES` (default 16, from ConfigSistema)
- `estaAbiertaLaReserva(turno.fecha, horaCierre)` in `lib/horarios.ts`

### Modification window
- Until Friday before visit at 12:00 Santiago
- `estaDentroDeVentanaModificacion(fechaLimiteConfirmacion)` in `lib/confirmacion.ts`

### Atomic transactions
- **Create:** verify slots + decrement `cuposOcupados` + `reserva.create` — one `$transaction`
- **Cancel:** `estado = ANULADA` + `cuposOcupados -= cantidadPersonas` — one `$transaction`
- **Modify group:** `cuposOcupados += delta` + `estado = PENDIENTE_CONFIRMACION` + `confirmadaEn = null` — one `$transaction`

### Document validation
- Field accepts free alphanumeric input
- Validate check digit only when `detectarTipoDocumento()` returns `"rut"`
- Passports and foreign IDs: no validation

---

## Visual System

```
Background:        stone-950  #0c0a09
Primary accent:    amber-500  #f59e0b   (CTAs, buttons, theme_color)
Secondary accent:  sky-300    #7dd3fc   (info, states, links)
Surface:           stone-900  #1c1917   (cards)
Text primary:      stone-100  #f5f5f4   (on dark)
Typography:        Playfair Display (display headings) + Libre Franklin (body)
Admin typography:  Inter
Hero:              full-bleed parallax, left-aligned text
Forms:             forced light mode bg-stone-50
```

---

## SEO Infrastructure (Sprint 5 Detail)

### `lib/jsonld.ts` exports
```typescript
organizationSchema(): WithContext<Organization>
touristAttractionSchema(obs: "la-silla" | "paranal"): WithContext<TouristAttractionSchema>
breadcrumbSchema(items: { name: string; url: string }[]): WithContext<BreadcrumbList>
```

### `app/sitemap.ts` — generated URLs
```
https://reservasobservatorioseso.cl/es
https://reservasobservatorioseso.cl/en
https://reservasobservatorioseso.cl/es/reservar/la-silla
https://reservasobservatorioseso.cl/en/reservar/la-silla
https://reservasobservatorioseso.cl/es/reservar/paranal
https://reservasobservatorioseso.cl/en/reservar/paranal
https://reservasobservatorioseso.cl/es/mi-reserva
https://reservasobservatorioseso.cl/en/mi-reserva
```

### `public/manifest.webmanifest`
```json
{
  "name": "ESO Observatorios — Reservas",
  "short_name": "ESO Reservas",
  "theme_color": "#f59e0b",
  "background_color": "#0c0a09",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Tech Stack Exact Versions

```
next:                       16.2.4
react:                      19.x
typescript:                 5.x
prisma:                     7.x
next-intl:                  4.x
zod:                        4.x
@anthropic-ai/sdk:          0.90.0
@react-pdf/renderer:        4.5.1
qrcode:                     1.5.x
@upstash/ratelimit:         latest at install
@upstash/redis:             latest at install
bcryptjs:                   2.4.x
date-fns:                   4.x
date-fns-tz:                4.x
framer-motion:              11.x
lucide-react:               latest at install
exceljs:                    4.x
vitest:                     4.x
react-hook-form:            7.x
```

---

## Useful Commands

```bash
# Dev
npm run dev

# Tests
npx vitest run
npx vitest run --reporter=verbose

# TypeScript check
npx tsc --noEmit

# Prisma
npx prisma generate
npx prisma migrate dev --name migration_name
npx prisma migrate deploy          # production
npx prisma db seed
npx prisma studio

# Health check (after deploy)
curl https://reservasobservatorioseso.cl/api/health
```

---

## Known Issues / Sprint 6 Candidates

| Issue | Priority | Notes |
|-------|----------|-------|
| OG images missing | High | `/og/home.png`, `/og/la-silla.png`, `/og/paranal.png` referenced but not created. Use `@vercel/og` for dynamic generation or create static files. |
| PWA icons missing | High | `/icons/icon-192.png`, `/icons/icon-512.png` referenced in manifest but not created. |
| Mixed i18n in OG metadata | Medium | `app/[locale]/reservar/[obs]/page.tsx` OG descriptions may be partially hardcoded rather than going through next-intl. Audit and fix. |
| No rate limiting on reservation creation | Medium | Only `/api/chat` has Upstash rate limiting. `/api/reservas` POST has no rate limiting. |
| No real-time availability | Low | Frontend does not poll or use SSE for slot availability updates. Stale counts possible under concurrent load. |
| Twilio WhatsApp silent fail | Low | Zero WhatsApp functionality if env vars absent. Consider admin visibility into this state. |

---

## Next.js 16 Gotchas

- Route handler params are a `Promise`: `const { token } = await context.params`
- `generateMetadata` receives params as `Promise`: `const { locale } = await params`
- `searchParams` in Server Components is also a `Promise`: `const sp = await searchParams`
- App Router does not support `getServerSideProps` or `getStaticProps` — use Server Components and `fetch` with cache options
- `"use client"` boundary required for any component using hooks, browser APIs, or framer-motion
- Zod v4: use `z.ZodIssueCode.custom` in `superRefine`, not `ctx.addIssue({ code: "custom" })`

---

## Reference Files (in .agents/skills/)

| Need | File |
|------|------|
| DB, API routes, env vars, security | `.agents/skills/eso-observatorios-web-builder/references/architecture.md` |
| Visual tokens, components, motion | `.agents/skills/eso-observatorios-web-builder/references/design-system.md` |
| Schedules, slots, RUT/Passport, PDF, email | `.agents/skills/eso-observatorios-web-builder/references/business-logic.md` |
| All 5 agents with full code | `.agents/skills/eso-observatorios-web-builder/references/agents.md` |
| Forms, accessibility, mobile, UX | `.agents/skills/eso-observatorios-web-builder/references/ux-patterns.md` |
| SEO, JSON-LD, sitemap, Open Graph | `.agents/skills/eso-observatorios-web-builder/references/seo.md` |
