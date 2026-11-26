# Vibe-Coding, Full-Stack Framework, and BaaS Hunting

#### When to use this file

Reach for this file when the target is a modern full-stack web or mobile application built with AI coding assistants or Backend-as-a-Service (BaaS) platforms: Next.js (App Router / Pages Router / Server Actions), Remix, SvelteKit, Astro, Nuxt, Vite SPAs, Expo / React Native, Flutter, Supabase (PostgREST, Auth, Storage, Edge Functions, RPC), Firebase (Firestore, Realtime Database, Storage, Cloud Functions), Convex, Appwrite, Clerk / BetterAuth / Auth.js, Prisma / Drizzle ORMs, UploadThing / S3 / R2 presigned uploads, or paid third-party AI / SMS / email APIs.

AI-generated and vibe-coded applications disproportionately fail at **implicit boundary assumptions**: developers assume a `"use server"` function is only callable from their React button, that `NEXT_PUBLIC_*` only runs on the server, that Supabase tables are private by default, or that UI route guards protect backend mutations. Use this alongside `ATTACK-CLASSES.md`, `WEB-PROTOCOL-AND-AUTH.md`, `CLIENT-SIDE.md`, and `DATA-ISOLATION-AND-LIFECYCLE.md`.

## Core discipline (include in every agent prompt for this domain)

```
- A UI guard, hidden button, client-side role check, or client router redirect is never a security control. Locate the server-side, Edge-function, or BaaS rule enforcement that executes when the endpoint, RPC, or collection is called directly.
- Separate publishable identifiers (Supabase anon key, Firebase web API key, Stripe publishable key, Razorpay key_id) from privileged credentials. A public key is a finding ONLY when backend rules (RLS, Firestore rules, API key restrictions) permit unauthorized read, write, or spend with that key.
- Every `"use server"` Server Action, tRPC procedure, API route, Edge Function, Cloud Function, and BaaS RPC is a public network entrypoint unless gated by verified identity and per-resource authorization.
- For paid API amplification (LLM, image/video/voice generation, SMS OTP, email), establish the exact unauthenticated or uncapped path from untrusted caller to operator-paid external spend.
- Classify `confirmed` only from source-visible active code/migrations/rules and bounded local validation. Use `needs_validation` when hosted Supabase dashboard RLS, live Firebase rules, or external API key restrictions are absent from the repository.
```

## Client-bundle secret and privileged-client attack classes (subagent_type: `general`)

**Public-env and client-bundle credential leakage**
Privileged secrets are exposed through client-bundled environment prefixes (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`, `REACT_APP_`, `PUBLIC_`, `NUXT_PUBLIC_`), imported server config modules inside `"use client"` graphs, mobile asset bundles (`app.json`, `eas.json`, Flutter `.env` assets), committed `.env*` / service-account JSON files, or `productionBrowserSourceMaps`. Confirm the exposed value grants real authority (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PRIVATE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_SECRET`, database URLs, JWT signing secrets) rather than a designed-public identifier.

**Admin or service-role BaaS client in user-facing paths**
Server routes, Server Actions, or Edge Functions instantiate a privileged client (`createClient(url, SUPABASE_SERVICE_ROLE_KEY)`, `firebase-admin`, unscoped Prisma/Drizzle client) to "make queries work" and then filter with caller-supplied `userId`, `orgId`, or `email` instead of binding every query to the verified session principal. Trace every privileged client instantiation to all callers and verify server-derived ownership predicates.

**React Server Component and loader over-serialization**
Server Components, `getServerSideProps`, Remix `loader`s, SvelteKit `+page.server` loads, or API serializers pass full ORM/database records (`user`, `organization`, `integration`) into client component props or JSON responses, leaking `passwordHash`, `apiKey`, `stripeCustomerId`, `webhookSecret`, OAuth refresh tokens, internal admin notes, or other users' PII inside the serialized RSC payload / `__NEXT_DATA__`.

## Supabase and Postgres BaaS attack classes (subagent_type: `general`)

**Missing or permissive Row-Level Security on exposed schemas**
Tables, materialized views, or views in Supabase's PostgREST-exposed schemas (`public` or configured schemas) lack `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, omit policies for specific verbs (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), use `USING (true)` / `WITH CHECK (true)` on non-public tables, or define views without `security_invoker = true` so queries execute with the view owner's privileges and bypass underlying RLS. If migrations/SQL are absent from the repo while `supabase-js` queries tables directly from the client, record `needs_validation` naming the exact tables and operations.

**Mutable `user_metadata` trusted for authorization**
RLS policies, Edge Functions, or backend middleware authorize privileged actions using `auth.jwt() -> 'user_metadata' ->> 'role'` or `session.user.user_metadata.is_admin`. In Supabase Auth, any authenticated user can overwrite their own `user_metadata` via `supabase.auth.updateUser({ data: { role: "admin" } })`. Authorization claims must come from `app_metadata` (server-only) or a server-protected roles table.

**`SECURITY DEFINER` RPC escalation and `search_path` hijacking**
Postgres functions exposed via `supabase.rpc(...)` are marked `SECURITY DEFINER` without `SET search_path = public` (or `pg_temp` exclusion), omit explicit `REVOKE EXECUTE ... FROM anon, authenticated`, or accept a caller-supplied `target_user_id` / `tenant_id` without checking `auth.uid()`. Trace what `anon` and `authenticated` roles can invoke directly via `/rest/v1/rpc/<fn>`.

**Supabase Storage bucket and object-path overreach**
`storage.objects` policies permit `anon` or any `authenticated` principal to read private buckets, list bucket contents, upload executable `text/html` or `image/svg+xml` on an app-trusted domain, or overwrite/delete another user's files because path policies fail to bind `(storage.foldername(name))[1] = auth.uid()::text`.

## Firebase and NoSQL BaaS attack classes (subagent_type: `general`)

**Permissive Firestore, Realtime Database, or Cloud Storage rules**
In-repo `firestore.rules`, `database.rules.json`, or `storage.rules` use `allow read, write: if true;`, `allow read, write: if request.auth != null;` across multi-user collections, or recursive wildcards (`match /{document=**}`) that override stricter subcollection rules. Prove a logged-in (or anonymous-auth) user can read, list, overwrite, or delete another user's document.

**Client-writable privilege, quota, or billing fields**
Firestore or Supabase RLS `INSERT`/`UPDATE` rules verify document ownership (`request.auth.uid == userId`) without restricting modified keys (`request.resource.data.diff(resource.data).affectedKeys()`), allowing a user to directly update `role: "admin"`, `plan: "enterprise"`, `credits: 999999`, `isVerified: true`, or `orgId` from client SDK calls.

**Callable and HTTP Cloud Function trust confusion**
Firebase `onCall` / `onRequest` functions, Supabase Edge Functions, or Convex mutations read `data.uid` from the request payload instead of `context.auth.uid` / `request.auth`, leave CORS/HTTP triggers unauthenticated, or omit replay/abuse controls on public triggers.

## Full-stack framework and route-boundary attack classes (subagent_type: `general`)

**Unauthenticated or under-authorized Server Actions**
Functions marked `"use server"` (file-level or inline) mutate database state, delete resources, change roles, trigger emails, or return sensitive data without verifying the current session and resource ownership inside the action itself. Remember that Next.js compiles every exported `"use server"` function into a directly reachable POST endpoint callable with crafted arguments regardless of whether any UI renders it.

**Middleware-only auth and matcher bypass**
Applications rely exclusively on `middleware.ts` / edge hooks for authentication while route handlers, Server Actions, or static/rewrite paths execute without data-layer session verification. Check `config.matcher` exclusions (e.g., regexes skipping paths with dots `.`, `/api/webhooks`, `/trpc`, case variations, or trailing slashes) and framework version behaviors to verify whether protected handlers can be reached directly.

**Exposed seed, debug, admin, or studio endpoints**
Vibe-coded projects frequently leave `/api/seed`, `/api/reset`, `/api/test`, `/api/debug`, `/api/admin/*`, `/api/cron/*` (without `CRON_SECRET` verification), unprotected GraphQL playgrounds, or Swagger try-it endpoints active in production routing trees. Confirm the route is exported in the active build and executes privileged mutations or disclosures without authentication.

**ORM mass assignment and unsafe raw query interpolation**
Endpoints pass `await req.json()` directly into `prisma.user.update({ data: body })`, Drizzle `.set(body)`, Mongoose `findByIdAndUpdate(id, req.body)`, or `$queryRawUnsafe(`... ${input}`)` without an explicit field allowlist, letting callers overwrite ownership, roles, timestamps, or inject SQL.

## Paid-API spend and upload sink attack classes (subagent_type: `general`)

**Unbounded AI, media, SMS, or email spend amplification ("Wallet Drain")**
An unauthenticated, anonymous-signup, or uncapped endpoint forwards attacker requests directly to operator-billed APIs (OpenAI, Anthropic, Gemini, Replicate, ElevenLabs, Fal, Twilio/MSG91 SMS OTP, Resend/SendGrid). Check for: (a) missing auth or bot/rate gating on pre-auth OTP/AI endpoints; (b) client-controlled `model`, `max_tokens`, `n`, image resolution, or system prompt turning a cheap preview route into unbounded expensive inference; and (c) missing per-user/tenant credit or rate enforcement before upstream dispatch.

**Unsafe presigned upload and stored active content**
Upload endpoints (`/api/upload`, S3/R2 `PutObjectCommand` presigners, UploadThing routers) issue write URLs without authentication, accept caller-controlled object keys that overwrite other users' assets (`../../avatars/victim.png` or `users/<other-id>/doc.pdf`), omit `ContentLength` bounds, or serve user-uploaded `.html`/`.svg` inline from a cookie-bearing or trusted origin.

## Universal moves (apply across the above)

- Inventory every `"use server"` directive, `app/api/**/route.*`, `pages/api/**`, `supabase/functions/**`, `functions/src/**`, `supabase/migrations/*.sql`, `firestore.rules`, `storage.rules`, and `NEXT_PUBLIC_*`/`VITE_*`/`EXPO_PUBLIC_*` reference before hunting individual routes.
- Build a two-column matrix for every database table/collection: (1) can the browser/mobile SDK query it directly with the public/anon key? (2) what exact RLS policy or security rule restricts `SELECT`, `INSERT`, `UPDATE`, and `DELETE` per column/field?
- Trace every privileged secret from `.env.example` / config loader into bundle boundaries (`client` vs `server` module imports) and runtime handlers.

## Validation rules (apply before reporting ANY finding here)

1. Never report a publishable key (`SUPABASE_ANON_KEY`, Firebase `apiKey`, `pk_live_*`, `rzp_live_*` key ID) as a secret leak by itself. Prove either that a *secret* key is exposed, or that backend rules allow unauthorized data access/mutation using that publishable key.
2. For Server Action, API route, or cron findings, trace the exact exported handler, middleware matcher coverage, session check, and reachable sink with dummy-tenant local inputs.
3. For Supabase RLS or Firebase rules, cite the exact SQL migration or `.rules` file line; if rules live only in a hosted cloud console and are not committed to the repository, classify as `needs_validation` with an exact owner SQL/console verification query.
4. For paid-API / wallet-drain findings, never send live requests to OpenAI, Stripe, Twilio, or external APIs. Prove the unauthenticated/unbounded dispatch path from source and mocked local handlers.
5. Return `confirmed` only with a complete source trace and concrete cross-boundary disclosure, unauthorized mutation, privilege escalation, or operator-spend amplification.
