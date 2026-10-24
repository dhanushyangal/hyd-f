# Hydrilla Security Architecture & Audit Report

**Date:** October 2026  
**Target Repository:** `hydrilla/frontend` (`hyd-f`)  
**Scope:** Frontend App Router, Route Handlers, Middleware, DCC Local Bridge, BYOK Key Management, and Dependency Surface.

---

## 1. Executive Summary

Hydrilla's frontend is architected as a Next.js (App Router) application hosted on Vercel, integrating with Clerk for authentication, a Node/Express backend for orchestration and persistence, an AWS EC2/GPU cluster for 3D inference, and merchant-of-record processors for billing.

### Current Security Posture Overview

| Domain | Status | Key Mechanism / Findings |
|---|---|---|
| **Authentication & Sessions** | **Strong** | Clerk JWT session tokens, route matcher protection in middleware, deployment skew protection. |
| **Open Redirect Defense** | **Strong** | Middleware enforces strict local pathname redirect validation (`startsWith("/") && !startsWith("//")`). |
| **Scanner & Exploit Resistance**| **Good** | Malformed `next-action` server action header filtering in middleware. |
| **Secrets & Credential Hygiene**| **Good** | No hardcoded live secrets or private keys in Git. BYOK keys masked client-side; only `last4` returned from backend. |
| **SSRF & Proxy Protections** | **Moderate** | Strict origin checking in `/api/proxy` (docs); internal proxy wrappers for S3 GLB and image CORS. |
| **HTTP Security Headers** | **Needs Action** | Missing baseline headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`) in `next.config.js`. |
| **Local DCC Bridge (`127.0.0.1:7345`)** | **Needs Review** | Local loopback bridge lacks web origin/CORS verification, risking browser-to-localhost cross-site requests. |
| **Dependency Surface** | **Needs Action** | 6 vulnerabilities detected via `npm audit` (Next.js 16.1.1, DOMPurify, sharp/libvips, postcss). |

---

## 2. Authentication & Access Control

### 2.1 Route Guarding via Next.js Middleware (`middleware.ts`)
Hydrilla applies edge route matching via `@clerk/nextjs/server`:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/workspace(.*)",
  "/generate(.*)",
  "/generations(.*)",
  "/library(.*)",
  "/checkout(.*)",
  "/rigging(.*)",
]);
```

- **Unauthenticated Redirection**: Any unauthenticated hit to these routes triggers Clerk's `auth.protect()` with redirection to `/sign-in`.
- **Open Redirect Mitigation**: When constructing the return URL, the middleware explicitly checks:
  ```typescript
  const returnTo = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    signInUrl.searchParams.set("redirect_url", returnTo);
  }
  ```
  This prevents protocol-relative open redirect attacks (`//attacker.com`).

### 2.2 Server Action Scanner Defense
Scanners routinely probe Next.js applications by posting bogus or shortened `next-action` header hashes. Hydrilla drops these early at the middleware layer before server action execution:
```typescript
function isMalformedNextActionHeader(req: NextRequest): boolean {
  if (req.method !== "POST") return false;
  const nextAction = req.headers.get("next-action");
  if (!nextAction) return false;
  return nextAction.length < 40;
}
```

### 2.3 Deployment Skew Protection (`__vdpl`)
To protect long-lived sessions (e.g. 3D generation tabs) from desynchronization during rolling deploys:
- Sets `__vdpl` cookie with:
  - `httpOnly: true` (inaccessible to JavaScript)
  - `sameSite: "strict"` (mitigates CSRF)
  - `secure: true` in production environments.

---

## 3. API & Webhook Security

### 3.1 On-Demand ISR Cache Revalidation (`app/api/revalidate/blog/route.ts`)
- **Bearer Secret Authentication**: Requires `Authorization: Bearer ${process.env.BLOG_REVALIDATE_SECRET}`.
- **Path Confinement**: Revalidation requests cannot purge arbitrary cache entries; each path is verified with `path.startsWith("/blog")`.

### 3.2 Developer API Keys (`hyd_live_...`)
- Developer keys are generated via `/app/api-keys` and authenticated against the backend.
- Keys are shown in plaintext **only once** upon generation.
- Frontend views only display metadata (`keyPrefix`, `status`, `lastUsedAt`, `createdAt`).
- Immediate key revocation is supported.

### 3.3 BYOK (Bring Your Own Key) Security (`app/app/settings/page.tsx`)
- Users providing third-party LLM keys (Anthropic, OpenAI, Google Gemini, OpenRouter, Cursor) transmit them over TLS directly to `/api/user/api-keys/[provider]`.
- The frontend never caches or stores raw keys in `localStorage` or state after submission.
- The backend stores them encrypted and only exposes `status: "valid" | "invalid"` and `last4`.

---

## 4. Network, Proxy & SSRF Controls

### 4.1 Docs API Proxy (`hdocs/hydrilla_doc/app/api/proxy/route.ts`)
The documentation portal provides an API testing proxy. SSRF mitigations include:
- Rejection of non-root paths or paths containing `://`.
- Enforces strict target origin match against `API_BASE` (`target.origin !== new URL(API_BASE).origin`).
- Explicitly whitelists forwarded headers (`Authorization` and `Content-Type`).

### 4.2 Asset & Image Proxying (`lib/api.ts`)
- **GLB Proxy (`/api/3d/glb/:jobId`)**: Prevents direct unauthorized exposure of backend S3 bucket endpoints and resolves browser CORS issues in Three.js viewers.
- **Image Proxy (`/api/3d/image-proxy?url=...`)**: Restricts external fetches to AWS S3 (`amazonaws.com`) and GPU gateway output buckets.

---

## 5. Local DCC Bridge Security (`127.0.0.1:7345`)

The Hydrilla Studio Bridge connects browser sessions to local DCC tools (Blender, Unity, Unreal, Godot).

### Implementation Details:
- The browser pushes the current Clerk session JWT and user details to `http://127.0.0.1:7345/auth` every 10 seconds.
- Communication uses standard browser `fetch()`.

### Security Considerations:
1. **Loopback Scope**: Binds to `127.0.0.1`, which prevents remote network hosts from connecting.
2. **Local Port Risk**: Any third-party website visited by a user could theoretically send HTTP POST requests to `http://127.0.0.1:7345/auth` unless the local bridge daemon actively verifies the `Origin` header (`https://hydrilla.ai`).
3. **Recommendation**: Ensure the desktop add-ons (Blender Python server, Unity listener) validate that `req.headers["origin"] === "https://hydrilla.ai" || req.headers["origin"] === "http://localhost:3000"`.

---

## 6. Secrets & Environment Variable Hygiene

An audit of Git tracking, environment files, and frontend source code confirms:

- **`.gitignore` Coverage**: Properly excludes `.env`, `.env*.local`, `.clerk/`, `.claude/`, and PEM files.
- **Git Tree Check**: No secret keys (`sk_live_`, `sk_test_`, AWS keys, or AI provider tokens) are committed to version control.
- **`NEXT_PUBLIC_` Audit**: Only client-safe values are prefixed:
  - `NEXT_PUBLIC_BACKEND_URL`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

---

## 7. Client-Side XSS & Content Handling

### 7.1 `dangerouslySetInnerHTML` Usage
Audited all occurrences of HTML rendering:
1. `app/blog/[slug]/page.tsx` & `components/content/ArticleBody.tsx`:
   - Renders blog content from backend `/api/blog/posts`.
   - *Risk*: If backend CMS or post database is compromised, unescaped HTML executes on client browsers.
   - *Fix*: Pass backend HTML through an updated, hardened `DOMPurify.sanitize()` before injection.
2. `hdocs/hydrilla_doc/components/CodeBlockShell.tsx`:
   - Renders syntax-highlighted code from Shiki (safe, generated at build/render time).
3. `components/seo/JsonLd.tsx`:
   - Renders serialized JSON metadata inside `<script type="application/ld+json">`. Standard and safe.
4. `hdocs/hydrilla_doc/app/layout.tsx`:
   - Renders inline theme initialization script. Safe static JavaScript string.

---

## 8. Dependency Vulnerability Audit (`npm audit`)

Running `npm audit` on the project identified **6 vulnerabilities (4 High, 2 Critical)**:

| Package | Severity | Issue / Advisory | Impact on Hydrilla |
|---|---|---|---|
| **next** (16.1.1) | **Critical** | RCE in Image Optimization API (AVIF/SVG), App Router Server Action DoS, SSG/ISR cache poisoning (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4, GHSA-cjq9-62q9-8jv4) | Affects self-hosted Next.js or edge image handlers when processing attacker-supplied images. |
| **dompurify** (<=3.4.16) | **Critical** | DOM XSS via hook bypass and rawtext reparse (GHSA-p98j-92pf-mc4p, GHSA-6688-9rhm-gjv2) | Vulnerable if used to sanitize untrusted user input without latest patches. |
| **sharp** (<=0.35.5) | **High** | libvips, libheif, librsvg memory vulnerabilities (CVE-2026-33327, GHSA-f88m-g3jw-g9cj) | Memory safety risk in native image transformation pipelines. |
| **postcss** (<=8.5.22) | **High** | Arbitrary file read & path traversal via `sourceMappingURL` in comments (GHSA-6g55-p6wh-862q) | Build-time and tooling vulnerability. |
| **nanoid** (<3.3.18) | **High** | Infinite loop in custom generators when size is zero (GHSA-2v37-7h3g-55p8) | Denial of service risk if custom generator invoked with 0. |
| **source-map-js** (1.0.0-1.2.1) | **High** | Event-loop denial of service via indexed source-map offsets (GHSA-68fv-2mgg-jv7q) | Build-time DoS risk. |

---

## 9. Gaps & Missing Defenses (Checklist)

1. **HTTP Security Headers Missing**:
   - `next.config.js` currently only configures `Cache-Control` headers for `/`, `/blog`, and static images.
   - Missing:
     - `Content-Security-Policy` (CSP)
     - `Strict-Transport-Security` (HSTS: `max-age=63072000; includeSubDomains; preload`)
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY` (prevents clickjacking)
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

2. **Wildcard Image Host in `next.config.js`**:
   - `{ protocol: "https", hostname: "**.amazonaws.com" }` allows image optimization from *any* AWS S3 bucket on earth.
   - *Recommendation*: Scope strictly to `hydrilla-outputs-1.s3.amazonaws.com` and known company buckets.

3. **Rate Limiting on Public Endpoints**:
   - `/api/proxy` in `hdocs` lacks rate-limiting (unlike `/api/feedback` which has 5 req/min).

---

## 10. Prioritized Security Recommendations

### Priority 0 (Immediate Action)
- [ ] **Run Dependency Fixes**: Upgrade `next`, `sharp`, and `dompurify` via `npm audit fix` or target version bumps to eliminate known RCE and XSS vulnerabilities.
- [ ] **Add Standard Security Headers**: Configure security headers in `next.config.js` (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

### Priority 1 (High Priority)
- [ ] **Constrain Image Domains**: Remove the wildcard `**.amazonaws.com` pattern from `next.config.js` `remotePatterns` and whitelist only specific Hydrilla buckets.
- [ ] **DCC Bridge Origin Verification**: Update Blender/Unity/Godot plugins to reject requests to `127.0.0.1:7345` unless `Origin: https://hydrilla.ai` is present.
- [ ] **Sanitize Markdown and Blog Output**: Run all rendered HTML through `DOMPurify.sanitize()` prior to injection in `dangerouslySetInnerHTML`.

### Priority 2 (Medium / Defense-in-Depth)
- [ ] **Content Security Policy (CSP)**: Establish a baseline CSP restricting script sources to `'self'`, Clerk, PostHog, and Vercel Analytics.
- [ ] **Rate Limiting on Route Handlers**: Add IP-based sliding-window rate limiting on all public proxy/feedback routes.
- [ ] **Clerk Webhook Signature Verification**: If receiving Clerk webhooks in backend/frontend, verify `svix-id`, `svix-timestamp`, and `svix-signature`.
