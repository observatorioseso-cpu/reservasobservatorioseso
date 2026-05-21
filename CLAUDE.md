@AGENTS.md

# ESO Observatorios — Reservasobservatorioseso.cl

Sistema de reservas para visitas guiadas gratuitas a La Silla y Paranal.

**Stack canónico:**

| Layer | Tecnología |
|---|---|
| Framework | Next.js 16.2.4 App Router (Server Components por defecto) |
| Styling | Tailwind CSS v4 — Grid > Flexbox, **NUNCA `h-screen`** |
| Motion | Framer Motion — spring physics, stagger reveals |
| Icons | lucide-react — **sin emojis en markup** |
| DB | PostgreSQL + Prisma 7.8 (pooler + `?sslmode=require`) |
| Schema | `prisma db push` (sin directorio de migrations) |
| Auth | next-auth ^4 + Prisma Adapter (no usado en flujo principal) |
| Admin auth | HMAC-SHA256 cookie `eso_admin_session` (8h) + `x-admin-token` header fallback |
| i18n | next-intl v4 — todo string pasa por traducción |
| Email | Resend |
| WhatsApp | Meta Business Cloud API (fail-open si credenciales ausentes) |
| PDF | @react-pdf/renderer (LETTER 8.5×11") |
| Export | exceljs |
| IA | @anthropic-ai/sdk — 5 agentes definidos |
| Validación | Zod v4 + react-hook-form |
| Rate limiting | @upstash/ratelimit + Redis (fail-open si ausente) |
| Backup | @vercel/blob (fallback a JSON en BD si token ausente) |
| Monitoring | @sentry/nextjs + @vercel/analytics + @vercel/speed-insights |

---

## REGLAS QUE NUNCA SE ROMPEN

1. **Cupos atómicos** — crear/modificar reserva y ajustar `cuposOcupados` siempre en una sola `prisma.$transaction`
2. **Un solo contacto** — emails y WhatsApp solo al titular, nunca a acompañantes
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 para texto normal en todos los modos
5. **Formularios en claro** — Pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs rounds: 12, nunca en texto plano
7. **Admin protegido** — UI: cookie `eso_admin_session` (HMAC-SHA256, verificada en middleware). API routes: `getAdminFromRequest()` de `lib/adminAuth.ts` (acepta cookie o header `x-admin-token`). Env var: `ADMIN_SECRET_KEY` (64 hex chars)
8. **Sin emojis** — usar lucide-react para iconografía
9. **Todo traducido** — ningún string hardcodeado en español o inglés; todo pasa por `next-intl`
10. **Pasaportes sin validar** — el campo RUT/Pasaporte acepta alfanumérico libre; solo validar dígito verificador cuando `detectarTipoDocumento()` retorna `"rut"`
11. **Ventana única** — confirmar, modificar y cancelar solo antes de `fechaLimiteConfirmacion` (viernes 12:00 Santiago); después, solo el admin puede hacer cambios
12. **Límite cliente = 10 personas** — el cliente nunca puede superar 10 en su portal; el admin puede superar ese límite
13. **shortId generado en la API** — `ESO-XXXXXXXX` con `randomBytes(4).toString("hex").toUpperCase()` en `POST /api/reservas`, nunca con default de Prisma
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD en cada `POST /api/reservas`; nunca hardcodear
15. **Reservas cerradas antes de la visita** — verificar `estaAbiertaLaReserva(turno.fecha, horaCierre)` en el servidor antes de crear reserva
16. **Fail-open en agentes IA** — nunca bloquear una reserva por falla de Anthropic
17. **CRON_SECRET obligatorio** — endpoints cron son fail-CLOSED (retornan 401 si no está configurado)
18. **`await params`** — En Next.js 16, `params` en rutas dinámicas es `Promise<{...}>`. Siempre `await params` antes de desestructurar

---

## FLUJO DE RESERVA

```
/ → /reservar/[obs] → /reservar/[obs]/registro → /confirmar/[token] → /exito
```

Cada paso preserva datos en `sessionStorage` como fallback.

---

## HORARIOS Y CIERRE DE RESERVAS

| Período | La Silla | Paranal |
|---|---|---|
| Abril–Agosto (invierno) | Solo 09:30–13:00 | 09:30–13:00 y 13:30–17:00 |
| Sept–Marzo (verano) | 09:30–13:00 y 13:30–17:00 | 09:30–13:00 y 13:30–17:00 |

- La Silla: solo sábados · edad mínima invierno: 8 años · capacidad grupal: 40
- Paranal: todos los sábados · edad mínima: 4 años · capacidad grupal: 60
- Cierre de reservas: día anterior a la visita a `HORA_CIERRE_VIERNES` horas Santiago (default 16:00)
- Máximo 10 personas por reserva individual. 11+: redirigir a `/contacto`

---

## PARADIGMA VISUAL

```
Fondo principal:   Stone-950 #0c0a09
Acento primario:   Amber-500 #f59e0b   (CTAs, botones, detalles)
Acento secundario: Sky-300   #7dd3fc   (info, estados, links)
Superficie:        Stone-900 #1c1917   (cards, paneles)
Texto principal:   Stone-100 #f5f5f4   (sobre fondo oscuro)
Tipografía display: Playfair Display (var --font-playfair)
Tipografía body:   Libre Franklin (var --font-franklin)
Formularios:       Modo claro forzado bg-stone-50 (legibilidad al sol)
```

---

## LOS 5 AGENTES IA

| # | Agente | Modelo | Activación | Fallo |
|---|---|---|---|---|
| 1 | Validador | `claude-haiku-4-5-20251001` | Pre-persistencia (síncrono) | Fail-open |
| 2 | Comunicaciones | Sin LLM | Post-reserva async (Resend + WhatsApp) | Fail-open |
| 3 | Recordatorio/Anulación | Sin LLM | Vercel Cron `0 21 * * *` | Fail-open |
| 4 | PDF | Sin LLM (@react-pdf) | Bajo demanda `/api/reservas/[token]/pdf` | Lanza error |
| 5 | Chat | `claude-sonnet-4-6-20251001` | Widget flotante SSE + prompt caching | Fail-open |

---

## CRONS ACTIVOS

| Path | Schedule UTC | Función |
|---|---|---|
| `/api/agentes/recordatorio` | `0 21 * * *` | Recordatorios de confirmación + auto-anulación |
| `/api/agentes/backup` | `0 3 * * *` | Backup diario completo (Blob o BD) |

---

## ARCHIVOS DE REFERENCIA DEL SKILL

Cuando necesites profundidad en algún área, leer el archivo correspondiente
en `C:\Users\maste\OneDrive\Documents\BE VIRAL\agentes-marketing-skill-web-creation\.agents\skills\eso-observatorios-web-builder\references\`:

| Necesidad | Archivo |
|---|---|
| DB, rutas API, env vars, seguridad | `architecture.md` |
| Componentes visuales, tokens, motion | `design-system.md` |
| Horarios, cupos, RUT/Pasaporte, PDF, emails | `business-logic.md` |
| Los 5 agentes IA con código completo | `agents.md` |
| Formularios, accesibilidad, mobile, UX | `ux-patterns.md` |
| SEO, JSON-LD, sitemap, Open Graph | `seo.md` |

**Nota:** estos archivos son de la versión inicial (abril 2026). Para el estado actual completo,
consultar `SPRINT8_HANDOFF.md` en la raíz del proyecto.

---

## SKILLS ACTIVOS

| Skill | Cuándo activar |
|---|---|
| `eso-observatorios-web-builder` | Implementar UI, componentes, flujo de reserva, diseño visual, SEO, PWA |
| `eso-ingenieria-tech` | Arquitectura, DB, API routes, TypeScript, CI/CD, Sentry, analytics, staging |
| `eso-ciberseguridad` | Seguridad, validaciones, tokens, rate limiting, OWASP, pre-deploy |
| `eso-arquitecto-agentes` | Diseño, evaluación y mejora de los 5 agentes IA del sistema |
| `eso-legal-compliance` | Privacidad (Ley 21.719), WhatsApp opt-in, términos, retención de datos |
| `eso-qa-testing` | Tests unitarios, integración, E2E, benchmarks, cobertura, QA pre-deploy |
| `eso-reportes` | Reportes semanales y mensuales automáticos con gráficos, asistencia real, análisis LLM |
