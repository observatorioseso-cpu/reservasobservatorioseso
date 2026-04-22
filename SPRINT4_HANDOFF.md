# ESO Observatorios — Traspaso Sprint 4

> Documento de contexto completo para continuar el desarrollo sin pérdida de información.
> Copiar y pegar al inicio del nuevo chat.

---

## Estado actual

- **Sprints completados:** 1, 2 y 3
- **TypeScript:** 0 errores (`npx tsc --noEmit`)
- **Tests:** 44/44 pasando (Vitest)
- **Git:** repositorio local inicializado — commit `a3d7299` en rama `master`
- **GitHub:** pendiente (crear al momento del deploy en Vercel)

---

## Stack

```
Next.js 16.2.4 (App Router)   TypeScript estricto
Tailwind CSS v4                Prisma 7 + PostgreSQL
next-intl 4 (ES + EN)         Zod v4
Vitest 4                       react-hook-form 7
bcryptjs (12 rounds)           Resend (email)
@upstash/ratelimit + redis     exceljs (exportación)
framer-motion                  lucide-react (iconos — sin emojis)
@anthropic-ai/sdk ^0.90.0      @react-pdf/renderer
date-fns 4 + date-fns-tz       qrcode
```

---

## Reglas que nunca se rompen

1. **Cupos atómicos** — crear/modificar reserva y ajustar `cuposOcupados` siempre en `prisma.$transaction`
2. **Un solo contacto** — emails y WhatsApp solo al titular, nunca a acompañantes
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 en todos los modos
5. **Formularios en claro** — pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs 12 rounds, nunca en texto plano
7. **Admin protegido** — `/api/export`, `/api/admin/*` y `/admin` requieren sesión admin
8. **Sin emojis** — lucide-react para toda la iconografía
9. **Todo traducido** — strings visibles al público pasan por `next-intl`; el panel admin es español directo
10. **Pasaportes sin validar** — campo alfanumérico libre; validar dígito verificador solo cuando `detectarTipoDocumento()` retorna `"rut"`
11. **Ventana única** — confirmar/modificar/cancelar solo antes de `fechaLimiteConfirmacion` (viernes 12:00 Santiago); después, solo admin
12. **Límite cliente = 10 personas** — el cliente nunca supera 10; el admin puede superarlo
13. **shortId en la API** — `ESO-XXXXXXXX` con `randomBytes(4).toString("hex").toUpperCase()` en `POST /api/reservas`
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD; nunca hardcodear
15. **Reservas cerradas antes de la visita** — verificar `estaAbiertaLaReserva(turno.fecha, horaCierre)` en servidor

---

## Paradigma visual

```
Fondo principal:   stone-950  #0c0a09
Acento primario:   amber-500           (CTAs, botones)
Acento secundario: sky-300             (info, estados, links)
Superficie:        stone-900           (cards)
Texto principal:   stone-100           (sobre dark)
Tipografía:        Playfair Display (display) + Libre Franklin (body)
Admin:             Inter (sans)
Hero:              full-bleed parallax · texto alineado izquierda
Formularios:       modo claro forzado bg-stone-50
```

---

## Schema Prisma (completo)

```prisma
enum Observatorio { LA_SILLA  PARANAL }
enum EstadoReserva { PENDIENTE_CONFIRMACION  CONFIRMADA  ANULADA }
enum IdiomaVisita { ES  EN }
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
  turno                    Turno         @relation(...)
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
  reserva   Reserva @relation(...)
  nombre    String
  apellido  String
  documento String?
  createdAt DateTime @default(now())
}

model LogAgente {
  id        String        @id @default(cuid())
  tipo      TipoLogAgente
  reservaId String?
  reserva   Reserva?      @relation(...)
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

## Estructura de archivos (completa)

```
reservasobservatorioseso/
├── app/
│   ├── layout.tsx                          ← root (html+body mínimo, sin fonts)
│   ├── page.tsx                            ← redirect a /es
│   ├── globals.css
│   ├── [locale]/
│   │   ├── layout.tsx                      ← Playfair+Franklin, NextIntlClientProvider
│   │   ├── page.tsx                        ← landing
│   │   ├── reservar/[observatorio]/
│   │   │   ├── page.tsx                    ← Paso 1: calendario de turnos
│   │   │   └── registro/page.tsx           ← Paso 2: formulario de datos
│   │   ├── confirmar/[token]/page.tsx      ← Paso 3: confirmación post-reserva
│   │   ├── exito/page.tsx                  ← Paso 4: éxito
│   │   └── mi-reserva/
│   │       ├── page.tsx                    ← login del portal cliente
│   │       └── [token]/page.tsx            ← dashboard del portal
│   ├── admin/                              ← panel admin (sin i18n, Inter font)
│   │   ├── layout.tsx                      ← agrega Inter + dark base
│   │   ├── login/page.tsx                  ← pantalla de login
│   │   ├── dashboard/page.tsx              ← stats (Server Component)
│   │   ├── turnos/page.tsx                 ← CRUD turnos + asistencia
│   │   ├── reservas/page.tsx               ← lista paginada + export
│   │   ├── reservas/[token]/page.tsx       ← detalle + edición admin
│   │   └── config/page.tsx                 ← editor ConfigSistema
│   └── api/
│       ├── disponibilidad/route.ts         ← GET turnos públicos
│       ├── reservas/
│       │   ├── route.ts                    ← POST (crear reserva)
│       │   └── [token]/
│       │       ├── route.ts                ← GET (detalle público)
│       │       ├── confirmar/route.ts      ← POST (cliente confirma)
│       │       ├── anular/route.ts         ← POST (cliente anula)
│       │       └── acompanantes/route.ts   ← PUT (modifica grupo)
│       ├── mi-reserva/
│       │   └── auth/route.ts              ← POST (login portal cliente)
│       ├── admin/
│       │   ├── login/route.ts             ← POST + rate limit
│       │   ├── logout/route.ts            ← POST
│       │   ├── turnos/
│       │   │   ├── route.ts               ← GET + POST
│       │   │   └── [id]/
│       │   │       ├── route.ts           ← GET + PUT + DELETE
│       │   │       └── asistencia/route.ts← PUT
│       │   ├── reservas/
│       │   │   ├── route.ts               ← GET paginado
│       │   │   └── [token]/
│       │   │       ├── route.ts           ← GET + PUT admin
│       │   │       ├── anular/route.ts    ← POST + LogAgente
│       │   │       ├── confirmar/route.ts ← POST + LogAgente
│       │   │       └── nota/route.ts      ← PUT
│       │   └── config/route.ts            ← GET + PUT (upsert)
│       └── export/route.ts                ← GET (xlsx/csv, exceljs)
├── agents/
│   └── comunicaciones.ts                  ← Agente 2: email+WhatsApp (sin LLM)
├── components/
│   ├── ui/
│   │   ├── Button.tsx                     ← framer-motion, variants: primary/secondary/ghost/danger
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
│   │   ├── AdminShell.tsx                 ← sidebar colapsable (drawer mobile)
│   │   └── StatusBadge.tsx                ← PENDIENTE/CONFIRMADA/ANULADA
│   └── email/
│       └── templates.ts                   ← emailConfirmacionHTML()
├── lib/
│   ├── adminAuth.ts                       ← HMAC-SHA256, cookie eso_admin_session 8h
│   ├── confirmacion.ts                    ← calcularFechaLimiteConfirmacion, formatear, ventana
│   ├── documento.ts                       ← detectarTipoDocumento, validarRut
│   ├── email.ts                           ← resend client, EMAIL_FROM
│   ├── horarios.ts                        ← esInviernoLaSilla, getTurnosDisponibles, estaAbiertaLaReserva
│   ├── prisma.ts                          ← singleton PrismaClient
│   ├── schemas.ts                         ← reservaSchema, acompananteSchema, modificacionAcompanantesSchema
│   └── utils.ts                           ← cn()
├── i18n/
│   ├── routing.ts                         ← locales: ["es","en"], defaultLocale: "es", localePrefix: "always"
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── es.json                            ← landing, calendario, formulario, confirmacion, exito, miReserva, nav, errors, observatorios, common
│   └── en.json
├── middleware.ts                          ← next-intl para público + protección /admin/* con cookie
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/unit/
│   ├── schemas.test.ts
│   ├── horarios.test.ts
│   ├── confirmacion.test.ts
│   └── documento.test.ts
├── vercel.json                            ← crons: /api/agentes/recordatorio (12:00 y 21:00), /api/reportes/semanal (lunes 11:00), /api/reportes/mensual (día 1, 11:00)
├── next.config.ts                         ← withNextIntl, CSP headers, image domains
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── CLAUDE.md                              ← instrucciones del proyecto
└── AGENTS.md                             ← nota sobre Next.js breaking changes
```

---

## Variables de entorno (`.env` — NO está en Git)

```bash
# Base de datos
DATABASE_URL="postgresql://usuario:password@host:5432/eso_reservas"

# Admin panel
ADMIN_JWT_SECRET="string_aleatorio_minimo_64_caracteres"

# Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="ESO Chile <reservas@observatorioseso.cl>"

# WhatsApp (Meta Business Cloud API)
WHATSAPP_TOKEN="..."
WHATSAPP_PHONE_NUMBER_ID="..."

# App
NEXT_PUBLIC_BASE_URL="https://reservasobservatorioseso.cl"
```

---

## Los 5 agentes IA — estado actual

| # | Agente | Modelo | Estado | Archivo |
|---|--------|--------|--------|---------|
| 1 | Validador de reserva | claude-haiku-4-5-20251001 | **PENDIENTE** — debe activarse en `POST /api/reservas` pre-persistencia (síncrono) | `agents/validador.ts` (por crear) |
| 2 | Comunicaciones post-reserva | Sin LLM (orquestador) | **COMPLETO** | `agents/comunicaciones.ts` |
| 3 | Recordatorios + auto-anulación | Sin LLM (determinista) | **PENDIENTE** — Vercel Cron llama `/api/agentes/recordatorio` 2×/día | `agents/recordatorio.ts` (por crear) |
| 4 | Generador de PDF | Sin LLM (@react-pdf) | **PENDIENTE** — genera PDF con QR, activa post-confirmación y bajo demanda | `agents/pdf.ts` (por crear) |
| 5 | Asistente de chat | claude-sonnet-4-6 + prompt caching | **PENDIENTE** — widget flotante en todas las páginas públicas | `agents/chat.ts` (por crear) |

---

## Crons configurados en `vercel.json`

| Ruta | Schedule | Propósito |
|------|----------|-----------|
| `/api/agentes/recordatorio` | `0 12,21 * * *` | Recordatorios + auto-anulación de no-confirmadas |
| `/api/reportes/semanal` | `0 11 * * 1` | Reporte semanal al equipo ESO |
| `/api/reportes/mensual` | `0 11 1 * *` | Reporte mensual de asistencia |

---

## API Routes completas

### Públicas (sin auth)
```
GET  /api/disponibilidad?obs=LA_SILLA&fecha=YYYY-MM-DD
POST /api/reservas                          body: reservaSchema
GET  /api/reservas/[token]
POST /api/reservas/[token]/confirmar
POST /api/reservas/[token]/anular
PUT  /api/reservas/[token]/acompanantes
POST /api/mi-reserva/auth                   body: { token, password }
```

### Admin (requieren cookie eso_admin_session)
```
POST /api/admin/login                       body: { email, password }
POST /api/admin/logout
GET  /api/admin/turnos                      ?obs&desde&hasta&activo
POST /api/admin/turnos                      body: { observatorio, fecha, horaInicio, horaFin, capacidadMax }
GET  /api/admin/turnos/[id]
PUT  /api/admin/turnos/[id]
DEL  /api/admin/turnos/[id]
PUT  /api/admin/turnos/[id]/asistencia      body: { asistentesReales }
GET  /api/admin/reservas                    ?obs&estado&q&turnoId&page&limit
GET  /api/admin/reservas/[token]
PUT  /api/admin/reservas/[token]            sin restricción de ventana ni de 10 personas
POST /api/admin/reservas/[token]/anular     body: { motivo? }
POST /api/admin/reservas/[token]/confirmar
PUT  /api/admin/reservas/[token]/nota       body: { nota }
GET  /api/admin/config
PUT  /api/admin/config                      body: { entries: [{clave, valor}] }
GET  /api/export                            ?obs&desde&hasta&estado&format=xlsx|csv
```

---

## Lógica de negocio clave

### Horarios
- **La Silla:** solo sábados. Invierno (abr–ago): solo turno mañana 09:30–13:00. Verano: mañana + tarde 13:30–17:00
- **Paranal:** días programados por ESO. Siempre 2 turnos

### Cierre de reservas
- El día anterior a la visita a `HORA_CIERRE_VIERNES` (default 16h, leído de ConfigSistema)
- `estaAbiertaLaReserva(turno.fecha, horaCierre)` en `lib/horarios.ts`

### Ventana de modificación
- Hasta el viernes previo a la visita a las 12:00 Santiago
- `estaDentroDeVentanaModificacion(fechaLimiteConfirmacion)` en `lib/confirmacion.ts`

### shortId
- `ESO-XXXXXXXX` generado con `randomBytes(4).toString("hex").toUpperCase()`
- Solo en `POST /api/reservas`, nunca como default de Prisma

### Transacciones atómicas
- **Crear reserva:** verificar cupos + decrementar `cuposOcupados` + `reserva.create` en una `$transaction`
- **Anular:** `estado = ANULADA` + `cuposOcupados -= cantidadPersonas` en `$transaction`
- **Modificar personas:** `cuposOcupados += delta` en `$transaction`

---

## Sprint 4 — Alcance propuesto

### Agente 1: Validador de reserva (claude-haiku-4-5-20251001)
**Archivo:** `agents/validador.ts`
**Activación:** síncrono en `POST /api/reservas`, ANTES de `$transaction`
**Función:** validar coherencia de los datos (nombre real, email real, combinación de datos creíble)
**Modelo:** `claude-haiku-4-5-20251001`
**Debe:** retornar `{ valido: boolean, motivo?: string }` en menos de 2s

### Agente 3: Recordatorios + auto-anulación (sin LLM)
**Archivo:** `app/api/agentes/recordatorio/route.ts`
**Activación:** Vercel Cron 2×/día (12:00 y 21:00 UTC)
**Lógica:**
1. Buscar reservas `PENDIENTE_CONFIRMACION` cuya `fechaLimiteConfirmacion` < now → auto-anular (transacción + devolver cupos)
2. Enviar recordatorio por email a reservas `PENDIENTE_CONFIRMACION` con visita en próximos 3 días
3. Crear `LogAgente` de cada acción

### Agente 4: Generador de PDF (@react-pdf/renderer)
**Archivo:** `agents/pdf.ts`
**Activación:** post-confirmación + `GET /api/reservas/[token]/pdf` bajo demanda
**Contenido del PDF:** logo ESO, shortId, QR con URL del portal, datos del turno, titular, acompañantes, instrucciones de llegada
**QR:** usar librería `qrcode` (ya instalada) para generar imagen base64
**Guardar:** `pdfUrl` en la reserva (opcionalmente subir a Vercel Blob o similar)

### Agente 5: Asistente de chat (claude-sonnet-4-6 + prompt caching)
**Archivo:** `agents/chat.ts` + `components/chat/ChatWidget.tsx`
**Activación:** widget flotante en todas las páginas públicas (`app/[locale]/layout.tsx`)
**API endpoint:** `POST /api/chat`
**Modelo:** `claude-sonnet-4-6-20251001` con prompt caching en el system prompt
**Contexto del system prompt:** información sobre los observatorios, cómo reservar, política de cancelación, cómo llegar, horarios, preguntas frecuentes
**El widget:** botón flotante bottom-right, panel expandible, historial de la sesión en memoria

### Seed de base de datos
**Archivo:** `prisma/seed.ts` (ya existe, completar)
**Contenido:**
- 1 Admin con email `admin@observatorioseso.cl` y password `admin123` (solo para dev)
- ConfigSistema: `HORA_CIERRE_VIERNES=16`, `MAX_PERSONAS_CLIENTE=10`, `EMAIL_CONTACTO=reservas@observatorioseso.cl`, `WHATSAPP_ENABLED=true`
- Turnos de prueba: próximos 2 meses en La Silla (sábados) y Paranal

### Tests Sprint 4
- Test unitario del validador IA (mock de Anthropic SDK)
- Test del agente de recordatorios (lógica de fechas, sin BD)
- Test del generador de PDF (smoke test)

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Tests
npx vitest run
npx vitest run --reporter=verbose

# TypeScript
npx tsc --noEmit

# Prisma
npx prisma generate
npx prisma migrate dev --name nombre_migracion
npx prisma db seed
npx prisma studio

# Git
git log --oneline
git status
```

---

## Contexto importante para el nuevo chat

1. **Este proyecto usa Next.js 16** — puede tener breaking changes respecto a versiones anteriores. Antes de escribir código nuevo, leer `node_modules/next/dist/docs/` si hay duda sobre una API.

2. **Los route handlers de Next.js 16** reciben params como `Promise`: `(request: Request, context: { params: Promise<{ token: string }> })` — siempre usar `await context.params`.

3. **Zod v4** tiene una API diferente a v3 — usar `z.ZodIssueCode.custom` en `superRefine`, no `ctx.addIssue({ code: "custom" })` directamente.

4. **El campo `token` en Reserva** es el identificador para el cliente (URL pública). El campo `id` es el CUID interno. Las API públicas usan `token`; las de admin también usan `token` para consistencia.

5. **`@anthropic-ai/sdk ^0.90.0`** — versión disponible. Usar `prompt caching` con `cache_control: { type: "ephemeral" }` en los bloques del system prompt del agente de chat.

6. **`prisma.$transaction`** es obligatorio para cualquier operación que toque `cuposOcupados`. Sin excepción.

7. **El panel admin** vive en `app/admin/` (fuera de `[locale]`). No usa next-intl. El middleware lo protege via cookie `eso_admin_session`.

8. **Archivos de referencia del skill** (si están disponibles en `.agents/`):
   - `architecture.md` — DB, rutas, env vars
   - `design-system.md` — tokens visuales
   - `business-logic.md` — horarios, cupos, PDF, emails
   - `agents.md` — los 5 agentes con código completo
   - `ux-patterns.md` — formularios, accesibilidad
   - `seo.md` — JSON-LD, sitemap, OG
