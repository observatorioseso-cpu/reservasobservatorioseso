@AGENTS.md

# ESO Observatorios — Reservasobservatorioseso.cl

Sistema de reservas para visitas guiadas gratuitas a La Silla y Paranal.
Stack: Next.js App Router · Tailwind · Prisma (PostgreSQL) · next-intl · Zod v4 · Vitest

---

## REGLAS QUE NUNCA SE ROMPEN

1. **Cupos atómicos** — crear/modificar reserva y ajustar `cuposOcupados` siempre en una sola `prisma.$transaction`
2. **Un solo contacto** — emails y WhatsApp solo al titular, nunca a acompañantes
3. **Sin `h-screen`** — siempre `min-h-[100dvh]`
4. **Contraste WCAG AA** — mínimo 4.5:1 para texto normal en todos los modos
5. **Formularios en claro** — Pasos 3 y 4 usan `bg-stone-50 text-stone-900`
6. **Contraseñas hasheadas** — bcryptjs rounds: 12, nunca en texto plano
7. **Admin protegido** — `/api/export`, `/api/admin/*` y `/admin` requieren `X-Admin-Token`
8. **Sin emojis** — usar lucide-react para iconografía
9. **Todo traducido** — ningún string hardcodeado en español o inglés; todo pasa por `next-intl`
10. **Pasaportes sin validar** — el campo RUT/Pasaporte acepta alfanumérico libre; solo validar dígito verificador cuando `detectarTipoDocumento()` retorna `"rut"`
11. **Ventana única** — confirmar, modificar y cancelar solo antes de `fechaLimiteConfirmacion` (viernes 12:00 Santiago); después, solo el admin puede hacer cambios
12. **Límite cliente = 10 personas** — el cliente nunca puede superar 10 personas en su portal; el admin puede superar ese límite desde el panel
13. **shortId generado en la API** — `ESO-XXXXXXXX` se genera con `randomBytes(4).toString("hex").toUpperCase()` en `POST /api/reservas`, nunca con un default de Prisma
14. **ConfigSistema como fuente de verdad** — leer `HORA_CIERRE_VIERNES` desde BD en cada `POST /api/reservas`; nunca hardcodear el valor 16
15. **Reservas cerradas antes de la visita** — verificar `estaAbiertaLaReserva(turno.fecha, horaCierre)` en el servidor antes de crear cualquier reserva de cliente

---

## FLUJO DE RESERVA

```
/ → /reservar/[obs] → /reservar/[obs]/registro → /confirmar/[token] → /exito
```

Cada paso preserva datos en `sessionStorage` como fallback.

---

## PORTAL CLIENTE — MODIFICACIÓN DE GRUPO (Opción 3)

El cliente gestiona acompañantes individualmente desde `/mi-reserva`:
- Puede **agregar** acompañantes si hay cupos en el turno y total ≤ 10
- Puede **eliminar** acompañantes sin restricción de cupos
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

- **La Silla días habilitados — invierno (abril–agosto)**: solo sábados, un turno (09:30–13:00)
- **La Silla días habilitados — verano (sept–marzo)**: sábados (mismo turno) + domingos opcionales (09:30–13:00) que el admin activa o desactiva libremente
- **Paranal días habilitados — todo el año**: todos los sábados, dos turnos (09:30–13:00 y 13:30–17:00); no hay días variables
- **Cierre de reservas**: día anterior a la visita a `HORA_CIERRE_VIERNES` (default 16:00 Santiago)
- Máximo 10 personas por reserva de cliente. 11+: redirigir al formulario grupal en `/contacto`

## CAPACIDADES POR OBSERVATORIO

| Observatorio | Cupos máximos por visita grupal |
|---|---|
| La Silla | 40 personas |
| Paranal | 60 personas |

- El límite de 10 personas aplica solo a reservas individuales del portal cliente
- Grupos de 11+ usan el flujo grupal (`/contacto` → planilla CSV → coordinación ESO)
- El admin puede crear/editar turnos superando el límite de 10 del portal cliente

---

## PARADIGMA VISUAL

```
Fondo principal:  Stone-950 #0c0a09
Acento primario:  Electric Amber #f59e0b  (CTAs, botones)
Acento secundario: Ice Blue #7dd3fc       (info, estados, links)
Superficie:       Stone-900 #1c1917       (cards)
Texto principal:  Stone-100 #f5f5f4       (sobre dark)
Tipografía:       Playfair Display (display) + Libre Franklin (body)
Hero layout:      Full-bleed parallax · texto alineado izquierda
Formularios:      Modo claro forzado bg-stone-50 (legibilidad al sol)
```

---

## LOS 5 AGENTES IA

| Agente | Modelo | Activación |
|---|---|---|
| Validador de reserva | claude-haiku-4-5-20251001 | Pre-persistencia (síncrono) |
| Comunicaciones post-reserva | Orquestador (sin LLM) | Post-persistencia + modificación (async) |
| Recordatorios + auto-anulación | Sin LLM (determinista) | Vercel Cron × 2 al día |
| Generador de PDF | Sin LLM (@react-pdf) | Post-confirmación + bajo demanda |
| Asistente de chat | claude-sonnet-4-6 + prompt caching | Widget flotante en todas las páginas |

---

## ARCHIVOS DE REFERENCIA DEL SKILL

| Necesidad | Archivo |
|---|---|
| DB, rutas API, env vars, seguridad | `.agents/skills/eso-observatorios-web-builder/references/architecture.md` |
| Componentes visuales, tokens, motion | `.agents/skills/eso-observatorios-web-builder/references/design-system.md` |
| Horarios, cupos, RUT/Pasaporte, PDF, emails | `.agents/skills/eso-observatorios-web-builder/references/business-logic.md` |
| Los 5 agentes IA con código completo | `.agents/skills/eso-observatorios-web-builder/references/agents.md` |
| Formularios, accesibilidad, mobile, UX | `.agents/skills/eso-observatorios-web-builder/references/ux-patterns.md` |
| SEO, JSON-LD, sitemap, Open Graph | `.agents/skills/eso-observatorios-web-builder/references/seo.md` |
