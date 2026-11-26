# Payment Gateway Pages, Merchant KYC, and Checkout Compliance Audit

#### When to use this file

Use this Track 2 companion whenever the codebase integrates — or plans to integrate — any online payment system, checkout flow, subscription, digital wallet, paid SaaS tier, e-commerce cart, paid course/booking, or donation gateway (**Razorpay, Cashfree, PhonePe, PayU, Paytm, Instamojo, CCAvenue, Juspay, Stripe, LemonSqueezy, Paddle, Dodo Payments, PayPal**).

Indian payment aggregators (regulated under RBI PA/PG guidelines) and global merchant-of-record / gateway compliance teams run automated and manual website KYC checks before enabling live settlements. **Missing or incomplete legal pages are the #1 reason vibe coders get their Razorpay, Cashfree, PhonePe, or Stripe accounts rejected or frozen.**

For technical payment vulnerabilities (price tampering, webhook HMAC bypass, double-spend races), use Track 1's `PAYMENT-AND-BILLING-SECURITY.md`. Here, output structured records for `compliance-findings.json` (`framework: "PAYMENT_KYC"`). If the project has zero monetization/payment code and none is requested, emit a single `PGKYC-00` `not_applicable` record citing inspected manifests.

---

## Mandatory Check Catalogue (`PGKYC-*`)

### `PGKYC-01` — Terms & Conditions / Terms of Service Page
- **What to check:**
  1. Public, unauthenticated route exists (`/terms`, `/terms-of-service`, `/terms-and-conditions`).
  2. Linked in the global site footer and checkout/signup UI.
  3. Zero template placeholders (`[Company Name]`, `Lorem ipsum`, `example.com`).
  4. Covers core merchant terms: description of products/services offered, user eligibility & account rules, acceptable use restrictions, intellectual property, limitation of liability, termination rules, and **governing law / jurisdiction** (e.g., Courts of `[City], India` for Indian merchants).
- **Verdict guide:** `blocker` `fail` if missing, behind auth wall, broken link, or containing placeholder text; `medium` `fail` if missing governing law or service description.

### `PGKYC-02` — Refund & Cancellation Policy Page (With Exact Processing Timeline!)
- **What to check:** Indian payment gateways (Razorpay, Cashfree, PhonePe, PayU) **strictly reject** websites that bury a vague line inside Terms or omit concrete timelines:
  1. Dedicated public route exists (`/refund-policy`, `/cancellation-policy`, or `/refunds` — or clearly titled linked section if single legal hub, though a dedicated `/refund-policy` URL is strongly required by Indian PG onboarding forms!).
  2. Linked in the global footer and visible before payment.
  3. Explicitly states:
     - **Cancellation rules:** How and within what window a customer can cancel an order or subscription.
     - **Refund eligibility:** Exact conditions under which refunds are approved, pro-rated, or declined.
     - **Exact Refund Timeline & Mode:** If refunds are offered, must specify exact business/working days (e.g., *"Approved refunds are processed within 5–7 business days to the original payment method"*). If strictly non-refundable (e.g., consumed digital credits), must state the **No-Refund Policy** unmistakably upfront *before* purchase and cover duplicate/failed transaction auto-refund handling!
- **Verdict guide:** `blocker` `fail` if `/refund-policy` (or `/cancellation-policy`) is missing, unlinked, placeholder-filled, or omits refund processing timeline / explicit non-refundable terms.

### `PGKYC-03` — Shipping & Delivery Policy OR Digital Service Fulfillment Policy
- **What to check:**
  - **Vibe-Coder Trap:** SaaS, AI tool, course, and digital-product builders skip "Shipping Policy" thinking *"I don't ship physical boxes!"* — and then Razorpay/Cashfree KYC forms ask for a mandatory **Shipping & Delivery URL** or reject the application!
  - **For Physical Goods:** Dedicated public `/shipping-policy` (or `/delivery-policy`) specifying dispatch timeline (e.g., 1–3 working days), estimated delivery timeline (e.g., 4–7 working days), shipping charges, serviceable regions/PIN codes, and damaged/lost shipment handling.
  - **For SaaS / Digital / AI / Courses / Bookings:** Dedicated public `/shipping-policy` or `/delivery-policy` (or clearly linked fulfillment policy URL) explicitly stating: *"We provide digital software/services only; no physical goods are shipped. Account/plan activation, digital downloads, or credits are delivered immediately (or within X minutes/hours) to the registered account/email upon successful payment confirmation, along with support escalation if access is delayed."*
- **Verdict guide:** `blocker` `fail` for physical e-commerce missing `/shipping-policy`; `high` `fail` for SaaS/digital apps using Indian payment gateways (`razorpay`, `cashfree`, `phonepe`, `payu`, `paytm`) without a dedicated shipping/fulfillment policy page or explicit fulfillment clause URL for KYC forms.

### `PGKYC-04` — Contact Us & Merchant Legal Identity Disclosure Page
- **What to check:** Payment gateways verify that a real, reachable merchant stands behind transactions:
  1. Public `/contact` or `/contact-us` page exists and is linked in footer.
  2. **Form-Only Trap:** A page with *only* a "Name / Email / Message" contact form and **no visible email, phone, or physical address** is rejected by Razorpay, Cashfree, PhonePe, and Stripe!
  3. Verify presence of (with zero fake/placeholder dummy values):
     - **Legal Entity Name / Registered Business or Proprietor Name** (matching KYC PAN/GST/Bank account, even if operating under a brand name: e.g., *"[Brand] is operated by [Legal Name]"*)
     - **Complete Physical Operating / Registered Address** (street, city, state, PIN/postal code, country)
     - **Working Support Email Address** (prefer domain email `support@<domain>` or real monitored inbox, never `test@example.com`)
     - **Working Customer Support Phone Number** (mandatory for Indian payment gateway KYC!)
     - **Support Operating Hours / Response SLA** (e.g., Mon–Sat, 10 AM – 6 PM IST, response within 24–48 hours).
- **Verdict guide:** `blocker` `fail` if `/contact` is missing, form-only without visible email/phone/physical address, or contains dummy placeholder contact details (`123 Main St`, `+91 9999999999`, `support@example.com`).

### `PGKYC-05` — Public Pricing, Currency & Tax/GST Transparency
- **What to check:**
  1. Publicly viewable `/pricing` or product catalog page showing clear descriptions of what the buyer receives and exact prices **without forcing account login first** (gateway KYC reviewers cannot verify hidden post-login pricing unless demo credentials are provided, and public pricing prevents instant rejection).
  2. Currency is explicitly stated (`₹` / `INR`, `$` / `USD`, etc.) — Indian domestic gateways require `INR` pricing visibility for Indian buyers.
  3. Tax / GST clarity: clearly indicates whether displayed prices are inclusive of applicable taxes/GST or `+ 18% GST` at checkout, and if GST invoicing is generated, validates calculation consistency.
- **Verdict guide:** `blocker` `fail` if paid checkout exists with no public product/pricing disclosure or placeholder prices (`$XX`, `Lorem ipsum` plan features); `medium` `fail` if currency symbol/code or tax inclusivity is ambiguous.

### `PGKYC-06` — Subscription, Auto-Renewal, RBI e-Mandate & Self-Serve Cancellation Disclosures
- **What to check (applies when recurring subscriptions / auto-debit / trials exist):**
  1. Checkout UI clearly discloses billing frequency (monthly/annual), recurring amount, free-trial duration, exact date/amount of first charge after trial, and auto-renewal terms before payment submission.
  2. Users have a working **in-app "Cancel Subscription" / "Manage Billing"** button (e.g., Stripe Billing Portal, Razorpay Subscription cancel API, or self-serve dashboard action) — forcing users to email support to stop recurring charges causes chargebacks, Stripe account termination, and RBI e-mandate complaints.
  3. Receipt / invoice history or payment confirmation UI displays transaction reference ID, amount paid, plan name, and support contact.
- **Verdict guide:** `high` `fail` if recurring subscriptions exist with no self-serve cancellation path in UI/API or hidden trial-to-paid auto-debit terms; `not_applicable` for strictly one-time purchases.

### `PGKYC-07` — Footer Link Integrity, Public Unauthenticated Access & Crawler Reachability
- **What to check:**
  1. Inspect global footer (`Footer.tsx`, `layout.tsx`, `index.html`), auth `middleware.ts`, and `robots.txt`.
  2. Verify all mandatory policy links (`Privacy Policy`, `Terms & Conditions`, `Refund & Cancellation Policy`, `Shipping/Delivery Policy`, `Contact Us`, `Pricing`) appear in the public footer, resolve to real 200-OK routes, are **excluded from auth-redirect middleware**, and are **not disallowed in `robots.txt`**.
  3. Verify business model compliance signals: ensure no restricted/prohibited financial claims (guaranteed returns, unapproved lottery/gambling/crypto-exchange mechanics) appear in copy without regulatory disclaimers.
- **Verdict guide:** `blocker` `fail` if auth middleware redirects unauthenticated visitors away from legal/pricing/contact pages, if `robots.txt` blocks them, or if footer links are missing/broken (`href="#"`).

### `PGKYC-08` — Live Merchant Dashboard & Settlement Readiness (`needs_manual_check`)
- **What to check:** Unless verifiable via IaC, emit a concise `needs_manual_check` item reminding the founder before flipping to Live keys to verify:
  - Registered Legal Entity Name on Contact/Terms/Privacy matches Bank Account & PAN/GST in Razorpay/Cashfree/Stripe KYC;
  - Live Webhook URL + Live Webhook Secret are configured separately from Test mode;
  - Domain SSL certificate is active and custom support email (`support@<domain>`) receives mail.
