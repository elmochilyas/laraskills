# Metadata

**Domain:** API Integration Engineering
**Subdomain:** webhook-systems-incoming
**Knowledge Unit:** CSRF Bypass and Route Configuration for Webhook Endpoints
**Generated:** 2026-06-03

---

# Decision Inventory

1. CSRF Protection Strategy (Route Group vs Middleware Exception)
2. Exception Specificity (Exact Path vs Wildcard)
3. Route Method Restriction (POST-only vs Open Methods)

---

# Architecture-Level Decision Trees

---

## CSRF Protection Strategy

---

## Decision Context

Choosing between placing webhook routes in `routes/api.php` (no CSRF) or `routes/web.php` with explicit CSRF exceptions.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the application primarily API-based with `routes/api.php` as the main route file?
↓
YES → Place webhook routes in `routes/api.php`; no CSRF exception needed
  ↓
  Does the API group already include throttle middleware?
  ↓
  YES → Webhook routes get rate limiting for free; natural fit
  NO → Add throttle middleware explicitly; still no CSRF concern
NO → Is the application a traditional web app using `routes/web.php`?
  ↓
  YES → Place webhook routes in `routes/web.php`; add to CSRF `$except` array
    ↓
    Are there many webhook providers with distinct paths?
    ↓
    YES → Use wildcard `/webhook/*` in `$except` for simplicity
    NO → Add exact paths one by one for tighter security
  NO → Dedicated `routes/webhooks.php` file loaded in RouteServiceProvider
    ↓
    Use api middleware group or web middleware with CSRF exception?
    ↓
    api → Cleanest approach; no CSRF; throttle middleware included
    web → Conventional; must remember CSRF exception for each route

---

## Rationale

routes/api.php eliminates CSRF concerns entirely and provides built-in throttle middleware. routes/web.php is conventional for web apps but requires explicit CSRF exclusion in VerifyCsrfToken middleware.

---

## Recommended Default

**Default:** Place webhook routes in `routes/api.php` with the api middleware group
**Reason:** No CSRF bypass needed; built-in throttle; no session overhead

---

## Risks Of Wrong Choice

web.php without CSRF exclusion causes silent 419 errors on all webhook POSTs. api.php for webhook routes may surprise teams accustomed to web.php conventions for all HTTP endpoints.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List, Prefer Exact URL Exemption Over Wildcards

---

## Related Skills

Exclude Incoming Webhook Routes from CSRF Protection

---

## Exception Specificity

---

## Decision Context

Choosing between exact URL paths and wildcard patterns in the CSRF exception list.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the set of webhook providers fixed and known at deploy time?
↓
YES → Use exact paths: `/webhook/stripe`, `/webhook/github`
  ↓
  Do providers share a common URL prefix?
  ↓
  YES → Exact paths still preferred; explicit is safer than implicit
  NO → Exact paths are the only sensible choice
NO → Are webhook routes dynamically provisioned (multi-tenant)?
  ↓
  YES → Use wildcard `/webhook/*` to cover all tenant routes
    ↓
    Are there non-webhook routes under the same prefix?
    ↓
    YES → Move webhooks to dedicated prefix; avoid exposing non-webhook routes
    NO → Wildcard is acceptable; monitor for new routes added under prefix
  NO → Fixed provider set but expecting future additions?
    ↓
    YES → Add known exact paths now; extend list as providers are added
    NO → Exact paths always; no reason for wildcard

---

## Rationale

Exact paths limit CSRF bypass surface to intended endpoints only. Wildcards broaden the bypass scope and can accidentally expose non-webhook routes. Multi-tenant systems may require wildcards for dynamic provisioning.

---

## Recommended Default

**Default:** Exact URL paths for all known webhook providers
**Reason:** Minimal CSRF bypass surface; no accidental exposure of unintended routes

---

## Risks Of Wrong Choice

Wildcards expose any route matching the pattern from CSRF protection. An attacker discovering the pattern can target unintended routes under the same prefix.

---

## Related Rules

Prefer Exact URL Exemption Over Wildcards

---

## Related Skills

Exclude Incoming Webhook Routes from CSRF Protection

---

## Route Method Restriction

---

## Decision Context

Choosing HTTP method restrictions for webhook endpoints.

---

## Decision Criteria

* security

---

## Decision Tree

Is the webhook endpoint receiving data from an external provider?
↓
YES → Register as `Route::post()` only; never use `Route::any()`
  ↓
  Does the provider send GET requests for verification?
  ↓
  YES → Handle GET with a lightweight head endpoint or return 405
  NO → POST-only is the only method needed; reject everything else
NO → Is the endpoint for internal use or testing?
  ↓
  YES → POST-only still recommended for consistency and security
  NO → Non-webhook context; method flexibility may be acceptable
  ↓
  Non-POST request received on webhook endpoint?
  ↓
  YES → Return 405 Method Not Allowed with clear error body
  NO → No action needed; method restriction working

---

## Rationale

Webhook providers universally use POST for delivering payloads. Non-POST methods have no legitimate use on webhook endpoints and expose the endpoint to CSRF and other method-based attacks.

---

## Recommended Default

**Default:** `Route::post('webhook/{provider}', [Controller::class, 'handle'])`
**Reason:** Matches provider behavior; eliminates GET-based CSRF vector; clean API design

---

## Risks Of Wrong Choice

Using `Route::any()` makes webhook endpoints accessible via GET, enabling CSRF attacks through image tags or link prefetch. Non-POST requests should always receive 405.

---

## Related Rules

Define Webhook Routes as Route::post() Only

---

## Related Skills

Exclude Incoming Webhook Routes from CSRF Protection
