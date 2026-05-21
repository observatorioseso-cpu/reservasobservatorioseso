<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**CRITICAL for this project:** `params` in dynamic routes is a `Promise` in Next.js 16.
Always `await params` before destructuring: `const { token } = await params`.
<!-- END:nextjs-agent-rules -->

---

# ESO Observatorios — Reglas de negocio y contexto del sistema

Sistema de reservas para visitas guiadas **gratuitas** a La Silla y Paranal (ESO Chile).

---

## REGLAS QUE NUNCA SE ROMPEN

1. **Cupos atómicos** — crear/modificar reserva y ajustar `cuposOcupados` siempre en `prisma.$transaction`
2. **Un solo contacto** — emails y WhatsApp solo al titular, nunca a acompañantes
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 para texto normal en todos los modos
5. **Formularios en claro** — Pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs rounds: 12, nunca en texto plano
7. **Admin protegido** — UI usa cookie HMAC-SHA256 `eso_admin_session` (verificada por middleware). API routes usan `getAdminFromRequest()` de `lib/adminAuth.ts` (acepta cookie o header `x-admin-token`). Env var crítica: `ADMIN_SECRET_KEY` (64 hex chars — **no** `ADMIN_JWT_SECRET`)
8. **Sin emojis** — usar lucide-react para iconografía
9. **Todo traducido** — ningún string hardcodeado en español o inglés; todo pasa por `next-intl`
10. **Pasaportes sin validar** — el campo RUT/Pasaporte acepta alfanumérico libre; solo validar dígito verificador cuando `detectarTipoDocumento()` retorna `"rut"`
11. **Ventana única** — confirmar, modificar y cancelar solo antes de `fechaLimiteConfirmacion` (viernes 12:00 Santiago); después, solo el admin puede hacer cambios
12. **Límite cliente = 10 personas** — el portal cliente nunca puede superar 10; el admin puede superarlo
13. **shortId generado en la API** — `ESO-XXXXXXXX` con `randomBytes(4).toString("hex").toUpperCase()` en `POST /api/reservas`
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD en cada `POST /api/reservas`; nunca hardcodear el valor 16
15. **Reservas cerradas antes de la visita** — verificar `estaAbiertaLaReserva(turno.fecha, horaCierre)` en el servidor antes de crear cualquier reserva de cliente
16. **Fail-open en agentes IA** — nunca bloquear una reserva por falla de Anthropic
17. **CRON_SECRET obligatorio** — endpoints cron son fail-CLOSED (retornan 401 si no está configurado)
18. **`await params`** — siempre `await params` antes de desestructurar en rutas dinámicas (Next.js 16 breaking change)

---

## FLUJO DE RESERVA

```
/ → /reservar/[obs] → /reservar/[obs]/registro → /confirmar/[token] → /exito
```

Datos de cada paso preservados en `sessionStorage` como fallback entre navegaciones.

---

## PORTAL CLIENTE — MODIFICACIÓN DE GRUPO

El cliente gestiona acompañantes desde `/mi-reserva/[token]/acompanantes`:
- Puede **agregar** si hay cupos en el turno y total ≤ 10
- Puede **eliminar** sin restricción de cupos
- Cualquier cambio resetea `estado → PENDIENTE_CONFIRMACION` y `confirmadaEn → null`
- Solo disponible antes de `fechaLimiteConfirmacion`
- Endpoint: `PUT /api/reservas/[token]/acompanantes`
- Auth: `token` (URL) + `password` (body) — sin sesión separada

---

## HORARIOS Y CIERRE DE RESERVAS

| Período | La Silla | Paranal |
|---|---|---|
| Abril–Agosto (invierno) | Solo 09:30–13:00 | 09:30–13:00 y 13:30–17:00 |
| Sept–Marzo (verano) | 09:30–13:00 y 13:30–17:00 | 09:30–13:00 y 13:30–17:00 |

- **La Silla**: solo sábados, edad mínima invierno 8 años, capacidad grupal 40
- **Paranal**: todos los sábados, edad mínima 4 años, capacidad grupal 60
- **Cierre**: día anterior a la visita a `HORA_CIERRE_VIERNES` horas Santiago (default: 16)
- Máximo 10 personas por reserva individual. 11+: redirigir a `/contacto`

---

## CAPACIDADES POR OBSERVATORIO

| Observatorio | Cupos individuales | Cupos grupales |
|---|---|---|
| La Silla | Máx. 10 (portal cliente) | Hasta 40 (flujo grupal) |
| Paranal | Máx. 10 (portal cliente) | Hasta 60 (flujo grupal) |

Grupos de 11+ usan el flujo grupal: formulario en `/contacto` → coordinación ESO.

---

## MODELOS PRISMA PRINCIPALES

```
Turno           — turnos del observatorio; cuposOcupados solo modifica en $transaction
Reserva         — reservas individuales; shortId "ESO-XXXXXXXX"; passwordHash bcrypt:12
Acompanante     — personas adicionales; onDelete Cascade
LogAgente       — trazabilidad de los 5 agentes IA
Admin           — usuarios del panel; passwordHash bcrypt:12
ConfigSistema   — parámetros operacionales (HORA_CIERRE_VIERNES, etc.)
BloqueoCalendario — cierres de emergencia (observatorio, fechaInicio, fechaFin, motivo)
BackupJob       — historial de backups diarios (status, blobUrl, stats, datosJson fallback)
MensajeContacto — mensajes del formulario /contacto (tipo: GENERAL | GRUPAL)
```

---

## CRONS ACTIVOS

| Path | Schedule UTC | Función |
|---|---|---|
| `/api/agentes/recordatorio` | `0 21 * * *` | Recordatorios de confirmación + auto-anulación de reservas vencidas |
| `/api/agentes/backup` | `0 3 * * *` | Backup diario completo → Vercel Blob o BD como fallback |

---

## PARADIGMA VISUAL

```
Fondo principal:   Stone-950 #0c0a09
Acento primario:   Amber-500 #f59e0b   (CTAs, botones)
Acento secundario: Sky-300   #7dd3fc   (info, estados, links)
Superficie:        Stone-900 #1c1917   (cards, paneles)
Texto principal:   Stone-100 #f5f5f4   (sobre fondo oscuro)
Tipografía display: Playfair Display
Tipografía body:   Libre Franklin
Formularios:       bg-stone-50 text-stone-900 (modo claro forzado)
```
