<p align="center">
  <a href="https://wabsyin.agency">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/wabsyin-logo-orange.png" />
      <source media="(prefers-color-scheme: light)" srcset="assets/wabsyin-logo-orange.png" />
      <img alt="Wabsyin Logo" src="assets/wabsyin-logo-orange.png" width="260" />
    </picture>
  </a>
</p>

<h1 align="center">Wabsyin Audit</h1>

<p align="center">
  <strong>Open-Source AI Agent Skill for Security Vulnerabilities, Vibe-Coder BaaS Traps, India DPDP Act 2023, Payment Gateway KYC Pages, Mobile Store Blockers &amp; Production Launch Readiness</strong>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-orange.svg" /></a>
  <a href="https://nodejs.org/"><img alt="Node.js >= 18" src="https://img.shields.io/badge/Node.js-%E2%89%A518%20(Zero%20Deps)-339933.svg" /></a>
  <img alt="Platform: Windows | macOS | Linux" src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg" />
  <img alt="Agents: Antigravity | Claude Code | Cursor | Codex" src="https://img.shields.io/badge/Agents-Antigravity%20%7C%20Claude%20Code%20%7C%20Cursor%20%7C%20Codex-111111.svg" />
</p>

---

**Wabsyin Audit** turns your AI coding agent (**Google Antigravity, Claude Code, Cursor, Codex, Windsurf, or Cline**) into an adversarial **Security Auditor + Pre-Launch Compliance Engineer** for Web, SaaS, AI, and Mobile projects.

Built by **[Wabsyin](https://wabsyin.agency)** on top of Cloudflare's MIT-licensed [`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) — preserving its strict zero-false-positive 6-phase adversarial vulnerability engine while adding **everything vibe coders and indie founders don't know they need before launching a real product**.

> **Zero Conflicts:** Because this skill installs under `wabsyin-audit`, it works cleanly side-by-side even if you already have Cloudflare's `security-audit` installed!

---

## Why Wabsyin Audit? (Solving Vibe-Coder Blind Spots)

AI coding tools let you build a full-stack Web or Mobile app in hours — but most launches fail or get hacked due to four invisible blind spots:

1. **Vibe-Coding & BaaS Exploits:** Leaked `SUPABASE_SERVICE_ROLE_KEY` / `OPENAI_API_KEY` in `NEXT_PUBLIC_*` / `VITE_*` / `EXPO_PUBLIC_*`, tables missing Supabase RLS, `user_metadata` admin privilege escalation, `allow read, write: if true` Firebase rules, unauthenticated `"use server"` Server Actions, client-controlled checkout amounts, fail-open payment webhooks, and **\$1,000+ overnight AI/SMS wallet-draining attacks**.
2. **Payment Gateway KYC Rejections (Razorpay, Cashfree, PhonePe, PayU, Paytm, Stripe):** Gateways reject or freeze live settlements when mandatory public pages (**Privacy Policy, Terms & Conditions, Refund & Cancellation with exact working-day timeline, Shipping / Digital Fulfillment Policy, Contact Us with legal name + physical address + phone + email, upfront INR/currency Pricing**) are missing, behind login, blocked by `robots.txt`, or still contain `[Company Name]` / `Lorem ipsum` placeholders.
3. **India DPDP Act (2023 & Rules) & Privacy Compliance:** Missing itemized personal-data & AI-processor disclosures, pre-ticked consent checkboxes (`defaultChecked={true}`), missing consent audit timestamps, fake UI-only `"Delete Account"` buttons that leave PII in Auth/DB/Storage, missing Grievance Officer & Data Protection Board escalation notice, or `<18` minor data tracking violations.
4. **Google Play & Apple App Store Rejections:** Plaintext JWTs in `AsyncStorage` / `SharedPreferences`, missing **In-App Account Deletion + Public Web Deletion URL**, Google Sign-In on iOS without **Sign in with Apple (Guideline 4.8)**, external Razorpay/Stripe WebViews selling digital goods where Store IAP is required, restricted Play permissions (`MANAGE_EXTERNAL_STORAGE`, `QUERY_ALL_PACKAGES`, `READ_SMS`), vague `Info.plist` descriptions, and missing `PrivacyInfo.xcprivacy`.

---

## Dual-Track Architecture

To keep Cloudflare's strict zero-false-positive exploit bar intact, **Wabsyin Audit** separates **exploitable security vulnerabilities** from **regulatory, KYC, store, and launch-readiness checks**:

| Track | What It Audits | Generated Output Files | Zero-Dep Validator |
|-------|---------------|------------------------|--------------------|
| **Track 1 — Adversarial Code Security** | 6-phase source-grounded hunting & independent disproof (the agent that finds a bug is never the agent that confirms it). Includes **10 Cloudflare security domains** + **Vibe-Coding/BaaS** + **Payment/Billing Security**. | `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md` | `validate-coverage-ledger.cjs`, `validate-findings.cjs` |
| **Track 2 — Deterministic Compliance & Launch Readiness** | Source-verified checks (`file:line` evidence + placeholder scanner) across **India DPDP Act 2023**, **Payment Gateway KYC Pages**, **Google Play & Apple App Store Policies**, and **Production Launch Hygiene**. | `compliance-findings.json`, `LAUNCH-READINESS.md` (5-Gate Go/No-Go Scorecard), `VIBE-CODER-ACTION-PLAN.md` | `validate-compliance.cjs` |

---

## Quick Installation (Multi-Agent)

### Option 1: Install via Skills CLI (Recommended — Antigravity, Claude Code, Cursor, Codex, Windsurf)

```bash
# Install globally across all your projects
npx skills add https://github.com/wabsyin/wabsyin-audit \
  --skill wabsyin-audit \
  --global
```

Or install only inside a specific repository:

```bash
npx skills add https://github.com/wabsyin/wabsyin-audit \
  --skill wabsyin-audit
```

### Option 2: Manual Drop-In

Clone this repository and copy `skills/wabsyin-audit/` into your agent's skills directory:
- **Google Antigravity:** `~/.gemini/config/skills/wabsyin-audit/`
- **Claude Code:** `~/.claude/skills/wabsyin-audit/` (or `.claude/skills/wabsyin-audit/`)
- **Cursor / Codex / Windsurf:** Run `npx skills --help` for agent-specific installation paths.

---

## Ready-to-Copy Prompts for Vibe Coders

Open your AI coding agent inside your project folder and run any of these prompts:

### 1. Fast Pre-Launch Vibe Check (Best before deploying MVP)
```text
Use the wabsyin-audit skill to run a quick vibe-check security and launch-readiness audit on this project. Check for leaked keys, Supabase/Firebase RLS, Server Action/API auth gaps, AI/API wallet-drain risks, India DPDP Act compliance, payment gateway required pages, and production launch hygiene. Output reports to ~/wabsyin-audit/my-app
```

### 2. Full Deep Security + Launch Audit (All 6 Adversarial Phases + Track 2)
```text
Use wabsyin-audit to perform a full end-to-end security and launch-readiness audit of this codebase, output to ~/wabsyin-audit/my-app
```

### 3. India DPDP Act + Razorpay / Cashfree / PhonePe / Stripe KYC Audit Only
```text
Use wabsyin-audit in compliance & launch mode focusing on India DPDP Act 2023 and Payment Gateway KYC required pages (Privacy, Terms, Refund/Cancellation, Shipping/Fulfillment, Contact Us, Pricing, and placeholder checks). Output to ~/wabsyin-audit/my-app-compliance
```

### 4. Mobile App Store & Google Play Store Pre-Submission Audit
```text
Use wabsyin-audit to audit this mobile project for security vulnerabilities and Google Play Store + Apple App Store submission blockers (in-app & web account deletion, Sign in with Apple, IAP digital-goods rules, SecureStore, AndroidManifest, Info.plist, and PrivacyInfo.xcprivacy). Output to ~/wabsyin-audit/my-mobile-app
```

### 5. Instant Guidance Mode (No files created)
```text
Using wabsyin-audit guidance mode, inspect our Razorpay webhook route and Supabase migrations — can a user bypass payment or read another user's rows?
```

---

## Complete Skill Contents (`skills/wabsyin-audit/`)

| File | Track | Purpose |
|------|-------|---------|
| `SKILL.md` | Core | 4 operating modes (Guidance, Compliance, Quick Vibe-Check, Full Audit), safety sandbox rules, and Dual-Track router |
| `RECONNAISSANCE.md` | Core | Phase 1 parallel recon (architecture, trust boundaries, BaaS/payment/PII/legal/mobile surfaces, coverage ledger) |
| `HUNTING.md` | Track 1 | Phase 2 isolated hunter prompts, promotion rules, and coverage-critic waves |
| `ATTACK-CLASSES.md` | Track 1 | Core attack classes + selector across all 12 security domains |
| `VALIDATION-AND-REPORTING.md` | Core | Phases 3–6 adversarial candidate disproof, record verification, and report generation |
| **`VIBE-CODING-AND-BAAS.md`** | **Track 1 (Wabsyin)** | Next.js/Remix/SvelteKit Server Actions & RSCs, leaked `NEXT_PUBLIC_`/`VITE_` keys, Supabase RLS/RPC/Storage, Firebase rules, and paid-API wallet drain |
| **`PAYMENT-AND-BILLING-SECURITY.md`** | **Track 1 (Wabsyin)** | Client price/currency tampering, Razorpay/Cashfree/PhonePe/PayU/Stripe webhook HMAC & raw-body checks, order substitution, and wallet TOCTOU races |
| `WEB-PROTOCOL-AND-AUTH.md` | Track 1 (Base) | HTTP framing, cache poisoning, CSRF, sessions, JWT, OAuth/OIDC, passkeys, MFA, and account recovery |
| `CLIENT-SIDE.md` | Track 1 (Base) | DOM XSS, `postMessage`, CORS, service workers, browser storage, and clickjacking |
| `DATA-ISOLATION-AND-LIFECYCLE.md` | Track 1 (Base) | Multi-tenant isolation, search/cache/export leaks, soft-delete, and restore boundaries |
| `DESKTOP-MOBILE-AND-LOCAL-IPC.md` | Track 1 (Base) | Deep links, WebView native bridges, exported Android/iOS components, and local IPC |
| `AI-AND-LLM.md` | Track 1 (Base) | Indirect prompt injection, RAG cross-tenant bleed, tool-call confused deputy, MCP identity, and LLM output sinks |
| `CLOUD-AND-DEPLOYMENT.md` | Track 1 (Base) | Cloud IAM, containers/K8s, ingress, signed URLs, serverless/edge config drift, and secrets |
| `PROTOCOLS-RPC-AND-MESSAGING.md` | Track 1 (Base) | gRPC, GraphQL, queues, webhooks, replay, and out-of-order message transitions |
| `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` | Track 1 (Base) | Algorithmic DoS, unbounded buffering, pre-auth work imbalance, and retry storms |
| `SUPPLY-CHAIN-AND-RELEASE.md` | Track 1 (Base) | Dependency confusion, GitHub Actions/CI injection, build provenance, and auto-updaters |
| `MEMORY-SAFETY-AND-BINARY.md` | Track 1 (Base) | C/C++/Rust-unsafe bounds, integer overflows, UAF, FFI/ABI, and binary loaders |
| **`COMPLIANCE-WORKFLOW.md`** | **Track 2 (Wabsyin)** | Deterministic compliance audit orchestration, placeholder-text gate, spot-verification, and `LAUNCH-READINESS.md` / `VIBE-CODER-ACTION-PLAN.md` generation |
| **`INDIA-DPDP-AND-PRIVACY-COMPLIANCE.md`** | **Track 2 (Wabsyin)** | India DPDP Act 2023 & Rules (`DPDP-01`..`DPDP-12`): Notice, itemized PII/AI disclosures, affirmative consent, consent logs, withdrawal, erasure, Grievance Officer, `<18` minors, PII log hygiene |
| **`PAYMENT-GATEWAY-PAGES-AND-KYC.md`** | **Track 2 (Wabsyin)** | Razorpay, Cashfree, PhonePe, PayU, Stripe KYC pages (`PGKYC-01`..`PGKYC-08`): Terms, Refund timeline, Shipping/SaaS Fulfillment, Contact Us identity, Pricing/GST, recurring cancellation |
| **`MOBILE-APP-AND-STORE-COMPLIANCE.md`** | **Track 2 (Wabsyin)** | Play Store & App Store readiness (`MOBSTORE-01`..`MOBSTORE-08`): In-app + web account deletion, Sign in with Apple, IAP digital-goods rules, SecureStore, `AndroidManifest`, `Info.plist`, `PrivacyInfo.xcprivacy` |
| **`PRODUCTION-LAUNCH-HYGIENE.md`** | **Track 2 (Wabsyin)** | Pre-launch blind spots (`HYGIENE-01`..`HYGIENE-08`): Security headers/CSP, OTP/auth rate limits & Turnstile, email verification, source-map/error leaks, fail-fast env validation, `robots.txt`, email spam-relay guards |
| `report-schema.json` & `validate-findings.cjs` | Track 1 | Zero-dependency schema & Windows/macOS/Linux validator for `findings.json` (+ `.test.cjs`) |
| `validate-coverage-ledger.cjs` | Track 1 | Zero-dependency Windows/macOS/Linux validator for `coverage-ledger.json` (+ `.test.cjs`) |
| **`compliance-schema.json` & `validate-compliance.cjs`** | **Track 2 (Wabsyin)** | Zero-dependency schema & Windows/macOS/Linux validator for `compliance-findings.json` (+ `.test.cjs`) |
| **`validate-skill-integrity.test.cjs`** | **Core (Wabsyin)** | Automated link integrity, companion contract, and compliance check-ID verification test suite |

---

## Running the Test Suite Locally

Requires **Node.js >= 18** (zero npm dependencies!). Verified natively on **Windows, macOS, and Linux**:

```bash
npm test
```

---

## Legal Attribution, Non-Endorsement & Disclaimer

- **License:** Released under the **MIT License** — see [LICENSE](LICENSE).
- **Upstream Attribution:** Built upon [`cloudflare/security-audit-skill`](https://github.com/cloudflare/security-audit-skill) (*Copyright (c) 2025-2026 Cloudflare, Inc.*, MIT License). See [NOTICE.md](NOTICE.md) for complete component attribution.
- **Non-Endorsement:** Wabsyin Audit is an independent open-source project by **[Wabsyin](https://wabsyin.agency)** and is **not affiliated with, endorsed by, or maintained by Cloudflare, Inc.**
- **Legal Disclaimer:** Track 2 compliance checks (India DPDP Act 2023, Payment Gateway KYC, App Store / Play Store readiness) are engineering and technical readiness checks and do **not** constitute formal legal advice. Always review final legal policies with qualified counsel before regulated launches.

---

<p align="center">
  Built with care for Vibe Coders &amp; Builders by <a href="https://wabsyin.agency"><strong>Wabsyin</strong></a>
</p>
