# Payment, Billing, Wallet, and Entitlement Hunting

#### When to use this file

Reach for this file whenever the codebase integrates payment gateways, checkout flows, subscriptions, usage-based billing, digital wallets, credits/tokens, coupons, referrals, payouts, or paywalled entitlements — including **Razorpay, Cashfree, PhonePe, PayU, Paytm, Instamojo, Juspay, Stripe, LemonSqueezy, Paddle, Dodo Payments, PayPal, Apple In-App Purchase, Google Play Billing, RevenueCat**, or custom credit ledgers.

Financial logic bugs rarely trigger crashes or compiler warnings; they let a caller pay ₹1 for a ₹10,000 plan, replay a webhook to mint infinite AI credits, unlock paid tiers without payment, or spoof an unverified payment callback. Use this alongside `ATTACK-CLASSES.md` (`Business logic`) and `PROTOCOLS-RPC-AND-MESSAGING.md`. For mandatory payment-gateway legal pages and KYC disclosures, use Track 2's `PAYMENT-GATEWAY-PAGES-AND-KYC.md`.

## Core discipline (include in every agent prompt for this domain)

```
- Never touch live payment gateways, real cards, UPI handles, or merchant accounts. Validate strictly through source analysis and isolated local unit/harness tests with dummy gateway payloads and test HMAC secrets.
- Separate browser redirect/callback parameters (untrusted user input) from cryptographically verified server-to-server provider proof bound to an expected order, amount, currency, merchant/environment, and idempotency key.
- Every monetary or credit invariant must hold under concurrency, retries, out-of-order webhooks, partial failure, currency changes, and negative/zero/fractional inputs.
- Client-side plan flags (`isPro`, `subscriptionStatus`) in UI state or local storage are display hints, not entitlement enforcement. Locate the server-side gate protecting the paid capability or API.
- Classify `confirmed` when source and local dummy fixtures prove unauthorized value creation, price bypass, double-credit, or unpaid entitlement access. Use `needs_validation` when external gateway dashboard settings or out-of-repo billing workers are decisive.
```

## Checkout, pricing, and order-binding attack classes (subagent_type: `general`)

**Client-controlled price, currency, quantity, or discount**
Order-creation or checkout endpoints (`/api/checkout`, `/api/razorpay/order`, `/api/stripe/session`, Server Actions) read `amount`, `price`, `currency`, `discount`, `tax`, or `credits` directly from the client request instead of computing the authoritative price on the server from a trusted product/plan catalog. Also check negative quantities, zero-amount orders, fractional quantities (`0.001`), integer/float rounding loss, and coupon stacking or repeated single-use promo application.

**Currency and subunit confusion**
Gateways differ on subunits (`100` paise = ₹1 in Razorpay/Stripe INR, zero-decimal currencies like `JPY`, rupee strings in Cashfree/PayU). Review whether a caller can select a weaker currency while keeping the same numeric amount (`100 INR` vs `100 USD`), or trigger a ×100 undercharge because order creation and fulfillment disagree on paise vs rupees.

**Order-to-payment substitution and callback spoofing**
Verification endpoints (`/api/payment/verify`, success redirect handlers) accept `{ orderId, paymentId, signature }` and mark an application `internalOrderId` (from query/body) as paid without verifying that:
1. the cryptographic signature is valid (`HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)` or gateway equivalent); AND
2. `razorpay_order_id` / `payment_intent.id` belongs to *that exact* `internalOrderId`, authenticated user/tenant, expected amount, and currency; AND
3. the payment status is actually captured/succeeded rather than merely authorized, pending, or failed.
Without binding `internalOrderId <-> provider_order_id` on the server at order creation time, an attacker can pay ₹10 for a cheap item and submit that valid payment proof to mark a ₹50,000 order as paid.

## Webhook authenticity, ordering, and idempotency attack classes (subagent_type: `general`)

**Missing, fail-open, or parsed-body webhook verification**
Webhook endpoints (`/api/webhooks/razorpay`, `/api/webhooks/stripe`, `/api/webhooks/cashfree`, `/api/webhooks/phonepe`, `/api/webhooks/lemonsqueezy`) either:
- omit cryptographic signature verification altogether and trust `req.body.event`;
- wrap verification in a fail-open guard (`if (process.env.WEBHOOK_SECRET) { verify(...) }`) that silently accepts forged payloads when the env var is unset or misspelled;
- compute HMAC over `JSON.stringify(await req.json())` instead of the exact raw request bytes (`await req.text()` / raw `Buffer`), or use non-constant-time string comparison where timing leakage is practical; or
- fail to validate timestamp tolerance where supported, allowing indefinite replay of captured requests.

**Dual-path fulfillment and webhook replay double-crediting**
Applications fulfill an order or add wallet/AI credits in *both* the synchronous checkout verify callback and the asynchronous `payment.captured` / `checkout.session.completed` webhook — or process retried webhooks — without a single atomic idempotency gate (e.g., unique database constraint on `provider_payment_id` / `provider_event_id` or atomic `UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending' RETURNING *`). Prove that two concurrent or replayed deliveries mint duplicate credits, extend subscription periods twice, or trigger duplicate payouts.

**Out-of-order lifecycle and dispute/refund blind spots**
`customer.subscription.deleted`, `subscription.cancelled`, `subscription.halted`, `invoice.payment_failed`, `refund.processed`, or `charge.dispute.created` events are unhandled, ignored, or overwritten by a delayed earlier `subscription.updated` event (no `created` timestamp / sequence version check), leaving refunded, disputed, or cancelled accounts with active paid access or unrevoked credits.

## Wallet, credit, coupon, and payout race classes (subagent_type: `general`)

**Non-atomic balance, credit, or quota deduction (TOCTOU double-spend)**
Code reads `const user = await db.user.findUnique(...)`, checks `if (user.credits < cost) throw ...`, calls an LLM/payout/transfer, and later writes `credits: user.credits - cost` (or deducts only after streaming completes). Concurrent requests pass the initial check simultaneously and spend the same balance multiple times, or client disconnects abort post-usage deduction. Look for atomic conditional updates (`UPDATE ... SET credits = credits - $cost WHERE id = $id AND credits >= $cost`), serializable transactions, or `SELECT ... FOR UPDATE` with upfront reservation.

**Coupon, referral, and free-trial reset abuse**
Users can delete and recreate accounts with the same email/phone/payment instrument (or `+alias` emails if unguarded by business policy where cross-account value is minted), apply a referral code to themselves, redeem a one-time coupon concurrently across parallel requests, or re-trigger a "Start Free Trial" endpoint on an existing workspace to reset paid quotas indefinitely.

## Entitlement and environment-isolation attack classes (subagent_type: `general`)

**Server-unenforced paywall or plan downgrade remnants**
Frontend components hide "Pro" features behind `user.plan === 'pro'`, while the underlying API routes, Server Actions, export endpoints, or background jobs only check authentication (`if (!user) return 401`) and never check active plan entitlement or seat limits. Also check whether downgrading or cancelling a plan leaves API keys, team seats, scheduled jobs, or webhooks executing paid-tier actions.

**Test/sandbox credential acceptance in live fulfillment**
Webhook handlers or server verification paths accept both sandbox/test events (`livemode === false`, `rzp_test_*`, sandbox endpoints) and live events against the same production database, allowing an attacker to complete checkout with public test card numbers (`4242...`) if a test checkout route or key remains reachable.

**Raw card/PAN/CVV exposure and secret gateway key leakage**
Backend routes accept, log, or store raw card numbers, CVVs, or UPI PINs instead of using hosted checkout / tokenization SDKs, or bundle secret keys (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, `CASHFREE_SECRET_KEY`, `PHONEPE_SALT_KEY`, `PAYU_SALT`) into client/mobile code.

## Universal moves (apply across the above)

- Draw the complete state machine for every monetized flow: `Order Created -> Checkout Redirect -> Sync Callback -> Async Webhook -> Credit/Entitlement Grant -> Usage Deduction -> Renewal/Cancel/Refund/Dispute`. Mark the exact database transaction and uniqueness constraint at every arrow.
- Compare the synchronous `/verify` endpoint and asynchronous `/webhook` endpoint side by side: if an attacker calls both simultaneously with the same valid payment ID, how many times are credits or subscriptions granted?
- Test edge numeric fixtures locally: `amount = 0`, `amount = -100`, `quantity = -1`, `quantity = 0`, `quantity = 1e15`, `NaN`, `"100"`, and mismatched currency codes.

## Validation rules (apply before reporting ANY finding here)

1. Never send traffic to Stripe, Razorpay, Cashfree, PhonePe, or any external payment API. Construct local unit fixtures using dummy secrets to verify HMAC logic, raw-body parsing, state transitions, and concurrency behavior.
2. Name the attacker's starting state (unauthenticated visitor, free-tier user, or buyer of a minimal item), the exact manipulated parameter/webhook/race window, the bypassed server invariant, and the concrete financial or entitlement outcome.
3. Verify whether gateway SDK methods (e.g., `stripe.webhooks.constructEvent`, `validateWebhookSignature`) already enforce raw-body HMAC and timestamp tolerance before reporting signature defects.
4. Distinguish security vulnerabilities (here in Track 1) from missing legal/KYC pages (`Refund Policy`, `Terms`, `Contact Us`), which belong exclusively in Track 2 (`PAYMENT-GATEWAY-PAGES-AND-KYC.md`).
5. Return `confirmed` only with a complete source trace and bounded local proof. Return `needs_validation` when hosted gateway configuration, out-of-repo billing microservices, or DB constraints not committed to migrations determine the outcome.
