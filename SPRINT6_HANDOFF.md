# ESO Observatorios — Sprint 6 Handoff

> Context-continuity artifact. Dense facts, minimal prose. Paste at the start of a new agent session.

---

## Quick Start for New Agent (5 Most Important Facts)

1. **Next.js 16** — route handler params arrive as `Promise`: always `await context.params`. Read `node_modules/next/dist/docs/` before writing new route handlers.
2. **`prisma.$transaction` is mandatory** for every operation that touches `cuposOcupados`. No exceptions.
3. **OG images are now dynamic** — `GET /api/og?obs=home|la-silla|paranal&locale=es|en` (edge, ImageResponse, 1200×630). PWA icons via `GET /api/icons/[size]` (192 or 512). The static PNG placeholders referenced in Sprint 5 are gone.
4. **Routing conflict fixed** — `app/[locale]/reservar/[obs]/` (duplicate dynamic segment) was deleted in Sprint 6. The canonical page is `app/[locale]/reservar/[observatorio]/page.tsx`. Do not recreate the `[obs]` directory.
5. **`ADMIN_SECRET_KEY`** is the admin auth secret (HMAC-SHA256, `lib/adminAuth.ts`). Not JWT, not `ADMIN_JWT_SECRET`.

---

## Project Identity

- **Product:** Reservation system for free guided visits to La Silla and Paranal observatories
- **URL:** https://reservasobservatorioseso.cl
- **Stack:** Next.js 16.2.4 App Router · React 19 · TypeScript 5 · Tailwind v4 · Prisma 7 (PostgreSQL) · next-intl 4 · Zod v4 · Vitest 4
- **Git branch:** master
- **Commits:** 6 (initial setup through Sprint 6)
- **Tests:** 74 passing (44 integration + 30 unit)
- **TypeScript:** 0 errors

---

## Sprints Completed

| Sprint | Scope |
|--------|-------|
| 1 | DB schema, Prisma setup, booking flow pages, base API routes |
| 2 | Admin panel, export, multi-step form, portal cliente |
| 3 | Full i18n (ES/EN), all remaining API routes, middleware |
| 4 | All 5 AI agents complete, seed data |
| 5 | SEO infrastructure (JSON-LD, sitemap, robots), deploy pipeline, CI, health endpoint |
| 6 | Routing fix, dynamic OG/PWA images, error/loading pages, new unit tests |

---

## Sprint 6 Deliverables

| File | What it does |
|------|-------------|
| `app/api/og/route.tsx` | Edge route — dynamic OG image 1200×630. Params: `obs` (home\|la-silla\|paranal), `locale` (es\|en). Used in `generateMetadata` across all locale pages. |
| `app/api/icons/[size]/route.tsx` | Edge route — PWA icon PNG. `size` must be `192` or `512`. Returns 400 for other values. |
| `public/manifest.webmanifest` | Updated: icons now point to `/api/icons/192` and `/api/icons/512` instead of the missing static PNGs from Sprint 5. |
| `app/[locale]/page.tsx` | Updated: OG image URL is now `/api/og?obs=home&locale=${locale}` (dynamic, no static file dependency). |
| `app/[locale]/reservar/[observatorio]/page.tsx` | Updated: JSON-LD (`TouristAttraction` + `BreadcrumbList`) and improved `generateMetadata` merged here from the now-deleted `[obs]` duplicate. |
| `app/not-found.tsx` | Root-level 404 page. Bilingual (ES/EN). Links back to `/es`. |
| `app/[locale]/not-found.tsx` | Locale-scoped 404. Inherits locale from URL. |
| `app/[locale]/error.tsx` | Locale-scoped error boundary (`"use client"`). Shows reset button; logs to console in dev. |
| `app/[locale]/loading.tsx` | Locale-level loading skeleton. Stone-950 background, amber pulse bar. |
| `app/[locale]/reservar/[observatorio]/loading.tsx` | Observatory page loading skeleton. Matches observatory card layout. |
| `tests/unit/jsonld.test.ts` | 19 unit tests for `lib/jsonld.ts` — all three exported builders, pure functions, no mocks. |
| `tests/unit/documento.test.ts` | 14 unit tests for `lib/documento.ts` — `detectarTipoDocumento`, `validarRut`, `validarDocumento`, `formatearDocumento`. |

### Deleted in Sprint 6

| Path | Reason |
|------|--------|
| `app/[locale]/reservar/[obs]/` | Duplicate dynamic segment caused routing conflicts with `[observatorio]`. Functionality merged into `[observatorio]/page.tsx`. |

---

## Test Count

| Sprint 5 baseline | New in Sprint 6 | Total |
|-------------------|-----------------|-------|
| 55 | +19 (jsonld.test.ts) | 74 |

The `documento.test.ts` file (14 tests) existed before Sprint 6 and is counted within the Sprint 5 baseline. The 7 test files are:

- `tests/unit/validador.test.ts` — 5 tests
- `tests/unit/recordatorio.test.ts` — 6 tests
- `tests/unit/horarios.test.ts` — (see file)
- `tests/unit/confirmacion.test.ts` — (see file)
- `tests/unit/schemas.test.ts` — (see file)
- `tests/unit/documento.test.ts` — 14 tests
- `tests/unit/jsonld.test.ts` — 19 tests (Sprint 6 new)
- `tests/integration/` — 44 tests (Sprints 1–2)

---

## API Routes Reference

### Public (no auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/disponibilidad?obs=LA_SILLA&fecha=YYYY-MM-DD` | Available slots for a given observatory and date |
| POST | `/api/reservas` | Create reservation (runs Agent 1 sync, Agent 2 async) |
| GET | `/api/reservas/[token]` | Fetch reservation by token |
| POST | `/api/reservas/[token]/confirmar` | Client confirms reservation |
| POST | `/api/reservas/[token]/anular` | Client cancels reservation |
| GET | `/api/reservas/[token]/pdf` | Download reservation PDF (Agent 4) |
| PUT | `/api/reservas/[token]/acompanantes` | Manage group members; auth: token + password in body |
| POST | `/api/mi-reserva/auth` | Client portal login; body: `{ token, password }` |
| POST | `/api/chat` | SSE streaming chat (Agent 5); body: `{ messages, sessionId }` |
| GET | `/api/health` | DB ping — 200 `{status:"ok"}` or 503 `{status:"error"}` |
| GET | `/api/og` | **[Sprint 6]** Dynamic OG image; params: `obs`, `locale` (edge runtime) |
| GET | `/api/icons/[size]` | **[Sprint 6]** PWA icon PNG; size: 192 or 512 (edge runtime) |

### Admin UI (cookie: `eso_admin_session`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/login` | Admin login with rate limit |
| POST | `/api/admin/logout` | Clear session cookie |
| GET / POST | `/api/admin/turnos` | List or create shifts |
| GET / PUT / DELETE | `/api/admin/turnos/[id]` | Read, update, or delete shift |
| PUT | `/api/admin/turnos/[id]/asistencia` | Record actual attendance |
| GET | `/api/admin/reservas` | Paginated list; params: `obs`, `estado`, `q`, `turnoId`, `page`, `limit` |
| GET / PUT | `/api/admin/reservas/[token]` | Read or admin-edit reservation (no window/limit restrictions) |
| POST | `/api/admin/reservas/[token]/anular` | Admin cancel; body: `{ motivo? }` |
| POST | `/api/admin/reservas/[token]/confirmar` | Admin confirm |
| PUT | `/api/admin/reservas/[token]/nota` | Set internal note; body: `{ nota }` |
| GET / PUT | `/api/admin/config` | Read or upsert `ConfigSistema` entries |

### Protected by `X-Admin-Token` header

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/export` | XLSX or CSV export; params: `obs`, `desde`, `hasta`, `estado`, `format` |

### Vercel Cron (`CRON_SECRET` header)

| Method | Route | Schedule |
|--------|-------|----------|
| GET | `/api/cron/recordatorio` | `0 12 * * *` and `0 21 * * *` |

---

## Known Issues / Sprint 7 Candidates

| Issue | Priority | Notes |
|-------|----------|-------|
| i18n for error/not-found pages | Medium | `app/not-found.tsx`, `app/[locale]/not-found.tsx`, and `app/[locale]/error.tsx` use hardcoded bilingual text. Move strings to `messages/es.json` and `messages/en.json`. |
| OG image design | Medium | `app/api/og/route.tsx` renders CSS circles as placeholder graphics. Replace with real observatory photos using `fetch` + `ArrayBuffer` from Vercel Blob or a CDN. |
| Playwright E2E tests | High | No end-to-end tests exist. Priority paths: full booking flow, client portal login + group edit, admin login + slot creation. |
| Accessibility audit | High | No WCAG AA audit has been run. Keyboard navigation and screen reader compatibility are unverified. Use axe-core or Lighthouse accessibility run. |
| Performance baseline | Medium | No Lighthouse or Core Web Vitals baseline. Run before production launch; target LCP < 2.5s, CLS < 0.1. |
| Resend domain verification | High | `RESEND_FROM_EMAIL` uses `noreply@reservasobservatorioseso.cl`. DNS verification must be completed before go-live or emails go to spam. |
| Rate limiting on `/api/reservas` | Medium | Only `/api/chat` has Upstash rate limiting. Reservation creation endpoint has no rate limit. |

---

## Critical Rules (Never Break)

1. `prisma.$transaction` for every operation touching `cuposOcupados`
2. `shortId` = `"ESO-" + randomBytes(4).toString("hex").toUpperCase()` — only in `POST /api/reservas`
3. `ConfigSistema.HORA_CIERRE_VIERNES` read from DB on each `POST /api/reservas` — never hardcode
4. `estaAbiertaLaReserva(turno.fecha, horaCierre)` checked server-side before creating any reservation
5. No `h-screen` — always `min-h-[100dvh]`
6. WCAG AA contrast 4.5:1 minimum on all text in all modes
7. Form steps 3–4: `bg-stone-50 text-stone-900` (forced light)
8. bcryptjs 12 rounds — no plain-text passwords anywhere
9. Admin auth: `X-Admin-Token` for `/api/export`; cookie `eso_admin_session` for `/api/admin/*` and `/admin` UI
10. No emojis — lucide-react only for all iconography
11. All user-facing strings through next-intl — no hardcoded es/en strings in UI components
12. Client portal: max 10 persons total — admin panel has no this restriction
13. Modification window: before `fechaLimiteConfirmacion` only — after that, admin-only
14. Contact only the titular — never send email or WhatsApp to acompanantes
15. Agents are fail-open — no agent failure can block a reservation

---

## Next.js 16 Gotchas

- Route handler params are a `Promise`: `const { token } = await context.params`
- `generateMetadata` receives params as `Promise`: `const { locale } = await params`
- `searchParams` in Server Components is also a `Promise`
- Edge runtime routes (`export const runtime = "edge"`) cannot use Node.js APIs (`fs`, `crypto`, `Buffer`)
- `"use client"` required for any component using hooks, browser APIs, or framer-motion
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
