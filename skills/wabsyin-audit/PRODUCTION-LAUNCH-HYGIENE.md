# Production Launch Hygiene & Vibe-Coder Blind-Spot Audit

#### When to use this file

Use this Track 2 companion on every web, API, SaaS, AI, or mobile-backend codebase preparing for production deployment. Vibe coders using AI code generators move fast and focus on the "happy path" — leaving behind silent production landmines: missing HTTP security headers, 4-digit OTPs with unlimited guesses, unverified email signups, exposed browser source maps, raw database errors sent to users, missing startup env checks, open spam-relay email forms, and accidental `robots.txt` misconfigurations.

Output structured records for `compliance-findings.json` (`framework: "LAUNCH_HYGIENE"`). Remember: if one of these issues creates a directly exploitable cross-boundary security vulnerability (for example an unauthenticated `/api/seed` endpoint wiping or leaking data), report the exploit in Track 1 (`findings.json`) **and** track the readiness gate here concisely without duplicating exploit prose.

---

## Mandatory Check Catalogue (`HYGIENE-*`)

### `HYGIENE-01` — HTTP Security Headers & Browser Hardening Policy
- **What to check:** Inspect `next.config.*` (`headers()`), `middleware.ts`, `vercel.json`, `netlify.toml`, `public/_headers`, Cloudflare Worker response wrappers, Express `helmet()`, FastAPI/Django middleware, or Nginx/Caddy configs for baseline response headers on HTML/app routes:
  - `Strict-Transport-Security` (HSTS, e.g. `max-age=63072000; includeSubDomains; preload`)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` or `SAMEORIGIN` / CSP `frame-ancestors`
  - `Referrer-Policy: strict-origin-when-cross-origin` (or stricter)
  - `Permissions-Policy` (restricting unused `camera=()`, `microphone=()`, `geolocation=()`)
  - `Content-Security-Policy` (CSP — checking whether a CSP exists and avoids trivial `unsafe-eval` / `*` where avoidable).
- **Verdict guide:** `medium` `fail` if security headers are completely unconfigured in repo configs (or `needs_manual_check` if headers are managed solely at external Cloudflare/CDN edge not committed in IaC, while still recommending repo-level defaults!).

### `HYGIENE-02` — Auth Abuse Protection: Rate Limiting, OTP Attempt Caps & Bot Defense
- **What to check:**
  1. **Rate Limiting:** Are public authentication and mutation endpoints (`/api/auth/*`, login, signup, password reset, magic link, OTP send, OTP verify, waitlist, contact form, expensive search/AI routes) protected by shared/distributed rate limiting (e.g., Upstash Redis `@upstash/ratelimit`, Cloudflare Rate Limiting, database/KV counters — *warn that in-memory `new Map()` inside serverless Vercel/Lambda functions resets per cold start and does not protect across instances!*).
  2. **OTP / Verification Code Strength:** If custom email/SMS OTP is implemented, verify: (a) generated with `crypto.randomInt` / CSPRNG (never `Math.random()`); (b) short TTL (`<= 10 minutes`); (c) strict per-challenge failed-attempt counter (`<= 5` wrong attempts invalidates the OTP!); and (d) OTP deleted/marked consumed atomically on first use.
  3. **Bot / CAPTCHA Gate:** Check whether public signup, OTP-send, password-reset, and unauthenticated contact/AI endpoints integrate bot verification (e.g., Cloudflare Turnstile, hCaptcha, reCAPTCHA) with server-side token verification.
- **Verdict guide:** `blocker` `fail` if custom OTP uses `Math.random()` or allows unlimited brute-force attempts on 4–6 digit codes; `high` `fail` if auth/OTP/public mutation routes have zero rate limiting or rely only on serverless in-memory `Map()`.

### `HYGIENE-03` — Email / Phone Verification & Session Lifecycle Hygiene
- **What to check:**
  1. Does email/password signup verify email ownership before allowing sensitive mutations, team invites, outbound emails, or free-trial credit consumption? (Check Supabase `enable_confirmations`, Auth.js/BetterAuth/Clerk settings, or custom `emailVerified` checks).
  2. Are active sessions / refresh tokens invalidated on password change, email change, role demotion, and account deletion?
  3. Do cookies carrying session/auth state set `HttpOnly`, `Secure` (in production), and explicit `SameSite` (`Lax` or `Strict`)?
- **Verdict guide:** `high` `fail` if unverified email signups can claim paid trials/send emails/join orgs by email domain or if session cookies explicitly disable `HttpOnly`/`Secure` in production; `medium` `fail` if password change leaves other sessions indefinitely active.

### `HYGIENE-04` — Production Error Handling, Stack-Trace Suppression & Source-Map Hygiene
- **What to check:**
  1. **API Error Responses:** Scan route `catch (err)` blocks and global error handlers. Flag code returning `err.message`, `err.stack`, raw Prisma/Postgres/Mongo error objects (`res.status(500).json({ error: err })`), or internal file paths/SQL queries directly to clients in production.
  2. **UI Error Boundaries:** Verify user-friendly error/not-found boundaries exist (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, or React `ErrorBoundary`) so crashes do not render blank white screens or framework debug dumps.
  3. **Browser Source Maps:** Check `next.config.*` (`productionBrowserSourceMaps: true`), `vite.config.*` (`build.sourcemap: true`), or mobile/web bundler configs that publish full TypeScript source code publicly to `.js.map` URLs unless uploaded privately to Sentry and deleted from public static hosting.
- **Verdict guide:** `high` `fail` if `productionBrowserSourceMaps` are publicly shipped or raw DB/stack traces are serialized into client JSON responses; `medium` `fail` if global UI error/404 boundaries are missing.

### `HYGIENE-05` — Fail-Fast Environment Validation & `.gitignore` / `.dockerignore` Completeness
- **What to check:**
  1. **Boot-Time Env Schema:** Check whether required secrets (`JWT_SECRET`, `DATABASE_URL`, `WEBHOOK_SECRET`, `CRON_SECRET`, API keys) are validated at startup (e.g., `@t3-oss/env-nextjs`, Zod `env.ts`, or explicit startup assertions) with **zero hardcoded fallback secrets** (`process.env.JWT_SECRET || "supersecret123"` -> critical Track 1 bug + immediate hygiene fail!).
  2. **`.env.example` Completeness:** Check if `.env.example` exists with safe dummy placeholders documenting every required variable for safe deployment without real credentials.
  3. **Ignore Files:** Verify `.gitignore` (and `.dockerignore` if `Dockerfile` exists) excludes `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*.jks`, `*.keystore`, `*.sqlite*`, `.vercel`, `.supabase`, `node_modules`, build outputs, and local upload folders. Also check `git ls-files` (read-only) or repo tree for accidentally tracked `.env` or secret files!
- **Verdict guide:** `blocker` `fail` if real `.env`/secret files are tracked in git or hardcoded fallback secrets (`|| "secret"`) exist; `medium` `fail` if `.gitignore`/`.dockerignore` misses sensitive patterns or env vars lack fail-fast validation.

### `HYGIENE-06` — Leftover Dev/Seed Routes, Console Debug Noise & Placeholder UI Links
- **What to check:**
  1. Scan routes for leftover development scaffolding: `/api/seed`, `/api/test*`, `/api/debug*`, `/test-page`, `/playground`, hardcoded `test@example.com` bypasses, `NODE_TLS_REJECT_UNAUTHORIZED = "0"`, or `cors({ origin: "*" })` on authenticated APIs.
  2. Scan public landing, navigation, and dashboard UI for broken vibe-coding leftovers: dead `href="#"` social/footer buttons, fake hardcoded stats/testimonials if unintended, `"Coming soon"` buttons wired to nothing on critical user flows (like "Export Data", "Cancel Plan", "Reset Password"), or default `"Create Next App"` / `"Vite + React"` page `<title>` and metadata!
- **Verdict guide:** `blocker` `fail` for active unauthenticated seed/debug routes or `NODE_TLS_REJECT_UNAUTHORIZED = "0"`; `medium` `fail` for dead critical action buttons or leftover `"Create Next App"` metadata/broken navigation links.

### `HYGIENE-07` — AI / LLM Feature Guardrails, Timeouts & Cost Ceilings (If Applicable)
- **What to check (applies when the project calls LLM/GenAI APIs):**
  1. Server enforces `max_tokens` / `maxOutputTokens`, input character/length limits, and an explicit allowlist of models (client cannot override model ID).
  2. LLM Markdown/HTML output rendered in the browser uses safe sanitization (`rehype-sanitize`, `DOMPurify`, disallowing `javascript:` links and raw HTML execution).
  3. External AI/HTTP calls configure explicit request timeouts / `AbortSignal` propagation and per-user daily/monthly usage caps so one stuck loop or abusive script cannot drain the founder's API balance.
- **Verdict guide:** `high` `fail` if unsanitized raw HTML from LLM output is rendered or AI endpoints lack input/output token bounds and per-user limits; `not_applicable` if no AI/LLM features exist.

### `HYGIENE-08` — Transactional Email Safety, `robots.txt`, Sitemap & Dependency Hygiene
- **What to check:**
  1. **Email Relay Abuse:** Inspect Resend/SendGrid/Nodemailer/SES calls. Verify attackers cannot supply an arbitrary recipient email + arbitrary custom subject/body/link through a public endpoint to send phishing or spam from the founder's domain!
  2. **`robots.txt` & `sitemap.xml`:** Verify `robots.txt` blocks private routes (`/api/`, `/admin/`, `/dashboard/`, `/settings/`, `/auth/callback`) while allowing public marketing & mandatory legal/pricing pages.
  3. **Dependency Lockfile & Supply-Chain Basics:** Verify a single consistent lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `pubspec.lock`, `Podfile.lock`) is committed (not multiple conflicting lockfiles!) and `postinstall` scripts do not execute untrusted remote downloads.
  4. Emit `HYGIENE-08M` (`needs_manual_check`) reminding the founder to verify **SPF, DKIM, and DMARC** DNS records on their custom email domain, automated **Database Point-in-Time Recovery / Daily Backups**, and uptime/error alerting before launch.
