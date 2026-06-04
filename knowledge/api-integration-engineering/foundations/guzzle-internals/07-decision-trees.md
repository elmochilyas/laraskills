# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** guzzle-internals
**Generated:** 2026-06-03

---

# Decision Inventory

1. Handler Stack Architecture
2. Middleware Order Decision
3. cURL Option Selection

---

# Architecture-Level Decision Trees

---

## Handler Stack Architecture

---

## Decision Context

Designing the Guzzle handler stack for middleware composition.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Need custom middleware beyond Laravel's defaults?
↓
YES → Use HandlerStack::create() with tap()
  ↓
  Stack shared across multiple services?
  ↓
  YES → Create per-service handler stack to avoid global mutation
  NO → Single stack with shared default middleware is fine
NO → Use default Laravel Http facade handler stack
  ↓
  Need to add just one middleware?
  ↓
  YES → Push middleware onto the default stack with `->withMiddleware()`
  NO → Default stack is sufficient

---

## Rationale

HandlerStack is a deque where middleware order matters. Using tap() creates clean, isolated stacks. Per-service stacks prevent middleware conflicts between different API integrations.

---

## Recommended Default

**Default:** Create per-service handler stack via HandlerStack::create()
**Reason:** Clean isolation with no risk of cross-service middleware interference

---

## Risks Of Wrong Choice

Global handler stack mutation affects all HTTP clients. Missing HandlerStack::create() leads to middleware accumulation across services.

---

## Related Rules

Handler stack created per service, not globally mutated

---

## Related Skills

Configure Guzzle Middleware Stack

---

## Middleware Order Decision

---

## Decision Context

Determining the correct order of middleware layers in the handler stack.

---

## Decision Criteria

* performance
* security
* maintainability

---

## Decision Tree

Is authentication required for the API?
↓
YES → Push auth middleware as inner layer (last pushed, first executed)
  ↓
  Is retry middleware needed?
  ↓
  YES → Push retry middleware after auth (outside auth)
  ↓
  Is logging/monitoring needed?
  ↓
  YES → Push monitoring middleware as outer layer (first pushed)
  NO → Single auth middleware is sufficient
NO → Is retry middleware needed?
  ↓
  YES → Push retry; push monitoring outside it
  NO → Push monitoring only

---

## Rationale

Middleware executes outer-first: monitoring wraps everything, retry wraps the request including auth, auth runs closest to the HTTP call. This ensures auth happens on every retry attempt and monitoring captures everything.

---

## Recommended Default

**Default:** Monitoring (outer) → Retry → Auth (inner) → HTTP call
**Reason:** Auth fresh on each retry; monitoring captures all activity

---

## Risks Of Wrong Choice

Auth after retry means retry happens without auth (401 on each retry). Monitoring inside auth means unauthenticated requests are not logged.

---

## Related Rules

Push retry middleware after auth middleware, Push monitoring as outer layer

---

## Related Skills

Configure Guzzle Middleware Stack

---

## cURL Option Selection

---

## Decision Context

Choosing direct cURL options vs Guzzle methods for HTTP client configuration.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Is the option available as a Guzzle method (->timeout(), ->connectTimeout())?
↓
YES → Use Guzzle method (cleaner, portable, better DX)
NO → Use cURL constant via CURLOPT_*
  ↓
  Is it TCP_NODELAY for latency-sensitive calls?
  ↓
  YES → Set CURLOPT_TCP_NODELAY => true
  NO → Set CURLOPT_* directly in withOptions()
  ↓
Are you overriding an existing default?
↓
YES → Merge with existing options, don't replace
NO → Set as single option

---

## Rationale

Guzzle methods provide cleaner abstraction and cross-handler compatibility. cURL constants should be used only when no Guzzle equivalent exists, with proper merging to avoid overwriting defaults.

---

## Recommended Default

**Default:** Prefer Guzzle methods (->timeout(), ->connectTimeout()) over CURLOPT
**Reason:** Cleaner, handler-agnostic, IDE-friendly

---

## Risks Of Wrong Choice

Overriding default options instead of merging breaks connection pooling. Using CURLOPT where Guzzle methods exist reduces portability to non-curl handlers.

---

## Related Rules

Use Guzzle methods over raw cURL options

---

## Related Skills

Configure Guzzle Middleware Stack
