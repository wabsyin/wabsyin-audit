# India DPDP Act (2023 & Rules) and Global Privacy Compliance Audit

#### When to use this file

Use this Track 2 companion whenever the target collects, processes, logs, transmits, or stores personal data of users — especially products built in India, serving Indian users, or using Indian payment/communication infrastructure. India's **Digital Personal Data Protection Act, 2023 (DPDP Act)** and **DPDP Rules** impose strict obligations on every **Data Fiduciary** (any app/startup determining the purpose and means of processing digital personal data), with statutory penalties up to ₹250 Crore for security and children's-data breaches.

This guide also covers practical global baseline expectations (**GDPR / CCPA overlap**) so vibe-coded SaaS and mobile apps do not ship obvious privacy blockers globally. Follow `COMPLIANCE-WORKFLOW.md` and output structured records for `compliance-findings.json` (`framework: "DPDP_2023"`).

---

## Step 1: Build the Codebase Personal-Data Inventory First

Before checking any legal page, scan schemas, Prisma/Drizzle/SQL migrations, Supabase/Firebase collections, auth configs, API routes, analytics scripts, and AI integrations to list every personal data element actually touched by code:
- **Identity & Contact:** name, email, phone/WhatsApp number, username, profile photo, physical/billing address
- **Government / Financial Identifiers:** Aadhaar, PAN, GSTIN, bank account/IFSC, UPI ID, payment customer/order IDs
- **Device, Behavioural & Location:** IP address, GPS/coarse location, device IDs, cookies, session recordings (PostHog/Clarity/Hotjar), Google Analytics, Meta Pixel
- **User-Generated & AI Content:** uploaded documents/images, voice recordings, chat messages, LLM prompts/RAG documents, health/education/financial inputs
- **Third-Party Data Processors:** OpenAI/Anthropic/Gemini/Groq, Supabase/Firebase/AWS/Neon, Clerk/Auth0, Resend/SendGrid/MSG91/Twilio, Razorpay/Stripe/Cashfree, Sentry/Datadog.

Use this ground-truth inventory to verify every check below.

---

## Mandatory Check Catalogue (`DPDP-*`)

### `DPDP-01` — Public, Linkable, Placeholder-Free Privacy Notice & Policy (DPDP Sec 5)
- **What to check:**
  1. A dedicated public route exists (`/privacy`, `/privacy-policy`, or static equivalent) that renders without requiring authentication.
  2. It is visibly linked in the global footer **and** at every primary personal-data collection point (signup, waitlist, checkout, contact form).
  3. It contains **no template placeholders** (`[Company Name]`, `[Email]`, `Lorem ipsum`, `example.com`, `TODO`) and includes a "Last Updated" / effective date.
- **Verdict guide:** `blocker` `fail` if missing, behind login, dead link, or containing template placeholders; `pass` if public, linked, and complete.

### `DPDP-02` — Itemized Personal Data & Purpose Mapping vs. Actual Code (DPDP Sec 5(1)(i))
- **What to check:** DPDP Section 5 requires an **itemized** description of personal data collected and the **specific purpose** for which each item is processed. Compare the Privacy Policy text against your Step 1 codebase inventory:
  - Does the policy disclose every category of PII actually stored in DB schemas or sent to third-party APIs?
  - **AI / LLM Disclosure Trap:** If user inputs, files, or chats are sent to external LLM/AI APIs (OpenAI, Gemini, Anthropic, ElevenLabs, etc.), does the Privacy Policy explicitly disclose third-party AI processing and whether user data is used for training?
  - **Analytics / Pixel Disclosure Trap:** If GA4, Meta Pixel, PostHog, Sentry, or Crashlytics are installed in layout/app root, are analytics/telemetry disclosures present?
- **Verdict guide:** `high` `fail` if code collects sensitive PII or sends user data to AI/analytics/third parties that are omitted or contradicted by the Privacy Policy.

### `DPDP-03` — Affirmative, Unbundled Consent UI — No Pre-Ticked Boxes (DPDP Sec 6(1))
- **What to check:** Consent under DPDP must be *free, specific, informed, unconditional, and unambiguous with a clear affirmative action*:
  - Inspect signup forms, checkout forms, newsletter opt-ins, WhatsApp/SMS marketing opt-ins, and cookie banners.
  - Flag any pre-ticked checkbox (`checked={true}`, `defaultChecked`, initial state `true` for consent/marketing toggles).
  - Flag bundled dark patterns where signing up forces marketing/promotional WhatsApp/email consent without a separate optional toggle, or where the app collects unnecessary PII unrelated to the core service (e.g., asking DOB/gender/location when not needed).
- **Verdict guide:** `high` `fail` if pre-ticked boxes exist, consent notice is absent at signup/collection, or non-essential marketing consent is forcefully bundled.

### `DPDP-04` — Consent Audit Trail / Proof of Consent in Storage (DPDP Sec 6(10))
- **What to check:** Under DPDP Section 6(10), where consent is the basis of processing, the Data Fiduciary bears the **burden of proving** that notice was given and valid consent was obtained.
  - Inspect user/consent database schemas (`users`, `consents`, `profiles`, `audit_logs`).
  - Check whether the backend records consent metadata: `privacy_accepted_at` / `terms_accepted_at` timestamp, `policy_version`, and granular marketing/communication opt-in flags.
- **Verdict guide:** `medium` `fail` if user accounts/leads are created with zero stored timestamp or record of terms/privacy/consent acceptance.

### `DPDP-05` — Easy Consent Withdrawal & Communication Opt-Out (DPDP Sec 6(4))
- **What to check:** DPDP Section 6(4) mandates that the *ease of withdrawing consent shall be comparable to the ease with which consent was given*:
  - If the app obtains consent for optional data processing, analytics/cookies, AI history retention, or marketing emails/SMS/WhatsApp, check whether users have a self-serve settings toggle or one-click unsubscribe/revoke action in account settings (not "send a physical letter or email and wait 30 days").
- **Verdict guide:** `high` `fail` if optional/marketing/cookie/tracking consents exist with no self-serve withdrawal or opt-out mechanism in code.

### `DPDP-06` — Multilingual Notice Accessibility Readiness (DPDP Sec 5(3))
- **What to check:** DPDP Section 5(3) gives Data Principals the option to access the consent notice/policy in **English or any language specified in the Eighth Schedule to the Constitution of India** (22 Indian languages).
  - Check whether an India-targeted consumer app provides i18n/language support for its consent notice or at minimum structures notice text cleanly for localization rather than hardcoding scattered legal copy across JSX files.
- **Verdict guide:** `advisory` `fail` (or `medium` `fail` for mass-market Indian consumer B2C apps) when notice copy is hardcoded English-only with no localization structure; include practical remediation guidance.

### `DPDP-07` — Right to Access & Correction of Personal Data (DPDP Sec 11 & Sec 12)
- **What to check:**
  - Can an authenticated Data Principal view the personal profile data stored about them (and summary of processing/data export where applicable)?
  - Can they update/correct inaccurate personal details (name, contact info, profile fields) via profile settings + working backend `PATCH`/`PUT`/Server Action?
- **Verdict guide:** `medium` `fail` if users store personal profile data with no UI/API path to view or update it.

### `DPDP-08` — Working End-to-End Account & Personal Data Erasure (DPDP Sec 12(3) & Sec 8(7))
- **What to check:** Unless retention is legally mandated (e.g., tax/invoice ledgers), Data Fiduciaries must erase personal data upon consent withdrawal or account deletion, or once the specified purpose is no longer served.
  - Check Account Settings UI + backend API for a real **Delete Account / Erase My Data** workflow.
  - **Fake Deletion Trap:** Vibe-coded apps frequently render a "Delete Account" button that only logs the user out, sets `is_active = false` while keeping all PII forever, or deletes `public.users` while leaving `supabase.auth.users`, Storage bucket avatars/documents, vector embeddings, or session caches intact!
  - Verify foreign-key `ON DELETE CASCADE` / anonymization for tax invoices (keeping invoice totals while scrubbing/detaching non-mandatory PII where appropriate) + Auth provider user deletion + Storage object cleanup.
- **Verdict guide:** `blocker` `fail` if user accounts exist with no deletion mechanism or a fake UI-only deletion; `high` `fail` if deletion leaves orphaned PII in Auth, Storage buckets, or secondary tables.

### `DPDP-09` — Grievance Redressal Mechanism, Grievance Officer & DPB Disclosure (DPDP Sec 8(10) & Sec 13)
- **What to check:** Every Data Fiduciary must establish a readily available grievance redressal mechanism and publish contact details of a **Data Protection Officer (if Significant Data Fiduciary) or designated Grievance Officer / person able to answer Data Principal queries**:
  - Check Privacy Policy and Contact/Support page for: (a) designated Grievance Officer / Privacy Contact name or role and working email/form; (b) stated response/resolution timeline (under DPDP Rules / IT Rules norms); and (c) clear statement of the user's right to approach the **Data Protection Board of India (DPB)** if their grievance is unresolved.
- **Verdict guide:** `high` `fail` if Privacy Policy omits Grievance Officer/Privacy contact details, resolution SLA, or Data Protection Board escalation disclosure.

### `DPDP-10` — Right to Nominate Readiness (DPDP Sec 14)
- **What to check:** DPDP Section 14 grants Data Principals the right to nominate another individual to exercise their rights in the event of death or incapacity.
  - Check whether Privacy Policy discloses how a user can exercise their **Right to Nominate** (via account settings or designated request channel), and for fintech/wallet/vault/long-term asset apps, whether nominee capture exists.
- **Verdict guide:** `medium` `fail` for fintech/wallet/health/asset apps lacking nomination flow or policy process; `advisory` `fail` for ordinary SaaS/web apps whose Privacy Policy omits Section 14 nomination instructions.

### `DPDP-11` — Children's Data Protection (<18 Years in India) (DPDP Sec 9)
- **What to check:** Under DPDP Act, a "Child" is **any individual under 18 years of age** (stricter than COPPA's 13 or GDPR's 13–16!):
  - If the app targets students, exam prep, kids, gaming, or general social users under 18: check for **verifiable parental/guardian consent** before processing personal data AND verify that **zero behavioral monitoring, tracking, or targeted advertising** (Meta Pixel, AdMob personalized ads, TikTok/Google ad remarketing) runs for minor accounts!
  - If the app is strictly for adults (18+): check that Terms of Service and Privacy Policy explicitly state the `18+` age requirement (and signup/onboarding reflects it where appropriate).
- **Verdict guide:** `blocker` `fail` if an app explicitly serving <18 users lacks parental consent or runs ad/behavioral tracking on minors; `medium` `fail` if an adult-intended app nowhere states its `18+` eligibility condition.

### `DPDP-12` — Reasonable Security Safeguards, PII Log Redaction & Breach Readiness (DPDP Sec 8(5)–(6))
- **What to check:** DPDP Section 8(5) requires reasonable security safeguards to prevent personal data breaches (the highest-penalty clause under the Act — up to ₹250 Crore):
  - Scan backend routes/workers for `console.log`, `console.error`, `logger.info` dumping full `req.body`, OTP codes, passwords, Aadhaar/PAN, phone numbers, emails, JWTs, or database rows into unredacted logs.
  - Check whether sensitive national/financial IDs (Aadhaar, PAN, bank details) if collected are encrypted at rest / masked (`XXXX-XXXX-1234`) and never exposed in URLs (`GET /api/user?email=...&phone=...`).
  - Check whether ephemeral PII (OTP codes, password reset tokens, unverified signups, temporary uploads) has an automated expiry/cleanup mechanism.
  - Emit a `needs_manual_check` reminder (`DPDP-12M` if no repo incident doc exists, or include in remediation) for **Personal Data Breach Notification SOP** (notifying the Data Protection Board of India + affected users under DPDP Sec 8(6), and CERT-In 6-hour cyber-incident reporting readiness in India).
- **Verdict guide:** `high` `fail` if raw PII/OTPs/credentials are logged or sensitive IDs are stored/transmitted unsafely; `medium` `fail` if ephemeral PII tables have no TTL/cleanup strategy.
