# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Private Channel Auth with JWT/Sanctum
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Auth guard selection: Sanctum vs Passport vs web | architectural |
| 2 | Token transport: Authorization header vs cookie | security |
| 3 | Token lifetime management | security |

---

# Architecture-Level Decision Trees

---

## Auth Guard Selection

---

## Decision Context

Which authentication guard to use for private channel authorization.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Application uses SPA-style authentication (Inertia, Livewire)?
↓
YES → API tokens also needed for mobile clients?
    ↓
    YES → **Sanctum** — supports both SPA session + API tokens
    NO → **Default web guard** — session cookies suffice
NO → Application is API-only (SPA + separate frontend)?
    ↓
    YES → **Sanctum** — modern, simple token auth
    NO → Need OAuth2 scoped tokens with third-party integrations?
        ↓
        YES → **Passport** — full OAuth2 implementation
        NO → **Sanctum**

---

## Rationale

Sanctum provides both SPA cookie-based auth and token-based API auth from a single package. Passport adds OAuth2 complexity that is only necessary when third-party access or fine-grained token scopes are required.

---

## Recommended Default

**Default:** Sanctum for new Laravel applications
**Reason:** Simpler than Passport; supports both session and token auth; officially recommended for most applications.

---

## Risks Of Wrong Choice

Passport adds unnecessary OAuth2 complexity for standard API auth. Default web guard alone blocks API/mobile clients from private channels.

---

## Related Rules

Always Configure Guards Option for API-Driven Applications

---

## Related Skills

Configure Private Channel Auth with JWT/Sanctum, Authorize Private and Presence Channels in routes/channels.php

---

---

## Token Transport: Authorization Header vs Cookie

---

## Decision Context

How to transmit authentication tokens from Echo to the auth endpoint.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Application uses SPA cookie-based Sanctum auth?
↓
YES → **Cookie** — Sanctum SPA handles CSRF token + session cookie automatically
NO → Token-based auth (mobile, third-party)?
    ↓
    YES → **Authorization: Bearer header** — Echo `auth.headers` config
    NO → Session-based web app?
        ↓
        YES → **Cookie** — default web guard

---

## Rationale

Sanctum's SPA mode uses cookies with CSRF protection, which is more secure for browser-based applications. Token-based auth exposes the token in client-side JavaScript, increasing XSS risk. Headers keep tokens out of URLs (avoiding server log exposure).

---

## Recommended Default

**Default:** Authorization header with Bearer token for API-driven apps; cookie for SPA Sanctum
**Reason:** Headers keep tokens out of server logs and URLs; cookies provide automatic CSRF protection.

---

## Risks Of Wrong Choice

Tokens in query strings appear in server logs, referrer headers, and browser history. Cookies alone are vulnerable to CSWSH without additional origin validation.

---

## Related Rules

Always Use Token-Based Auth Over Cookie-Only for WebSocket

---

## Related Skills

Configure Private Channel Auth with JWT/Sanctum

---

---

## Token Lifetime Management

---

## Decision Context

How long authentication tokens should live and how to handle expiry.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Token exposed in client-side JavaScript (SPA)?
↓
YES → **Short-lived tokens** (minutes-hours) with refresh mechanism
NO → Token used server-side only?
    ↓
    YES → **Longer-lived tokens** (days) — lower refresh overhead
NO → WebSocket connection expected to last hours?
    ↓
    YES → Implement token refresh before expiry; test reconnection with expired token

---

## Rationale

Tokens accessible in client-side JS via `auth.headers` are vulnerable to XSS theft. Short-lived tokens limit the window of compromise. Token refresh mechanisms (either automatic via Axios interceptor or manual) prevent mid-session auth failures.

---

## Recommended Default

**Default:** Short-lived tokens (15-60 min) with silent refresh via Axios interceptor
**Reason:** Balances security (limited XSS exposure window) with UX (no manual re-authentication during session).

---

## Risks Of Wrong Choice

Long-lived tokens in client-side code increase XSS compromise severity. Short-lived tokens without refresh mechanism cause silent WebSocket auth failures and disconnections.

---

## Related Rules

Implement Token Refresh for Long-Lived WebSocket Sessions

---

## Related Skills

Configure Private Channel Auth with JWT/Sanctum
