# Deployment Guide — reservasobservatorioseso.cl

This guide walks through deploying the ESO observatory reservations system to production on Vercel with a PostgreSQL database, Redis rate limiting, email delivery, and AI agents.

---

## Prerequisites

Before starting, make sure you have:

- Node.js 20.x or later: `node --version` (must show `v20.x.x` or higher)
- npm 10.x or later: `npm --version`
- Git: `git --version`
- Vercel CLI: `npm install -g vercel` then `vercel --version`
- Access to a PostgreSQL client (`psql`) or a database GUI (TablePlus, DBeaver, etc.) — optional but useful for troubleshooting
- Accounts you will need to create (all free tiers are sufficient to start):
  - [Supabase](https://supabase.com) or [Neon](https://neon.tech) — PostgreSQL database
  - [Upstash](https://console.upstash.com) — Redis (for chat rate limiting)
  - [Resend](https://resend.com) — transactional email
  - [Anthropic](https://console.anthropic.com) — Claude AI (agents 1 and 5)
  - [Vercel](https://vercel.com) — hosting and cron jobs
  - [GitHub](https://github.com) — source code repository

---

## Step 1 — Push the repository to GitHub

If you have not done this yet:

```bash
# Inside the project directory
git remote add origin https://github.com/YOUR_USERNAME/reservasobservatorioseso.git
git branch -M main
git push -u origin main
```

Verify the push succeeded by visiting your GitHub repository URL.

---

## Step 2 — Create a PostgreSQL database

You can use either **Supabase** or **Neon**. Both work identically with Prisma.

### Option A — Neon (recommended for simplicity)

1. Go to [console.neon.tech](https://console.neon.tech) and create a new project.
2. Choose a region close to your users (South America / Sao Paulo is closest for Chilean users).
3. Once created, open **Connection Details** and select **Prisma** from the framework dropdown.
4. Copy the connection string. It will look like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this as `DATABASE_URL`.

Important: use the **pooled connection string** (the one that includes `pgbouncer=true` or ends in `-pooler.neon.tech`). Serverless functions require connection pooling to avoid exhausting database connections.

### Option B — Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning (~2 minutes).
3. Go to **Settings > Database > Connection string > URI** and select **Transaction pooler** mode (port 6543).
4. The URL looks like:
   ```
   postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
5. Save this as `DATABASE_URL`.

Note: for Supabase, use the **transaction pooler** URL (port 6543), not the direct connection URL (port 5432). The direct URL is only needed for `prisma migrate deploy` (see Step 8).

---

## Step 3 — Create an Upstash Redis database

Redis is used only for rate limiting the AI chat widget. If you skip this step the chat still works — it fails open (no rate limiting applied).

1. Go to [console.upstash.com](https://console.upstash.com) and create a new **Redis** database.
2. Choose a region close to your Vercel deployment region.
3. After creation, go to the database page and find the **REST API** section.
4. Copy:
   - **UPSTASH_REDIS_REST_URL** — the HTTPS endpoint
   - **UPSTASH_REDIS_REST_TOKEN** — the token shown below the URL

---

## Step 4 — Set up Resend for transactional email

All confirmation, modification, and cancellation emails go through Resend.

1. Create an account at [resend.com](https://resend.com).
2. Go to **Domains** and add `reservasobservatorioseso.cl`.
3. Follow the DNS instructions to add the required TXT, MX, and DKIM records in your domain registrar's DNS panel. Verification typically takes a few minutes but can take up to 24 hours.
4. Once the domain shows **Verified**, go to **API Keys** and create a new key with **Full access**.
5. Copy the key — it will only be shown once.
6. Set:
   - `RESEND_API_KEY` = the key you just copied
   - `RESEND_FROM_EMAIL` = `noreply@reservasobservatorioseso.cl`

---

## Step 5 — Get an Anthropic API key

The AI agents require Anthropic API access:

- **Agent 1 (reservation validator)**: uses `claude-haiku-4-5` synchronously before persisting reservations
- **Agent 5 (chat assistant)**: uses `claude-sonnet-4-6` with prompt caching for the floating chat widget
- Agents 2, 3, and 4 are LLM-free (deterministic logic, cron jobs, PDF generation)

1. Go to [console.anthropic.com](https://console.anthropic.com).
2. Under **API Keys**, create a new key.
3. Set `ANTHROPIC_API_KEY` = the key you copied.

Make sure your Anthropic account has a funded balance or an active payment method. The haiku model is inexpensive; the sonnet model with prompt caching is moderate cost.

---

## Step 6 — Generate cryptographic secrets

Run these commands locally to generate random secrets:

```bash
# ADMIN_SECRET_KEY — 64 hex characters (256 bits)
# Used for HMAC-SHA256 admin token signing
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CRON_SECRET — 32 hex characters (128 bits)
# Used in Authorization header for Vercel Cron requests
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Run each command separately and save both values. Do not use the same value for both secrets.

---

## Step 7 — Create and configure the Vercel project

### Link the project

```bash
vercel login
vercel link
```

When prompted:
- **Set up and deploy**: Yes
- **Which scope**: your personal or team account
- **Link to existing project**: No (create new)
- **Project name**: `reservasobservatorioseso` (or your preferred name)
- **Directory**: `.` (current directory)

### Set environment variables

You can set variables via the Vercel dashboard (**Project Settings > Environment Variables**) or via CLI:

```bash
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add ADMIN_SECRET_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add CRON_SECRET production
```

Each `vercel env add` command will prompt you for the value interactively (the value is not echoed to the terminal).

For WhatsApp (optional — skip if not using Twilio):

```bash
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add TWILIO_WHATSAPP_FROM production
```

### Required values

| Variable | Value |
|---|---|
| `DATABASE_URL` | Connection string from Step 2 |
| `NEXT_PUBLIC_BASE_URL` | `https://reservasobservatorioseso.cl` |
| `ADMIN_SECRET_KEY` | 64-char hex from Step 6 |
| `ANTHROPIC_API_KEY` | Key from Step 5 |
| `RESEND_API_KEY` | Key from Step 4 |
| `RESEND_FROM_EMAIL` | `noreply@reservasobservatorioseso.cl` |
| `UPSTASH_REDIS_REST_URL` | URL from Step 3 |
| `UPSTASH_REDIS_REST_TOKEN` | Token from Step 3 |
| `CRON_SECRET` | 32-char hex from Step 6 |
| `NODE_ENV` | `production` (Vercel sets this automatically) |

### Framework settings

In **Project Settings > General**:

- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`
- Node.js Version: **20.x**

---

## Step 8 — Run Prisma migrations against the production database

Migrations must run before the first request hits the server.

### Option A — Run locally pointing at production DB

Temporarily set your local `DATABASE_URL` to the production connection string, then run:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Important: after running the seed, revert your local `.env` so you do not accidentally write to production from your development machine.

### Option B — Add a build script (recommended for CI)

Add a `vercel-build` script to `package.json` so migrations run automatically on every Vercel deployment:

```json
"scripts": {
  "vercel-build": "prisma migrate deploy && next build"
}
```

If you use this approach, also set the Vercel Build Command to `npm run vercel-build`.

Note: for Supabase, use the **direct connection URL** (port 5432, not the pooler) only for `prisma migrate deploy`. The pooler URL does not support DDL statements. You can set `DIRECT_URL` in your Prisma schema and use it only for migrations.

### What the seed creates

The seed script creates:
- Default system configuration (`ConfigSistema`)
- Initial admin user: `admin@observatorioseso.cl` with a temporary password

**Change the admin password immediately after first login.** The seed password is in `prisma/seed.ts` and should not be used in production.

---

## Step 9 — First production deploy

```bash
vercel --prod
```

This triggers a full build and deploy to production. Watch the output for any build errors. A successful deploy ends with:

```
Production: https://reservasobservatorioseso.cl [ready]
```

---

## Step 10 — Verify the deployment

After deploying, run through these checks:

### Health check

```bash
curl https://reservasobservatorioseso.cl/api/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2026-04-25T12:00:00.000Z", "db": "ok" }
```

If you get `503` with `"db": "unreachable"`, the database is not reachable — see Troubleshooting.

### Admin panel

1. Visit `https://reservasobservatorioseso.cl/admin/login`
2. Log in with the seeded admin credentials
3. Verify you can see the reservations dashboard

### PDF generation

1. Create a test reservation through the booking flow
2. Confirm it via the email link
3. Visit `/api/reservas/[token]/pdf` and verify the PDF downloads

### Cron jobs

1. In the Vercel dashboard, go to your project and open **Settings > Crons**
2. Verify the following cron jobs are listed:
   - `/api/agentes/recordatorio` — runs at `0 12,21 * * *` (12:00 and 21:00 UTC daily)
   - `/api/reportes/semanal` — runs at `0 11 * * 1` (Mondays 11:00 UTC)
   - `/api/reportes/mensual` — runs at `0 11 1 * *` (1st of each month 11:00 UTC)
3. Trigger a manual run by clicking **Run Now** on the `/api/agentes/recordatorio` job and confirm it returns `200`

Note: Vercel Cron sends an `Authorization: Bearer [CRON_SECRET]` header. Make sure `CRON_SECRET` matches what you set in Step 6.

---

## Step 11 — Configure the custom domain

1. In the Vercel dashboard, go to **Project Settings > Domains**.
2. Add `reservasobservatorioseso.cl` and `www.reservasobservatorioseso.cl`.
3. Vercel will show you DNS records to add. In your domain registrar's DNS panel, add:
   - **A record**: `@` pointing to `76.76.21.21`
   - **CNAME record**: `www` pointing to `cname.vercel-dns.com`
4. SSL certificates are provisioned automatically by Vercel via Let's Encrypt within a few minutes.
5. Propagation can take up to 48 hours, but is typically under an hour.

Verify SSL is active:

```bash
curl -I https://reservasobservatorioseso.cl/api/health
```

Look for `HTTP/2 200` and `strict-transport-security` in the response headers.

---

## Troubleshooting

### `P1001: Can't reach database server`

- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Ensure `?sslmode=require` is appended to the connection string
- For Neon: check that the project is not paused (free tier pauses after inactivity)
- For Supabase: check that the project is not paused and the IP allowlist does not block Vercel's IPs (disable IP restrictions or add `0.0.0.0/0`)

### `PrismaClientInitializationError` on first request

- Migrations have not been applied. Run `npx prisma migrate deploy` with `DATABASE_URL` pointing to production (Step 8)
- If using the `vercel-build` script, check the Vercel build logs for migration errors

### PDF generation fails or returns a blank file

- Ensure the deployment is using Node.js 20.x (check Project Settings > General > Node.js Version)
- `@react-pdf/renderer` requires canvas support. On Vercel this works on Node 20 but may fail on older versions
- Check the Vercel function logs for the specific error message

### Emails are not being delivered

- Verify the Resend domain is marked **Verified** in the Resend dashboard
- Check spam folders — new domains sometimes trigger spam filters
- Test the API key directly: `curl -H "Authorization: Bearer YOUR_KEY" https://api.resend.com/domains`
- Ensure `RESEND_FROM_EMAIL` matches the verified domain exactly

### Chat widget fails silently

- Check that `ANTHROPIC_API_KEY` is set and has a funded balance
- The chat agent fails open: if the API key is missing or invalid, the widget shows an error message but the reservation system continues to work normally
- If Redis is not configured, rate limiting is skipped and the chat still functions

### Cron jobs not running

- In Vercel dashboard under Crons, confirm `CRON_SECRET` matches what is set as an environment variable
- The cron handler at `/api/agentes/recordatorio` checks `Authorization: Bearer [CRON_SECRET]`
- Manually trigger the endpoint with the correct header to test: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://reservasobservatorioseso.cl/api/agentes/recordatorio`

### `NEXT_AUTH_SECRET` / next-auth errors

- If you see next-auth errors, generate and add `NEXTAUTH_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
  Add it as `NEXTAUTH_SECRET` in Vercel environment variables.

### Build fails with `Module not found`

- Run `npm ci` locally first to ensure all dependencies install correctly
- Check that `node_modules` is in `.gitignore` and is not committed
- If a dependency is missing from `package.json`, add it and commit before redeploying
