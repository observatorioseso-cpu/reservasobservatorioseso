# Reservas Observatorios ESO Chile

Sistema de reservas para visitas guiadas gratuitas a los observatorios La Silla y Paranal (ESO Chile).

**URL producción:** https://reservasobservatorioseso.cl  
**Stack:** Next.js 16.2.4 · React 19 · TypeScript 5 · Tailwind v4 · Prisma 7 · PostgreSQL · next-intl v4

---

## Inicio rápido (desarrollo local)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con DATABASE_URL y ADMIN_SECRET_KEY

# 3. Aplicar schema y sembrar datos de prueba
npx prisma db push
npx prisma db seed

# 4. Generar cliente Prisma
npx prisma generate

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abrir http://localhost:3000

**Credenciales de desarrollo:**
- Admin: `admin@observatorioseso.cl` / `admin123`
- Panel admin: http://localhost:3000/admin

---

## Comandos frecuentes

```bash
# TypeScript — debe retornar 0 errores
npx tsc --noEmit

# Tests unitarios — debe retornar 74/74
npx vitest run

# Tests E2E (requiere BD local activa)
npm run test:e2e

# Build de producción local
npm run build
```

---

## Arquitectura

```
/                        → Landing (observatorios + proceso)
/reservar/[obs]          → Calendario de disponibilidad
/reservar/[obs]/registro → Formulario de reserva (4 pasos)
/confirmar/[token]       → Confirmación post-reserva
/exito                   → Éxito post-confirmación
/mi-reserva              → Portal cliente (login)
/mi-reserva/[token]      → Dashboard reserva (confirmar/anular/PDF)
/mi-reserva/[token]/acompanantes → Gestión de acompañantes
/contacto                → Formulario de contacto + reservas grupales
/admin                   → Panel de administración (protegido)
```

### Panel admin

| Ruta | Función |
|---|---|
| `/admin/dashboard` | Estadísticas y resumen del sistema |
| `/admin/reservas` | Lista paginada con filtros + exportación Excel/CSV |
| `/admin/reservas/[token]` | Detalle + edición sin restricciones de ventana |
| `/admin/turnos` | CRUD de turnos + registro de asistencia real |
| `/admin/bloqueos` | Cierres de emergencia y bloqueos de calendario |
| `/admin/mensajes` | Mensajes del formulario de contacto |
| `/admin/config` | ConfigSistema (parámetros operacionales) |
| `/admin/backup` | Backup manual + historial de backups automáticos |

### Los 5 agentes IA

| # | Agente | Modelo | Trigger |
|---|---|---|---|
| 1 | Validador | `claude-haiku-4-5-20251001` | Pre-persistencia (síncrono, fail-open) |
| 2 | Comunicaciones | Sin LLM | Post-reserva async (Resend + WhatsApp) |
| 3 | Recordatorio/Anulación | Sin LLM | Vercel Cron `0 21 * * *` |
| 4 | PDF | Sin LLM (`@react-pdf`) | Bajo demanda `/api/reservas/[token]/pdf` |
| 5 | Chat | `claude-sonnet-4-6-20251001` | Widget flotante SSE + prompt caching |

### Crons activos (`vercel.json`)

| Path | Schedule | Descripción |
|---|---|---|
| `/api/agentes/recordatorio` | `0 21 * * *` | Recordatorios + auto-anulación (21:00 UTC) |
| `/api/agentes/backup` | `0 3 * * *` | Backup diario completo (03:00 UTC) |

---

## Variables de entorno

Ver `.env.local.example` para desarrollo y `.env.production.example` para producción.

Variables requeridas:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooler, `?sslmode=require`) |
| `NEXT_PUBLIC_BASE_URL` | `https://reservasobservatorioseso.cl` |
| `ADMIN_SECRET_KEY` | 64 hex chars — firma HMAC-SHA256 de cookies admin |
| `ANTHROPIC_API_KEY` | Agentes 1 y 5 |
| `RESEND_API_KEY` | Emails transaccionales |
| `RESEND_FROM_EMAIL` | `noreply@reservasobservatorioseso.cl` |
| `CRON_SECRET` | Header de autorización para Vercel Cron (fail-CLOSED) |

Variables opcionales:

| Variable | Descripción |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Rate limiting (fail-open si ausente) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `TWILIO_ACCOUNT_SID` | WhatsApp (fail-open si ausente) |
| `TWILIO_AUTH_TOKEN` | WhatsApp |
| `TWILIO_WHATSAPP_FROM` | Ej: `whatsapp:+14155238886` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob para backups (fallback a BD si ausente) |
| `BACKUP_REPORT_EMAIL` | Email para resumen de backup (default: `reservas@observatorioseso.cl`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking |

---

## Guía de deploy completa

Ver [DEPLOY.md](DEPLOY.md).

---

## Documentación técnica

| Documento | Contenido |
|---|---|
| [DEPLOY.md](DEPLOY.md) | Deploy paso a paso a Vercel + troubleshooting |
| [AGENTS.md](AGENTS.md) | Reglas de negocio y contexto para agentes IA |
| [SPRINT8_HANDOFF.md](SPRINT8_HANDOFF.md) | Estado completo actual del proyecto (mayo 2026) |
