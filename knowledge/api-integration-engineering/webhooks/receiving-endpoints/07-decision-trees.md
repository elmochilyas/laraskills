# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** receiving-endpoints
**Generated:** 2026-06-03

---

# Decision Inventory

1. Route Placement Strategy (web.php vs api.php)
2. Endpoint Organization Strategy (Single vs Per-Provider Routes)
3. Response Strategy (200 Immediate vs Processed Response)

---

# Architecture-Level Decision Trees

---

## Route Placement Strategy

---

## Decision Context

Choosing between routes/web.php and routes/api.php for webhook endpoints.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the application primarily serve web routes with CSRF and sessions?
↓
YES → Use routes/api.php for webhooks (no CSRF, no session overhead)
  ↓
  Does the application already use api middleware group?
  ↓
  YES → Webhook routes fit naturally; share throttle middleware
  NO → Add webhook routes to api.php; avoids CSRF issues entirely
NO → Is the application API-only with api.php as primary route file?
  ↓
  YES → Webhook routes in api.php is the natural choice
  NO → Use routes/web.php with explicit CSRF exclusion
  ↓
  Need rate limiting on webhook endpoints?
  ↓
  YES → api.php has throttle middleware by default; convenient
  NO → web.php with manual middleware is fine

---

## Rationale

routes/api.php eliminates CSRF concerns and provides built-in throttle middleware. routes/web.php is conventional but requires explicit CSRF exclusion.

---

## Recommended Default

**Default:** routes/api.php for all webhook endpoints
**Reason:** No CSRF issues; built-in throttle middleware; no session overhead

---

## Risks Of Wrong Choice

web.php without CSRF exclusion silently drops all webhook deliveries with 419. api.php without CSRF concern is simpler but may be unexpected for teams used to web.php conventions.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Endpoint Organization Strategy

---

## Decision Context

Choosing between a single webhook endpoint or per-provider endpoints.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does the application receive webhooks from multiple providers?
↓
YES → Create separate routes per provider (/webhook/stripe, /webhook/github)
  ↓
  Do providers use different signature schemes?
  ↓
  YES → Separate routes enable per-provider middleware and config
  NO → Separate routes still better for routing clarity and isolation
NO → Single provider with one event type?
  ↓
  YES → Single webhook endpoint is sufficient
  NO → Single endpoint with event type routing in controller
  ↓
  Need to version webhook endpoints?
  ↓
  YES → Prefix with version: /webhook/v1/stripe, /webhook/v2/stripe
  NO → No version prefix needed for single-version endpoints

---

## Rationale

Per-provider routes provide clear separation, independent middleware stacks, and easier debugging. A single endpoint for all providers creates coupling and makes per-provider configuration harder.

---

## Recommended Default

**Default:** Separate route per provider under /webhook/{provider} prefix
**Reason:** Clean isolation; per-provider middleware; easy to add/remove providers

---

## Risks Of Wrong Choice

Single endpoint for all providers creates a shared failure domain. One provider's issues (rate limiting, misconfigured route) affect all other providers.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Response Strategy

---

## Decision Context

Choosing how to respond to incoming webhook HTTP requests.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the webhook processing queued (async)?
↓
YES → Return 200 immediately after validation and queue dispatch
  ↓
  Does the provider require specific response body?
  ↓
  YES → Return provider-expected body (stripe expects 'ok' or empty JSON)
  NO → Simple 200 with empty JSON is universally accepted
NO → Is the processing synchronous and fast (<100ms)?
  ↓
  YES → Return 200 after processing; still prefer queue for safety
  NO → Never process synchronously; always queue-first
  ↓
  Need to acknowledge specific events in response?
  ↓
  YES → Return received event IDs in response for provider acknowledgment
  NO → Generic 200 OK is sufficient for all providers

---

## Rationale

Queue-first architecture returns 200 immediately, preventing provider timeouts. The response acknowledgment is minimal since actual processing happens asynchronously.

---

## Recommended Default

**Default:** Return 200 with empty JSON immediately after signature validation and queue dispatch
**Reason:** Prevents provider timeouts; enables async processing; universally compatible

---

## Risks Of Wrong Choice

Waiting for processing completion before responding risks provider timeout and retry. Too-slow response (<5s) triggers provider retry, potentially causing duplicate processing.

---

## Related Rules

Always Add Webhook Routes to CSRF Exception List

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie
