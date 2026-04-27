# ESO Observatorios — Handoff completo para Sprint 7

> Documento de continuidad. Contiene TODO el estado del proyecto al cierre del
> Sprint 6 + auditoría de seguridad. Pégalo al inicio del nuevo chat.

---

## 5 hechos críticos que el nuevo agente debe saber primero

1. **Next.js 16.2.4** — los `params` de rutas dinámicas son `Promise`. Siempre
   `await params` antes de desestructurar. Leer `node_modules/next/dist/docs/`
   ante cualquier duda de API.
2. **`prisma.$transaction` es obligatorio** en toda operación que toque
   `cuposOcupados`. Sin excepción.
3. **Los 5 agentes IA están completos** (Sprints 4–6). No reescribir ni
   reandamiar ninguno. Solo extender si es necesario.
4. **La env var admin es `ADMIN_SECRET_KEY`** (no `ADMIN_JWT_SECRET`). El bug
   estaba en código y fue corregido en la auditoría de seguridad.
5. **El build local requiere `DATABASE_URL`**. Copiar `.env.local.example` →
   `.env.local` antes de `npm run dev` o `npm run build`. En Vercel/CI funciona
   sin pasos extra.

---

## Identidad del proyecto

| Campo | Valor |
|-------|-------|
| Producto | Sistema de reservas para visitas guiadas gratuitas a observatorios ESO Chile |
| URL producción | https://reservasobservatorioseso.cl |
| Stack | Next.js 16.2.4 · React 19 · TypeScript 5 · Tailwind v4 · Prisma 7.7 (PostgreSQL) · next-intl 4 · Zod v4 · Vitest |
| Branch Git | master |
| Commits | 7 (ver historial abajo) |
| Tests | 74 passing (7 archivos) |
| TypeScript | 0 errores |

---

## Historial de commits

```
5492d08  Auditoría: corregir vulnerabilidades críticas de seguridad y build
12252f6  Sprint 6: OG images, error/loading pages, routing fix, new tests
c8a8850  Sprint 5: SEO técnico + deploy infrastructure
75bd3c1  fix: PDF en tamaño Letter (8.5x11") en lugar de A4
6c9a51d  feat: Sprint 4 — Los 5 agentes IA completos
1e32cac  docs: agregar SPRINT4_HANDOFF.md
a3d7299  feat: Sprints 1-3 — sistema de reservas ESO Chile completo
```

---

## Sprints completados

| Sprint | Entregables principales |
|--------|------------------------|
| 1–2 | Schema Prisma, flujo de reserva, portal cliente, 44 tests de integración |
| 3 | Panel admin completo (auth HMAC, CRUD turnos, exportación Excel/CSV) |
| 4 | 5 agentes IA: validador (Haiku), comunicaciones, recordatorios, PDF, chat (Sonnet) |
| 5 | SEO: sitemap, robots, JSON-LD, manifest PWA; Deploy: DEPLOY.md, CI GitHub Actions, health endpoint |
| 6 | OG images dinámicas (`/api/og`), PWA icons (`/api/icons/[size]`), páginas error/404/loading, fix routing conflict, 19 tests nuevos |
| Auditoría | 4 bugs críticos + 6 vulnerabilidades moderadas corregidas |

---

## Inventario completo de archivos

```
reservasobservatorioseso/
├── app/
│   ├── layout.tsx                      root layout (html+body, redirige a /es)
│   ├── page.tsx                        redirige a /es
│   ├── not-found.tsx                   404 global (server component)
│   ├── globals.css
│   ├── sitemap.ts                      XML sitemap dinámico (es+en, 4 páginas)
│   ├── robots.ts                       robots.txt (bloquea /admin /api /confirmar)
│   ├── [locale]/
│   │   ├── layout.tsx                  Playfair+Franklin, ChatWidget, NextIntlClientProvider
│   │   │                               + metadataBase + manifest + themeColor #f59e0b
│   │   ├── page.tsx                    Home: Organization JSON-LD, OG via /api/og
│   │   ├── not-found.tsx               404 locale-aware, stone-950, Telescope icon
│   │   ├── error.tsx                   Error boundary cliente, retry + home link
│   │   ├── loading.tsx                 Skeleton animate-pulse (nav + 2 cards)
│   │   ├── exito/page.tsx              Página de éxito post-reserva
│   │   ├── reservar/[observatorio]/
│   │   │   ├── page.tsx                Calendario + TouristAttraction JSON-LD + OG mejorado
│   │   │   └── loading.tsx             Skeleton calendario
│   │   │   └── registro/page.tsx       Formulario multi-paso (4 pasos, sessionStorage fallback)
│   │   ├── confirmar/[token]/page.tsx  Confirmación de reserva
│   │   ├── mi-reserva/
│   │   │   ├── page.tsx                Portal cliente (login)
│   │   │   └── [token]/page.tsx        Portal cliente (dashboard)
│   └── api/
│       ├── disponibilidad/route.ts     GET turnos disponibles (público)
│       ├── reservas/
│       │   ├── route.ts                POST crear reserva (rate limit 5/min, Zod, AI validator, $tx)
│       │   └── [token]/
│       │       ├── route.ts            GET/PUT/DELETE por token
│       │       ├── confirmar/route.ts  POST confirmar (ventana viernes 12:00)
│       │       ├── anular/route.ts     POST anular por cliente
│       │       ├── pdf/route.ts        GET descargar PDF Letter
│       │       └── acompanantes/route.ts  PUT gestión grupo ($tx atómica)
│       ├── mi-reserva/
│       │   └── auth/route.ts          POST login portal (rate limit 5/min/IP)
│       ├── admin/
│       │   ├── login/route.ts          POST (rate limit 10/min, bcrypt, cookie HMAC)
│       │   ├── logout/route.ts
│       │   ├── turnos/route.ts         GET+POST
│       │   ├── turnos/[id]/route.ts    GET+PUT+DELETE
│       │   ├── turnos/[id]/asistencia/route.ts  PUT
│       │   ├── reservas/route.ts       GET paginado con filtros
│       │   ├── reservas/[token]/route.ts       GET+PUT (sin restricciones de ventana)
│       │   ├── reservas/[token]/anular/route.ts
│       │   ├── reservas/[token]/confirmar/route.ts
│       │   ├── reservas/[token]/nota/route.ts
│       │   └── config/route.ts         GET+PUT ConfigSistema (upsert)
│       ├── export/route.ts             GET xlsx/csv (auth admin)
│       ├── agentes/
│       │   └── recordatorio/route.ts   GET cron Vercel (CRON_SECRET requerido, fail-CLOSED)
│       ├── chat/route.ts               POST SSE streaming (Agente 5, Sonnet)
│       ├── og/route.tsx                GET OG image edge (1200×630, params: obs+locale)
│       ├── icons/[size]/route.tsx      GET PWA icon edge (192 o 512)
│       └── health/route.ts             GET health check DB (200/503)
├── admin/
│   ├── layout.tsx                      Inter font, dark base, sin i18n
│   ├── login/page.tsx
│   ├── dashboard/page.tsx              Stats (Server Component)
│   ├── turnos/page.tsx                 CRUD + asistencia
│   ├── reservas/page.tsx               Lista paginada + export
│   ├── reservas/[token]/page.tsx       Detalle + edición admin
│   └── config/page.tsx                 ConfigSistema editor
├── agents/
│   ├── validador.ts                    Agente 1: claude-haiku-4-5-20251001, fail-open
│   ├── comunicaciones.ts               Agente 2: email+WhatsApp, sin LLM, async
│   ├── recordatorio.ts                 Agente 3: auto-anulación + recordatorios, sin LLM
│   ├── pdf.tsx                         Agente 4: @react-pdf LETTER, QR code (JSX impl)
│   ├── pdf.ts                          Agente 4: re-export barrel
│   └── chat.ts                         Agente 5: claude-sonnet-4-6-20251001, prompt caching
├── components/
│   ├── chat/ChatWidget.tsx             Widget flotante, oculto en /admin, SSE parser
│   ├── ui/{Button,Input,FormField,Spinner,index}.ts
│   ├── reserva/{CalendarioReservas,FormularioReserva,AcompananteField,TurnoCard}.tsx
│   ├── landing/{LandingNav,LandingMarquee,ObservatoryCard}.tsx
│   ├── portal/{PortalLoginForm,PortalDashboard}.tsx
│   ├── admin/{AdminShell,StatusBadge}.tsx
│   └── email/templates.ts             emailConfirmacionHTML()
├── lib/
│   ├── prisma.ts                       PrismaClient singleton (globalThis cache)
│   ├── adminAuth.ts                    HMAC-SHA256, cookie eso_admin_session 8h
│   │                                   LEE: ADMIN_SECRET_KEY (no ADMIN_JWT_SECRET)
│   ├── confirmacion.ts                 calcularFechaLimiteConfirmacion, ventana check
│   ├── documento.ts                    detectarTipoDocumento(), validarRut()
│   ├── email.ts                        Resend client
│   ├── horarios.ts                     esInviernoLaSilla, getTurnosDisponibles, estaAbiertaLaReserva
│   ├── jsonld.ts                       organizationSchema, touristAttractionSchema, breadcrumbSchema
│   ├── schemas.ts                      reservaSchema, acompananteSchema, modificacionAcompanantesSchema
│   └── utils.ts                        cn()
├── i18n/{routing,request,navigation}.ts
├── messages/{es.json,en.json}
├── middleware.ts                       next-intl + /admin/* cookie auth
│                                       runtime = "nodejs" (usa Node crypto)
├── prisma/
│   ├── schema.prisma                   engineType="library" (Prisma 7)
│   ├── seed.ts                         Admin + ConfigSistema + turnos (2 meses)
│   └── migrations/
├── prisma.config.ts                    Datasource URL (Prisma 7 config)
├── tests/
│   ├── unit/
│   │   ├── validador.test.ts           5 tests (Anthropic SDK mockeado)
│   │   ├── recordatorio.test.ts        6 tests (lógica de fechas)
│   │   ├── horarios.test.ts            11 tests
│   │   ├── schemas.test.ts             tests de validación Zod
│   │   ├── confirmacion.test.ts        7 tests ventana modificación
│   │   ├── documento.test.ts           14 tests RUT/pasaporte
│   │   └── jsonld.test.ts              19 tests JSON-LD schemas
│   └── integration/                    44 tests (Sprints 1–2)
├── public/
│   └── manifest.webmanifest           Icons → /api/icons/192 y /api/icons/512
├── .github/
│   └── workflows/ci.yml               tsc + vitest + build en push/PR a main
├── next.config.ts                      CSP sin unsafe-eval, HSTS, img-src restringido
├── vercel.json                         1 cron: /api/agentes/recordatorio (12:00 y 21:00 UTC)
├── DEPLOY.md                           Guía de deploy paso a paso
├── .env.production.example            Plantilla producción
├── .env.local.example                 Plantilla desarrollo local
├── prisma.config.ts                   Configuración datasource Prisma 7
└── tsconfig.json                      allowImportingTsExtensions: true
```

---

## Reglas que NUNCA se rompen

1. **Cupos atómicos** — reserva + `cuposOcupados` siempre en `prisma.$transaction`
2. **Un solo contacto** — emails/WhatsApp solo al titular, nunca a acompañantes
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 para texto normal
5. **Formularios en claro** — Pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs rounds: 12
7. **Admin protegido** — cookie HMAC-SHA256 para UI + `x-admin-token` header para API
8. **Sin emojis** — lucide-react para iconografía
9. **Todo traducido** — ningún string hardcodeado en UI; todo por `next-intl`
10. **Pasaportes sin validar** — campo alfanumérico libre; validar dígito verificador solo si `detectarTipoDocumento()` retorna `"rut"`
11. **Ventana única** — confirmar/modificar/cancelar solo antes de `fechaLimiteConfirmacion` (viernes 12:00 Santiago)
12. **Límite cliente = 10 personas** — el admin puede superar ese límite
13. **shortId en la API** — `ESO-XXXXXXXX` con `randomBytes(4).hex().toUpperCase()`
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD; nunca hardcodear
15. **Fail-open en agentes IA** — nunca bloquear una reserva por falla de Anthropic
16. **CRON_SECRET obligatorio** — endpoint cron es fail-CLOSED (rechaza si no está configurado)

---

## Variables de entorno completas

```bash
DATABASE_URL                    # PostgreSQL (Neon/Supabase pooler + sslmode=require)
NEXT_PUBLIC_BASE_URL            # https://reservasobservatorioseso.cl
ADMIN_SECRET_KEY                # 64 hex chars — HMAC-SHA256 para tokens admin
ANTHROPIC_API_KEY               # Agente 1 (Haiku) + Agente 5 (Sonnet)
RESEND_API_KEY                  # Emails transaccionales
RESEND_FROM_EMAIL               # noreply@reservasobservatorioseso.cl
TWILIO_ACCOUNT_SID              # WhatsApp (opcional — fail-open si ausente)
TWILIO_AUTH_TOKEN               # WhatsApp (opcional)
TWILIO_WHATSAPP_FROM            # whatsapp:+14155238886 (opcional)
UPSTASH_REDIS_REST_URL          # Rate limiting (fail-open si ausente)
UPSTASH_REDIS_REST_TOKEN        # Rate limiting (fail-open si ausente)
CRON_SECRET                     # Header Vercel Cron — REQUERIDO (fail-CLOSED)
```

---

## Los 5 agentes IA

| # | Agente | Archivo | Modelo | Trigger | Fallo |
|---|--------|---------|--------|---------|-------|
| 1 | Validador | `agents/validador.ts` | claude-haiku-4-5-20251001 | Pre-persistencia (síncrono) | Fail-open |
| 2 | Comunicaciones | `agents/comunicaciones.ts` | Sin LLM | Post-reserva y modificación (async) | Fail-open |
| 3 | Recordatorio/Anulación | `agents/recordatorio.ts` | Sin LLM | Vercel Cron 12:00 y 21:00 UTC | Fail-open |
| 4 | PDF | `agents/pdf.tsx` + `pdf.ts` | Sin LLM (@react-pdf) | Bajo demanda `/api/reservas/[token]/pdf` | Lanza error |
| 5 | Chat | `agents/chat.ts` | claude-sonnet-4-6-20251001 | Widget flotante SSE | Fail-open |

---

## Esquema Prisma (modelos clave)

```prisma
generator client {
  provider   = "prisma-client-js"
  engineType = "library"          // REQUERIDO en Prisma 7
}

// URL configurada en prisma.config.ts (no en schema — cambio breaking de Prisma 7)

model Reserva {
  id                     String        @id @default(uuid())
  token                  String        @unique @default(uuid())
  shortId                String        @unique   // "ESO-XXXXXXXX"
  turnoId                String
  observatorio           Observatorio
  estado                 EstadoReserva @default(PENDIENTE_CONFIRMACION)
  fechaLimiteConfirmacion DateTime
  nombre                 String
  apellido               String
  rutOPasaporte          String
  email                  String
  telefono               String
  idioma                 IdiomaVisita
  cantidadPersonas       Int
  tienesMenores          Boolean       @default(false)
  recibirWhatsapp        Boolean       @default(false)
  whatsappOptIn          Boolean       @default(false)
  locale                 String        @default("es")
  passwordHash           String
  notaAdmin              String?
  confirmadaEn           DateTime?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt
  turno                  Turno         @relation(...)
  acompanantes           Acompanante[]
  logs                   LogAgente[]
}

model Turno {
  id            String       @id @default(uuid())
  observatorio  Observatorio
  fecha         DateTime
  horaInicio    String
  horaFin       String
  capacidadMax  Int
  cuposOcupados Int          @default(0)
  activo        Boolean      @default(true)
  reservas      Reserva[]
}

model Acompanante {
  id         String   @id @default(uuid())
  reservaId  String
  nombre     String
  apellido   String
  documento  String?
  createdAt  DateTime @default(now())
  reserva    Reserva  @relation(...)
}

model Admin {
  id           String   @id @default(uuid())
  email        String   @unique
  nombre       String
  passwordHash String
  createdAt    DateTime @default(now())
}

model ConfigSistema {
  clave     String @id
  valor     String
  updatedAt DateTime @updatedAt
  // Claves: HORA_CIERRE_VIERNES (default "16"), MAX_PERSONAS_POR_RESERVA, etc.
}

model LogAgente {
  id          String       @id @default(uuid())
  tipo        TipoLogAgente  // VALIDACION | PDF | COMUNICACION | RECORDATORIO | MODIFICACION | ANULACION
  reservaId   String
  resultado   String
  duracionMs  Int?
  metadata    Json?
  createdAt   DateTime     @default(now())
  reserva     Reserva      @relation(...)
}
```

---

## Diseño visual (tokens)

```
Fondo principal:   Stone-950  #0c0a09
Acento primario:   Amber-500  #f59e0b   (CTAs, botones, detalles)
Acento secundario: Sky-300    #7dd3fc   (info, estados, links)
Superficie:        Stone-900  #1c1917   (cards, paneles)
Texto principal:   Stone-100  #f5f5f4   (sobre fondo oscuro)
Tipografía display: Playfair Display
Tipografía body:   Libre Franklin
Formularios:       Modo claro forzado bg-stone-50 (legibilidad al sol)
```

---

## Seguridad — estado post-auditoría

| Área | Estado |
|------|--------|
| Auth admin | HMAC-SHA256 + cookie HttpOnly+Secure+SameSite=Lax |
| Rate limiting | Admin login: 10/min · Reservas: 5/min · Portal auth: 5/min |
| bcrypt | rounds: 12 |
| Timing attacks | `timingSafeEqual` en verificación admin |
| SQL injection | Inmune (Prisma ORM parametrizado) |
| XSS | CSP sin `unsafe-eval`; `frame-ancestors 'none'` |
| HSTS | `max-age=31536000; includeSubDomains` |
| Cron | Fail-CLOSED — rechaza si `CRON_SECRET` no está configurado |
| Middleware | `runtime="nodejs"` para usar Node.js crypto |
| Prisma 7 | `engineType="library"` para evitar bug de build |

---

## Pendientes para Sprint 7 — instrucciones para el agente

### Prioridad ALTA (impacto directo en calidad y usuarios)

#### 1. Tests E2E con Playwright
Implementar flujo completo de reserva end-to-end:
- Setup: `playwright.config.ts` con baseURL `http://localhost:3000`
- Tests a crear en `tests/e2e/`:
  - `reserva-flujo-completo.spec.ts`: navegar `/es` → seleccionar observatorio → elegir turno → completar 4 pasos de formulario → verificar `/exito`
  - `portal-cliente.spec.ts`: login con email+password → verificar dashboard → descargar PDF
  - `admin-flujo.spec.ts`: login admin → ver reservas → cambiar estado → exportar Excel
- El package `@playwright/test` ya está instalado como devDependency
- Usar `page.goto`, `page.fill`, `page.click`, `expect(page).toHaveURL`
- Prerequisito: tener BD local con `DATABASE_URL` en `.env.local`

#### 2. Accesibilidad WCAG AA
Auditar y corregir:
- Navegación completa por teclado (Tab, Enter, Escape, flechas en calendario)
- `aria-label` en todos los iconos de lucide-react que son interactivos
- `aria-live` en mensajes de error de formularios
- Contraste: verificar amber sobre stone-950 (puede ser borderline en algunos estados)
- `role="alert"` en validaciones del formulario multi-paso
- Skip link `<a href="#main">Saltar al contenido</a>` en el layout principal
- Focus visible en todos los elementos interactivos

#### 3. i18n — completar traducciones pendientes
Los siguientes strings están hardcodeados en español/inglés dentro del código:
- `app/[locale]/not-found.tsx` — texto de la página 404
- `app/[locale]/error.tsx` — mensaje de error genérico
- `components/email/templates.ts` — plantilla HTML de email
Agregar las claves faltantes en `messages/es.json` y `messages/en.json`

### Prioridad MEDIA

#### 4. Monitoreo y alertas (Sentry ya está instalado)
El paquete `@sentry/nextjs` ya está en `package.json` pero no está inicializado:
- Crear `sentry.client.config.ts` y `sentry.server.config.ts`
- Configurar `SENTRY_DSN` env var
- Instrumentar errores en agentes IA y transacciones de Prisma
- Crear `sentry.edge.config.ts` para el middleware

#### 5. Lighthouse / Core Web Vitals baseline
- Generar reporte Lighthouse en modo producción (necesita Vercel deploy)
- Objetivos: LCP < 2.5s, FID < 100ms, CLS < 0.1
- `@vercel/analytics` y `@vercel/speed-insights` ya están instalados
- Activar en `app/[locale]/layout.tsx`: `import { Analytics } from "@vercel/analytics/react"` y `import { SpeedInsights } from "@vercel/speed-insights/next"`

#### 6. OG images con fotografías reales
Actualmente las OG images son CSS puro (círculos decorativos). Para producción:
- Conseguir fotos oficiales de La Silla y Paranal (ESO tiene repositorio público: https://www.eso.org/public/images/)
- Actualizar `app/api/og/route.tsx` para usar `ImageResponse` con `<img>` que cargue la foto como background
- Formato recomendado: foto en izquierda, texto superpuesto con overlay oscuro

### Prioridad BAJA

#### 7. Agregar `export const dynamic = "force-dynamic"` a rutas de API con Prisma
Para evitar que Next.js intente pre-renderizar/cachear rutas que usan BD:
- Agregar en todos los `app/api/*/route.ts` que importan `prisma`
- Esto también resuelve el build local sin DATABASE_URL (Next.js no evaluará esas rutas en build time)

#### 8. Email HTML — versión en inglés
`components/email/templates.ts` actualmente genera emails solo en español.
Adaptar `emailConfirmacionHTML()` para aceptar `locale: "es" | "en"` y retornar el email en el idioma correspondiente.

---

## Comandos útiles de referencia

```bash
# Desarrollo local
cp .env.local.example .env.local    # Configurar variables locales
npm run dev                          # Servidor desarrollo http://localhost:3000

# Base de datos
npx prisma generate                  # Regenerar cliente Prisma
npx prisma migrate dev               # Aplicar migraciones en local
npx prisma db seed                   # Seed: admin@observatorioseso.cl / admin123

# Calidad
npx tsc --noEmit                     # TypeScript (debe ser 0 errores)
npx vitest run                       # Tests (debe ser 74/74)
npx vitest run --reporter=verbose    # Con detalle por test

# Deploy
vercel --prod                        # Deploy a producción (requiere vercel login)
npx prisma migrate deploy            # Aplicar migraciones en producción
```

---

## Seed de desarrollo

El seed crea automáticamente:
- **Admin**: `admin@observatorioseso.cl` / `admin123` (cambiar en producción)
- **ConfigSistema**: `HORA_CIERRE_VIERNES=16`, `MAX_PERSONAS_POR_RESERVA=10`
- **Turnos La Silla**: sábados próximos (2 meses), 09:30–13:00, cap. 20
- **Turnos Paranal**: domingos próximos (2 meses), 09:30–13:00 y 13:30–17:00, cap. 20

---

*Generado automáticamente al cierre del Sprint 6 + Auditoría de Seguridad.*
*Tests: 74/74 · TypeScript: 0 errores · Commits: 7 en master*
