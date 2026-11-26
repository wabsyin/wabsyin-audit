# Track 2: Deterministic Compliance, Legal Pages, Store & Launch-Readiness Workflow

Track 2 audits **regulatory compliance, payment-gateway onboarding requirements, mobile app-store policies, and production launch hygiene** directly from repository source code. It operates alongside Track 1 (`SKILL.md` Phases 1–6) during a **Full Security + Launch Audit**, or runs standalone in **Compliance & Launch Mode**.

Keep Track 1 and Track 2 strictly separated:
- **Track 1 (`findings.json`)** records only exploitable trust-boundary security vulnerabilities (`confirmed`, `needs_validation`, `rejected`). Never insert missing legal pages, missing Grievance Officer text, or store-policy gaps into `findings.json`.
- **Track 2 (`compliance-findings.json`)** records deterministic source-audited readiness checks (`pass`, `fail`, `needs_manual_check`, `not_applicable`) validated by `validate-compliance.cjs`.

---

## Step C1: Applicability Detection (Reconnaissance Input)

Before launching Track 2 auditors, read the repository (or Phase 1 `architecture.md`) to classify which compliance domains apply:

1. **`INDIA-DPDP-AND-PRIVACY-COMPLIANCE.md`** — Applies whenever the project collects, processes, logs, or stores any personal data (accounts, emails, phone numbers, names, IP/analytics, user uploads, chat/AI prompts, payments, cookies) unless the user explicitly scopes India/privacy out.
2. **`PAYMENT-GATEWAY-PAGES-AND-KYC.md`** — Applies whenever the codebase contains payment SDKs, checkout routes, pricing pages, subscription logic, wallet/credit purchases, or payment env vars (`RAZORPAY_*`, `CASHFREE_*`, `PHONEPE_*`, `PAYU_*`, `PAYTM_*`, `STRIPE_*`, `LEMONSQUEEZY_*`, `PADDLE_*`, `DODO_*`, `PAYPAL_*`), OR when the user mentions integrating payments. If zero monetization/payment code exists and none is planned, record a single `not_applicable` summary check (`PGKYC-00`) citing the clean `package.json`/manifest inspection.
3. **`MOBILE-APP-AND-STORE-COMPLIANCE.md`** — Applies whenever mobile project files exist (`android/`, `ios/`, `app.json`, `eas.json`, `pubspec.yaml`, `capacitor.config.*`, `react-native` / `expo` / `flutter` dependencies). If web/backend-only, record `MOBSTORE-00` as `not_applicable` with source evidence.
4. **`PRODUCTION-LAUNCH-HYGIENE.md`** — Applies to all web, API, SaaS, AI, and mobile-backend applications preparing for deployment.

---

## Step C2: Parallel Domain Compliance Auditors (`research` agents)

Launch one read-only `research` agent per applicable Track 2 companion file. Do **not** contact live websites, payment dashboards, DNS servers, or Play/App Store consoles. Inspect routes, components, Markdown/MDX/HTML legal pages, footer/checkout links, middleware matchers, database schemas, migrations, manifests, and config files in the repository.

### Universal Anti-Hallucination & Placeholder Gate (include in every Track 2 auditor prompt)

```text
1. Every `pass` or `fail` check MUST cite exact repository-relative `file` and positive `line` evidence. If a required page or flow is completely absent from the repository, cite the route directory index, router file, footer component, or schema file you inspected to prove its absence (for example `src/app/layout.tsx:42` showing footer links without `/refund-policy`).
2. A route file existing is NOT an automatic `pass`. Read the rendered content of every legal/policy/contact page and fail the check if:
   - the page contains unresolved template placeholders such as `[Company Name]`, `[Insert Address]`, `YOUR_EMAIL`, `example@example.com`, `support@yourdomain.com`, `Acme Corp`, `Lorem ipsum`, `TODO`, or `+91-XXXXXXXXXX`;
   - the page sits behind an authentication wall / login redirect middleware so unauthenticated users or gateway KYC reviewers cannot read it;
   - `robots.txt` blocks crawlers from reading public legal/pricing/contact pages required for gateway verification; or
   - footer/checkout links use dead anchors (`href="#"`, `href=""`) or point to routes that return 404.
3. Cross-check legal claims against actual code! If the Privacy Policy says "We do not share data with third parties" or omits AI processors while `package.json` and server routes send user text to OpenAI, Anthropic, Gemini, PostHog, Sentry, Meta Pixel, or Razorpay, record `fail` with both code and policy `file:line` references.
4. Use `needs_manual_check` ONLY for operational facts genuinely outside repository source (for example DNS SPF/DKIM/DMARC records, live Razorpay/Stripe dashboard webhook toggles, Google Play Data Safety console declarations, or registered business KYC documents). Never use `needs_manual_check` when reading another file in the repo would settle the check.
5. Return ONLY one JSON array of check objects matching `compliance-schema.json`.
```

---

## Step C3: Consolidation, Independent Spot-Verification & Schema Validation

1. Merge all Track 2 auditor outputs into `<output-dir>/compliance-findings.json`, sorted lexicographically by `check_id`.
2. Verify there are no duplicate `check_id` entries and that every `fail` record includes:
   - `priority`:
     - `blocker` — guaranteed legal non-compliance, payment gateway KYC rejection, App/Play Store rejection, or broken launch gate
     - `high` — major compliance, consent, deletion, or abuse-protection gap that should be fixed before public traffic
     - `medium` — important operational or policy completeness gap
     - `advisory` — best-practice improvement or region-specific enhancement
   - concrete `remediation` prose explaining **what file/route/component to add or edit** and **exact clauses/controls required**.
3. Run a fresh `research` spot-verifier across all `blocker` and `high` compliance failures (and suspicious `pass` claims on legal pages) to confirm no route or layout link was missed in another directory (`pages/` vs `app/`, `public/*.html`, CMS seed files, or monorepo `apps/web`).
4. Validate `<output-dir>/compliance-findings.json` with:

```sh
node <skill-dir>/validate-compliance.cjs <output-dir>/compliance-findings.json
```

Fix any schema or semantic error before generating prose reports.

---

## Step C4: Generate `LAUNCH-READINESS.md` and `VIBE-CODER-ACTION-PLAN.md`

Derive two clear, builder-friendly Markdown artifacts from the validated records:

### 1. `<output-dir>/LAUNCH-READINESS.md`
Include:
1. **Go / No-Go Launch Scorecard Table** across 5 gates:
   - **Code Security Gate** (from Track 1 `findings.json`, or `"Not run (Compliance-only mode)"`)
   - **India DPDP Act & Privacy Gate** (`DPDP_*`)
   - **Payment Gateway & KYC Pages Gate** (`PGKYC_*`)
   - **Mobile App Store & Play Store Gate** (`MOBSTORE_*`)
   - **Production Launch Hygiene Gate** (`HYGIENE_*`)
   Each gate shows status: `READY`, `BLOCKED (<N> blockers)`, `ACTION NEEDED`, or `N/A`.
2. **Blocker & High-Priority Compliance Failures** — grouped by domain, with `check_id`, regulation/policy reference, exact `file:line` evidence, why it matters in plain language (e.g., *"Razorpay KYC reviewers will reject your live activation without a physical address and Refund timeline"*), and exact fix checklist.
3. **Passed Checks Summary** — concise table proving what the project already does right.
4. **External Manual Launch Checklist (`needs_manual_check`)** — crisp pre-launch checklist for dashboard/DNS/console settings outside git.

### 2. `<output-dir>/VIBE-CODER-ACTION-PLAN.md`
Vibe coders often struggle to translate security/legal jargon into next steps. Write a **plain-language, copy-paste-ready execution roadmap** organized into 3 buckets:
- **Bucket 1 — Fix Immediately Before Going Live (Critical/High Exploits + Launch/KYC Blockers):** Ordered step-by-step fixes, including ready-to-give **AI Agent Fix Prompts** (e.g., *"Prompt to paste into your coding agent to fix #1..."*) and required legal-page section outlines (never fabricated fake addresses or fake legal entity names — clearly mark `[REPLACE WITH YOUR REGISTERED NAME/ADDRESS]`).
- **Bucket 2 — Fix Before Scaling / Paid Marketing (Medium Security & Compliance Gaps):** Rate limits, consent audit tables, retention crons, headers, monitoring.
- **Bucket 3 — Pre-Launch Manual Dashboard Checklist:** 5–10 minute checklist for Supabase/Firebase Console, Razorpay/Stripe Dashboard, Cloudflare/Vercel, and Play Store / App Store Connect.
