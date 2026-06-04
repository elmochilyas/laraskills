# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** csrf-route-config
**Generated:** 2026-06-03

---

# Decision Inventory

1. CSRF Exclusion Strategy (Route Prefix vs Individual Paths)
2. Route Placement Strategy (web.php vs api.php)
3. Alternative Authentication Strategy

---

# Architecture-Level Decision Trees

---

## CSRF Exclusion Strategy

---

## Decision Context

Choosing how to exclude webhook routes from CSRF protection.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Are there multiple webhook routes (>3)?
↓
YES → Group under prefix `/webhook/` and exclude via wildcard: `webhook/*`
  ↓
  Are webhooks spread across different route files?
  ↓
  YES → Apply prefix at RouteServiceProvider level for consistency
  NO → Prefix in single route file; one wildcard in $except array
NO → Is there only one webhook endpoint?
  ↓
  YES → Exclude by exact path in $except array (specific, auditable)
  NO → 2-3 endpoints: exclude individually or use prefix for future-proofing
  ↓
  Need to verify CSRF exclusion list in CI?
  ↓
  YES → Add CI assertion: assert webhook paths present in $except
  NO → Manual review of $except array on each deployment

---

## Rationale

Wildcard prefix exclusion scales to many webhook routes with a single entry. Individual exclusions are more explicit for small numbers. CI verification prevents forgetting exclusion on new webhook routes.

---

## Recommended Default

**Default:** `/webhook/*` prefix with wildcard $except entry
**Reason:** One-time configuration, scales to any number of webhook routes, clear naming convention

---

## Risks Of Wrong Choice

Individual exclusion for many routes is error-prone (forgetting one causes 419). Overly broad wildcard excludes unintended routes from CSRF protection.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List, Use Route Prefix to Group Webhook Endpoints

---

## Related Skills

Exclude Webhook Routes from CSRF Protection

---

## Route Placement Strategy

---

## Decision Context

Choosing between `routes/web.php` and `routes/api.php` for webhook route definitions.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Are webhook routes the only API-like routes in the application?
↓
YES → Use routes/web.php with CSRF exclusion (consistent with Laravel convention)
  ↓
  Does the rest of the application use sessions?
  ↓
  YES → web.php is appropriate; webhook routes are exceptions
  NO → Consider api.php if the app is API-only
NO → Does the application already use routes/api.php for other integrations?
  ↓
  YES → Place webhook routes in api.php (no CSRF, consistent grouping)
  NO → Use web.php with precise CSRF exclusion for clarity
  ↓
  Webhook routes need rate limiting?
  ↓
  YES → api.php has throttle middleware by default; convenient for rate limiting
  NO → web.php with manual middleware configuration is fine

---

## Rationale

routes/api.php eliminates CSRF concerns entirely and provides built-in throttle middleware. routes/web.php is conventional but requires explicit CSRF exclusion. The choice depends on whether the application already uses the api middleware group.

---

## Recommended Default

**Default:** routes/web.php with explicit CSRF exclusion via `/webhook/*` prefix
**Reason:** Follows Laravel convention; CSRF exclusion is explicit and auditable

---

## Risks Of Wrong Choice

api.php routes lack CSRF but also lack session state — inappropriate for apps that need session data in webhook processing. web.php routes without CSRF exclusion silently break all webhook deliveries.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List

---

## Related Skills

Exclude Webhook Routes from CSRF Protection

---

## Alternative Authentication Strategy

---

## Decision Context

Choosing the compensating authentication mechanism for CSRF-exempted webhook routes.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the webhook provider support HMAC signature signing?
↓
YES → Implement signature verification as the compensating auth
  ↓
  Is the signature standard (SHA256 with HMAC)?
  ↓
  YES → Use Spatie's default SignatureValidator with hash_equals()
  NO → Implement custom SignatureValidator for non-standard signing
NO → Does the provider support IP whitelisting?
  ↓
  YES → Implement IP whitelist middleware + signature verification if available
  NO → Implement custom authentication (API key in header, basic auth)
  ↓
  Need multiple authentication methods per provider?
  ↓
  YES → Chain middleware: verify IP first, then signature
  NO → Single authentication method is sufficient

---

## Rationale

Signature verification is the recommended compensating control for CSRF-exempted routes. It provides cryptographic proof of payload authenticity. IP whitelisting adds a network-layer control but is less reliable than signatures.

---

## Recommended Default

**Default:** HMAC-SHA256 signature verification with hash_equals() for timing-safe comparison
**Reason:** Industry standard; supported by all major webhook providers; cryptographic proof of origin

---

## Risks Of Wrong Choice

No compensating authentication on CSRF-exempted routes allows anyone to POST to the endpoint. IP whitelisting alone is insufficient (IPs can be spoofed or change). Plain API keys in headers are weaker than HMAC signing.

---

## Related Rules

Never Disable CSRF Globally

---

## Related Skills

Exclude Webhook Routes from CSRF Protection
