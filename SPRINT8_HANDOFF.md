# ESO Observatorios — Handoff completo (estado mayo 2026)

> Documento de continuidad. Captura el estado real del proyecto al 21-05-2026.
> Generado tras auditar el código fuente y corregir la documentación desactualizada.

---

## 5 hechos críticos para empezar

1. **`await params`** — Next.js 16.2.4: `params` en rutas dinámicas es `Promise`. Siempre `await params` antes de desestructurar.
2. **`prisma.$transaction` es obligatorio** en toda operación que toque `cuposOcupados`.
3. **Env var admin es `ADMIN_SECRET_KEY`** (no `ADMIN_JWT_SECRET`). 64 hex chars, HMAC-SHA256.
4. **Sin directorio `prisma/migrations/`** — el proyecto usa `prisma db push`. Nunca usar `prisma migrate`.
5. **`@vercel/blob` ya está instalado** — estaba en `package.json` pero faltaba en `node_modules`. Instalado el 2026-05-21.

---

## Identidad del proyecto

| Campo | Valor |
|---|---|
| Producto | Sistema de reservas para visitas guiadas gratuitas a observatorios ESO Chile |
| URL producción | https://reservasobservatorioseso.cl |
| Stack | Next.js 16.2.4 · React 19 · TypeScript 5 · Tailwind v4 · Prisma 7.8 (PostgreSQL) · next-intl 4 · Zod v4 · Vitest |
| Branch Git | master |
| Tests | 74/74 passing (7 archivos unit) + 3 spec files E2E |
| TypeScript | 0 errores |

---

## Estado de sprints

| Sprint | Estado | Entregables principales |
|---|---|---|
| 1–2 | ✅ | Schema Prisma, flujo de reserva completo, portal cliente, 44 tests |
| 3 | ✅ | Panel admin (auth HMAC, CRUD turnos, exportación Excel/CSV) |
| 4 | ✅ | 5 agentes IA completos |
| 5 | ✅ | SEO técnico, PWA, sitemap, robots, JSON-LD, DEPLOY.md, CI/CD, /api/health |
| 6 | ✅ | OG images dinámicas, PWA icons, páginas error/404/loading, 19 tests nuevos |
| Auditoría | ✅ | 4 bugs críticos + 6 vulnerabilidades moderadas corregidas |
| 7 | ✅ | Tests E2E, accesibilidad (skip link, role=alert), Sentry, Analytics, force-dynamic |
| Post-7 | ✅ | Backup system, bloqueos de calendario, formulario de contacto, página acompañantes, notificaciones de emergencia, generador de turnos |

---

## Inventario completo de archivos

```
reservasobservatorioseso/
├── app/
│   ├── layout.tsx                      Root layout — redirige / → /es
│   ├── page.tsx                        Redirige a /es
│   ├── not-found.tsx                   404 global (server component)
│   ├── globals.css                     Variables CSS globales + fuentes
│   ├── sitemap.ts                      XML sitemap dinámico (es+en, 4 páginas)
│   ├── robots.ts                       robots.txt (bloquea /admin /api /confirmar)
│   ├── [locale]/
│   │   ├── layout.tsx                  Playfair+Franklin, ChatWidget, NextIntlClientProvider
│   │   │                               Analytics, SpeedInsights, skip link traducido
│   │   ├── page.tsx                    Home: Organization JSON-LD, OG via /api/og
│   │   ├── not-found.tsx               404 locale-aware, stone-950, Telescope icon
│   │   ├── error.tsx                   Error boundary cliente, retry + home link
│   │   ├── loading.tsx                 Skeleton animate-pulse (nav + 2 cards)
│   │   ├── contacto/page.tsx           Formulario de contacto + reservas grupales
│   │   ├── exito/
│   │   │   ├── page.tsx                Página de éxito post-reserva
│   │   │   └── ExitoSummary.tsx        Componente de resumen
│   │   ├── reservar/[observatorio]/
│   │   │   ├── page.tsx                Calendario + TouristAttraction JSON-LD
│   │   │   ├── loading.tsx             Skeleton calendario
│   │   │   └── registro/page.tsx       Formulario multi-paso (4 pasos)
│   │   ├── confirmar/[token]/page.tsx  Confirmación de reserva
│   │   └── mi-reserva/
│   │       ├── page.tsx                Portal cliente (login)
│   │       ├── [token]/page.tsx        Portal cliente (dashboard)
│   │       └── [token]/acompanantes/page.tsx  Gestión de acompañantes
│   ├── admin/
│   │   ├── layout.tsx                  Inter font, dark base, sin i18n
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx          Stats (Server Component)
│   │   ├── turnos/page.tsx             CRUD + registro de asistencia real
│   │   ├── reservas/page.tsx           Lista paginada + filtros + export Excel/CSV
│   │   ├── reservas/[token]/page.tsx   Detalle + edición sin restricciones
│   │   ├── bloqueos/page.tsx           Cierres de emergencia y bloqueos de calendario
│   │   ├── mensajes/page.tsx           Mensajes del formulario de contacto
│   │   ├── config/page.tsx             ConfigSistema editor
│   │   └── backup/page.tsx             Historial y trigger manual de backups
│   └── api/
│       ├── disponibilidad/route.ts     GET turnos disponibles por mes (público)
│       ├── reservas/
│       │   ├── route.ts                POST crear reserva (rate limit, Zod, AI validator, $tx)
│       │   └── [token]/
│       │       ├── route.ts            GET/PUT/DELETE por token
│       │       ├── confirmar/route.ts  POST confirmar (ventana viernes 12:00)
│       │       ├── anular/route.ts     POST anular por cliente
│       │       ├── pdf/route.ts        GET descargar PDF Letter
│       │       └── acompanantes/route.ts  PUT gestión grupo ($tx atómica)
│       ├── mi-reserva/
│       │   └── auth/route.ts          POST login portal (rate limit 5/min/IP)
│       ├── contacto/route.ts           POST formulario de contacto (rate limit)
│       ├── admin/
│       │   ├── login/route.ts          POST (rate limit, bcrypt, cookie HMAC)
│       │   ├── logout/route.ts
│       │   ├── turnos/route.ts         GET+POST
│       │   ├── turnos/[id]/route.ts    GET+PUT+DELETE
│       │   ├── turnos/[id]/asistencia/route.ts  PUT registro asistencia real
│       │   ├── turnos/generar/route.ts  POST auto-generar turnos (ventana rodante)
│       │   ├── reservas/route.ts       GET paginado con filtros
│       │   ├── reservas/[token]/route.ts        GET+PUT (sin restricciones de ventana)
│       │   ├── reservas/[token]/anular/route.ts
│       │   ├── reservas/[token]/confirmar/route.ts
│       │   ├── reservas/[token]/nota/route.ts
│       │   ├── config/route.ts         GET+PUT ConfigSistema (upsert)
│       │   ├── bloqueos/route.ts       GET+POST bloqueos de calendario
│       │   ├── bloqueos/[id]/route.ts  GET+PUT+DELETE
│       │   ├── mensajes/route.ts       GET mensajes de contacto
│       │   ├── mensajes/[id]/route.ts  GET+PUT (cambiar estado: NUEVO→LEIDO→RESPONDIDO→ARCHIVADO)
│       │   ├── notificaciones/emergencia/route.ts  POST envío masivo a reservas afectadas
│       │   ├── backup/route.ts         GET historial + POST trigger manual
│       │   ├── backup/[id]/route.ts    GET datos + DELETE
│       │   └── backup/restore/route.ts  POST restaurar desde backup
│       ├── agentes/
│       │   ├── recordatorio/route.ts   GET cron Vercel (CRON_SECRET, fail-CLOSED)
│       │   └── backup/route.ts         GET cron Vercel (CRON_SECRET, fail-CLOSED)
│       ├── export/route.ts             GET xlsx/csv (auth admin)
│       ├── chat/route.ts               POST SSE streaming (Agente 5, Sonnet)
│       ├── og/route.tsx                GET OG image edge (1200×630)
│       ├── icons/[size]/route.tsx      GET PWA icon edge (192 o 512)
│       └── health/route.ts             GET health check DB (200/503)
├── agents/
│   ├── validador.ts                    Agente 1: claude-haiku-4-5-20251001, fail-open
│   ├── comunicaciones.ts               Agente 2: email+WhatsApp, sin LLM, async
│   ├── recordatorio.ts                 Agente 3: auto-anulación + recordatorios, sin LLM
│   ├── pdf.tsx                         Agente 4: @react-pdf LETTER, QR code
│   ├── pdf.ts                          Agente 4: re-export barrel
│   └── chat.ts                         Agente 5: claude-sonnet-4-6-20251001, prompt caching
├── components/
│   ├── chat/ChatWidget.tsx             Widget flotante, oculto en /admin, SSE parser
│   ├── ui/{Button,Input,FormField,Spinner,index}.ts
│   ├── reserva/{CalendarioReservas,FormularioReserva,AcompananteField,TurnoCard}.tsx
│   ├── landing/{LandingNav,LandingMarquee,ObservatoryCard}.tsx
│   ├── portal/{PortalLoginForm,PortalDashboard}.tsx
│   ├── admin/{AdminShell,StatusBadge}.tsx
│   └── email/templates.ts             4 templates bilingues: confirmación, anulación, cierre emergencia, recordatorio
├── lib/
│   ├── prisma.ts                       PrismaClient singleton (globalThis cache)
│   ├── adminAuth.ts                    HMAC-SHA256, cookie eso_admin_session 8h
│   │                                   Acepta cookie O header x-admin-token
│   │                                   LEE: ADMIN_SECRET_KEY (no ADMIN_JWT_SECRET)
│   ├── backup.ts                       Sistema de backup: generar, subir a Blob, restaurar, email resumen
│   ├── confirmacion.ts                 calcularFechaLimiteConfirmacion, ventana check
│   ├── documento.ts                    detectarTipoDocumento(), validarRut()
│   ├── email.ts                        Resend client
│   ├── horarios.ts                     esInviernoLaSilla, getTurnosDisponibles, estaAbiertaLaReserva
│   ├── jsonld.ts                       organizationSchema, touristAttractionSchema, breadcrumbSchema
│   ├── schemas.ts                      reservaSchema, acompananteSchema, modificacionAcompanantesSchema
│   └── utils.ts                        cn()
├── i18n/{routing,request,navigation}.ts
├── messages/
│   ├── es.json                         Traducciones completas en español
│   └── en.json                         Traducciones completas en inglés
│   (ambos incluyen: notFound, error, landing, calendario, formulario,
│    confirmacion, exito, miReserva, nav, errors, observatorios, common,
│    home, contacto, acompanantes)
├── middleware.ts                       next-intl + /admin/* cookie auth
│                                       runtime = "nodejs" (Node.js crypto)
├── prisma/
│   ├── schema.prisma                   9 modelos: Turno, Reserva, Acompanante, LogAgente,
│   │                                   Admin, ConfigSistema, BloqueoCalendario, BackupJob, MensajeContacto
│   │                                   engineType="library" NO ESTÁ en schema (va en prisma.config.ts)
│   └── seed.ts                         Admin + 5 ConfigSistema + 16 sábados (La Silla + Paranal)
├── prisma.config.ts                    Datasource URL (Prisma 7 config)
├── tests/
│   ├── unit/
│   │   ├── validador.test.ts           5 tests (Anthropic SDK mockeado)
│   │   ├── recordatorio.test.ts        6 tests
│   │   ├── horarios.test.ts            11 tests
│   │   ├── schemas.test.ts             tests de validación Zod
│   │   ├── confirmacion.test.ts        7 tests ventana modificación
│   │   ├── documento.test.ts           14 tests RUT/pasaporte
│   │   └── jsonld.test.ts              19 tests JSON-LD schemas
│   └── e2e/
│       ├── reserva-flujo-completo.spec.ts  Flujo completo + 404 + i18n
│       ├── portal-cliente.spec.ts          Login portal + dashboard
│       └── admin-flujo.spec.ts             Login admin + reservas + export
├── public/
│   └── manifest.webmanifest            Icons → /api/icons/192 y /api/icons/512
├── .github/
│   └── workflows/ci.yml               tsc + vitest + build en push/PR a master
├── sentry.client.config.ts             Sentry configurado (DSN via NEXT_PUBLIC_SENTRY_DSN)
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── instrumentation.ts                  Sentry instrumentation hook
├── next.config.ts                      CSP sin unsafe-eval, HSTS, withSentryConfig
├── vercel.json                         2 crons: recordatorio 21:00 UTC + backup 03:00 UTC
├── prisma.config.ts                    Configuración datasource Prisma 7 (URL aquí, no en schema)
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── README.md                           Guía de inicio rápido
├── DEPLOY.md                           Deploy completo paso a paso
├── CLAUDE.md                           Reglas, stack, skills para Claude Code
├── AGENTS.md                           Reglas de negocio para agentes IA (incluye nextjs-agent-rules)
└── SPRINT8_HANDOFF.md                  Este documento
```

---

## Reglas que NUNCA se rompen

1. **Cupos atómicos** — reserva + `cuposOcupados` siempre en `prisma.$transaction`
2. **Un solo contacto** — emails/WhatsApp solo al titular
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 para texto normal
5. **Formularios en claro** — Pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs rounds: 12
7. **Admin protegido** — cookie HMAC-SHA256 `eso_admin_session` para UI + `x-admin-token` header para API. Env var: `ADMIN_SECRET_KEY`
8. **Sin emojis** — lucide-react para iconografía
9. **Todo traducido** — ningún string hardcodeado en UI; todo por `next-intl`
10. **Pasaportes sin validar** — alfanumérico libre; RUT solo si `detectarTipoDocumento() === "rut"`
11. **Ventana única** — confirmar/modificar/cancelar solo antes de `fechaLimiteConfirmacion`
12. **Límite cliente = 10 personas** — el admin puede superar ese límite
13. **shortId en la API** — `ESO-XXXXXXXX` con `randomBytes(4).hex().toUpperCase()`
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD; nunca hardcodear
15. **Fail-open en agentes IA** — nunca bloquear una reserva por falla de Anthropic
16. **CRON_SECRET obligatorio** — endpoints cron son fail-CLOSED
17. **`await params`** — Next.js 16: `params` es `Promise<{...}>`, siempre await
18. **`db push` sin migrations** — nunca correr `prisma migrate`; usar `prisma db push`

---

## Variables de entorno completas

```bash
# Requeridas
DATABASE_URL                    # PostgreSQL pooler + sslmode=require
NEXT_PUBLIC_BASE_URL            # https://reservasobservatorioseso.cl
ADMIN_SECRET_KEY                # 64 hex chars — HMAC-SHA256 cookies admin
ANTHROPIC_API_KEY               # Agentes 1 (Haiku) y 5 (Sonnet)
RESEND_API_KEY                  # Emails transaccionales
RESEND_FROM_EMAIL               # noreply@reservasobservatorioseso.cl
CRON_SECRET                     # Header Vercel Cron — fail-CLOSED si ausente

# Opcionales (fail-open si ausentes)
UPSTASH_REDIS_REST_URL          # Rate limiting
UPSTASH_REDIS_REST_TOKEN        # Rate limiting
TWILIO_ACCOUNT_SID              # WhatsApp
TWILIO_AUTH_TOKEN               # WhatsApp
TWILIO_WHATSAPP_FROM            # whatsapp:+14155238886

# Nuevas (post Sprint 7)
BLOB_READ_WRITE_TOKEN           # Vercel Blob para backups (fallback a BD si ausente)
BACKUP_REPORT_EMAIL             # Email para resumen de backup (default: reservas@observatorioseso.cl)
NEXT_PUBLIC_SENTRY_DSN          # Sentry error tracking (opcional)
```

---

## Esquema Prisma — todos los modelos

```prisma
model Turno {
  id           String       @id @default(cuid())
  observatorio Observatorio  // LA_SILLA | PARANAL
  fecha        DateTime     @db.Date
  horaInicio   String       // "09:30"
  horaFin      String       // "13:00"
  capacidadMax Int
  cuposOcupados Int         @default(0)
  activo       Boolean      @default(true)
  // Asistencia real (para reportes):
  asistentesReales Int?
  asistenciaRegistradaEn DateTime?
  asistenciaRegistradaPor String?
  @@unique([observatorio, fecha, horaInicio])
}

model Reserva {
  id      String @id @default(cuid())
  token   String @unique @default(cuid())
  shortId String @unique  // "ESO-A1B2C3D4"
  observatorio Observatorio
  turnoId      String
  estado       EstadoReserva @default(PENDIENTE_CONFIRMACION)
  fechaLimiteConfirmacion DateTime
  confirmadaEn DateTime?
  nombre String; apellido String; rutOPasaporte String
  email String; telefono String
  idioma IdiomaVisita @default(ES)
  cantidadPersonas Int
  tienesMenores Boolean @default(false)
  recibirWhatsapp Boolean @default(false)
  whatsappOptIn Boolean @default(false)
  passwordHash String  // bcrypt:12
  locale String @default("es")
  pdfUrl String?
  notaAdmin String?
}

model BloqueoCalendario {
  id           String   @id @default(cuid())
  observatorio String?  // null = ambos; "LA_SILLA" | "PARANAL"
  fechaInicio  DateTime @db.Date
  fechaFin     DateTime @db.Date
  motivo       String
  creadoPor    String?
}

model BackupJob {
  id          String   @id @default(cuid())
  status      String   // "EN_PROGRESO" | "COMPLETADO" | "ERROR"
  triggeredBy String   @default("cron")
  blobUrl     String?
  sizeBytes   Int      @default(0)
  checksum    String   @default("")
  stats       Json     @default("{}")
  datosJson   Json?    // Backup completo en BD si Blob no disponible
  error       String?
}

model MensajeContacto {
  id           String        @id @default(cuid())
  tipo         TipoConsulta  @default(GENERAL)  // GENERAL | GRUPAL
  nombre String; email String; telefono String?; mensaje String @db.Text
  organizacion String?; numPersonas Int?; observatorio String?; fechasPref String?
  estado EstadoMensaje @default(NUEVO)  // NUEVO|LEIDO|RESPONDIDO|ARCHIVADO
  ip String?; userAgent String?
}

model ConfigSistema {
  clave      String   @id
  valor      String
  descripcion String?
  updatedBy  String?
  // Claves seed: HORA_CIERRE_VIERNES(16), HORA_RECORDATORIO_VIERNES(8),
  //              EMAIL_CONTACTO_RESERVAS, TELEFONO_WHATSAPP_ESO, MAX_PERSONAS_CLIENTE(10),
  //              VENTANA_RESERVA_DIAS(90)
}

model Admin {
  id String @id @default(cuid())
  email String @unique; nombre String; passwordHash String  // bcrypt:12
}

model LogAgente {
  id String @id @default(cuid())
  tipo TipoLogAgente  // VALIDACION|COMUNICACION|RECORDATORIO|AUTOANULACION|PDF|MODIFICACION|CONFIRMACION|ANULACION|CIERRE_EMERGENCIA|EMAIL|WHATSAPP|ERROR
  reservaId String?; resultado String; metadata Json?; duracionMs Int?
}
```

---

## Los 5 agentes IA

| # | Agente | Archivo | Modelo | Trigger | Fallo |
|---|---|---|---|---|---|
| 1 | Validador | `agents/validador.ts` | claude-haiku-4-5-20251001 | Pre-persistencia (síncrono) | Fail-open |
| 2 | Comunicaciones | `agents/comunicaciones.ts` | Sin LLM | Post-reserva async | Fail-open |
| 3 | Recordatorio/Anulación | `agents/recordatorio.ts` | Sin LLM | Vercel Cron `0 21 * * *` | Fail-open |
| 4 | PDF | `agents/pdf.tsx` + `pdf.ts` | Sin LLM (@react-pdf) | Bajo demanda `/api/reservas/[token]/pdf` | Lanza error |
| 5 | Chat | `agents/chat.ts` | claude-sonnet-4-6-20251001 | Widget flotante SSE | Fail-open |

---

## Seguridad — estado post-auditoría

| Área | Estado |
|---|---|
| Auth admin | HMAC-SHA256 + cookie HttpOnly+Secure+SameSite=Strict (8h) |
| Rate limiting | Admin login: 10/min · Reservas: 5/min · Portal auth: 5/min · Contacto: rate limitado |
| bcrypt | rounds: 12 |
| Timing attacks | `timingSafeEqual` en verificación admin |
| SQL injection | Inmune (Prisma ORM parametrizado) |
| XSS | CSP sin `unsafe-eval`; `frame-ancestors 'none'` |
| HSTS | `max-age=31536000; includeSubDomains` |
| Cron | Fail-CLOSED — rechaza si `CRON_SECRET` no está configurado |
| Middleware | `runtime="nodejs"` para Node.js crypto |

---

## Seed de desarrollo

```
Admin: admin@observatorioseso.cl / admin123  ← CAMBIAR EN PRODUCCIÓN
ConfigSistema: 6 claves (HORA_CIERRE_VIERNES=16, MAX_PERSONAS_CLIENTE=10, VENTANA_RESERVA_DIAS=90, ...)
Turnos La Silla: próximos 16 sábados, 09:30–13:00, cap. 40
Turnos Paranal: próximos 16 sábados, 09:30–13:00 y 13:30–17:00, cap. 60
```

---

## Qué se hizo entre Sprint 7 y este handoff

- Instalado `@vercel/blob` (faltaba en node_modules, estaba en package.json)
- Agregado cron de backup a `vercel.json` (`0 3 * * *`, faltaba aunque la ruta existía)
- Skip link en `[locale]/layout.tsx` ahora usa `t("common.skipToMain")` (era hardcodeado)
- Agregada clave `"skipToMain"` en `messages/es.json` y `messages/en.json`
- Actualizados: README.md, CLAUDE.md, AGENTS.md, DEPLOY.md
- Creado: SPRINT8_HANDOFF.md (este documento)

---

## Comandos de referencia

```bash
npm run dev                          # Servidor desarrollo http://localhost:3000
npx prisma generate                  # Regenerar cliente Prisma
npx prisma db push                   # Aplicar schema (no migrate)
npx prisma db seed                   # Seed: admin + config + turnos
npx tsc --noEmit                     # TypeScript (debe ser 0 errores)
npx vitest run                       # Unit tests (debe ser 74/74)
npm run test:e2e                     # E2E tests (requiere BD local)
vercel --prod                        # Deploy a producción
```

---

## Próximos pasos sugeridos

| Prioridad | Tarea |
|---|---|
| ALTA | Accesibilidad profunda: `aria-label` en iconos interactivos lucide-react, `aria-live` en errores dinámicos de formularios |
| ALTA | Segunda pasada de tests E2E: edge cases (token inválido, reserva rechazada, portal sin BD) |
| MEDIA | OG images con fotos reales de ESO (repositorio público en eso.org/public/images) |
| MEDIA | Actualizar archivos de referencia del skill (creados en abril, desactualizados) |
| BAJA | Estado `AUSENTE_VISITA` en panel admin (enum existe, falta integración UI) |
| BAJA | Segunda dirección de email de confirmación (ej: CC al admin) |

---

*Generado al 2026-05-21. TypeScript: 0 errores · Tests: 74/74 · Commits: 7 en master.*
