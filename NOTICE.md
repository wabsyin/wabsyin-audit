# Open-Source Attribution, Trademark Notice & Legal Disclaimer

## 1. Upstream Open-Source Attribution

**Wabsyin Audit** (`wabsyin/wabsyin-audit`) builds upon the open-source **`cloudflare/security-audit-skill`** repository:

- **Upstream Repository:** https://github.com/cloudflare/security-audit-skill
- **Upstream Copyright:** Copyright (c) 2025-2026 Cloudflare, Inc.
- **License:** MIT License (preserved in full in [LICENSE](LICENSE))

Specifically, the 6-phase adversarial vulnerability workflow (`RECONNAISSANCE.md`, `HUNTING.md`, `ATTACK-CLASSES.md`, `VALIDATION-AND-REPORTING.md`), the `findings.json` schema (`report-schema.json`), the 10 baseline domain security companions, and the base findings and coverage-ledger validators originate from `cloudflare/security-audit-skill`.

All additional extensions in this repository — including the Dual-Track compliance architecture, `VIBE-CODING-AND-BAAS.md`, `PAYMENT-AND-BILLING-SECURITY.md`, `COMPLIANCE-WORKFLOW.md`, `INDIA-DPDP-AND-PRIVACY-COMPLIANCE.md`, `PAYMENT-GATEWAY-PAGES-AND-KYC.md`, `MOBILE-APP-AND-STORE-COMPLIANCE.md`, `PRODUCTION-LAUNCH-HYGIENE.md`, `compliance-schema.json`, `validate-compliance.cjs`, `validate-skill-integrity.test.cjs`, and Windows cross-platform validator compatibility — are **Copyright (c) 2026 Wabsyin** and released under the **MIT License**.

## 2. Non-Endorsement & Trademark Notice

**Wabsyin Audit** is an independent open-source project created and maintained by **Wabsyin** ([wabsyin.agency](https://wabsyin.agency)). It is **not affiliated with, sponsored by, endorsed by, or maintained by Cloudflare, Inc.**

All third-party product, gateway, and platform names mentioned in documentation (such as Cloudflare, Razorpay, Cashfree, PhonePe, PayU, Paytm, Stripe, Supabase, Firebase, Google Play, Apple App Store, OpenAI, Anthropic, and Next.js) are trademarks of their respective owners and are used solely for descriptive compatibility and audit-coverage purposes.

## 3. Technical Audit — Not Formal Legal Advice

The Track 2 compliance modules (including India DPDP Act 2023, Payment Gateway KYC pages, and App Store / Play Store submission readiness checks) provide **automated technical and engineering readiness audits** designed to help builders identify missing pages, placeholder text, consent flaws, and common rejection blockers early. They **do not constitute formal legal advice**, regulatory certification, or a guarantee of gateway/store approval. Organizations handling regulated personal or financial data should review their final policies and data flows with qualified legal counsel.
