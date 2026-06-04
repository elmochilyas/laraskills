# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** idempotency-key
**Generated:** 2026-06-03

---

# Decision Inventory

1. Key Generation Strategy (Client vs Server)
2. Key Lifecycle Management (TTL vs Event-Based Expiry)
3. Key Validation Strategy (Same vs Different Payload)

---

# Architecture-Level Decision Trees

---

## Key Generation Strategy

---

## Decision Context

Choosing how idempotency keys are generated.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the client have reliable retry capability?
↓
YES → Client generates UUID v4 per operation before first attempt
  ↓
  Is the key generated inside or outside the retry loop?
  ↓
  OUTSIDE → One key per operation; survives retries (correct)
  INSIDE → New key per attempt; defeats idempotency purpose
NO → Server generates key from request fingerprint
  ↓
  Can the server reliably deduplicate identical requests?
  ↓
  YES → Server-side key generation is acceptable
  NO → Client generation is mandatory
  ↓
  Need to scope keys per user or tenant?
  ↓
  YES → Include user/tenant scope in key namespace
  NO → Global key namespace; risk of cross-user collision

---

## Rationale

Client-generated keys outside the retry loop ensure the same key is used for all retry attempts. Server-generated keys can't distinguish intentional retries from unique operations.

---

## Recommended Default

**Default:** Client generates UUID v4 outside retry loop; sends in Idempotency-Key header
**Reason:** Correct retry handling; collision-resistant; industry standard

---

## Risks Of Wrong Choice

Key generated inside retry loop = new key per attempt = no idempotency. Predictable keys (timestamps, sequential IDs) allow collision or malicious pre-generation.

---

## Related Rules

Generate Keys as UUID v4 on the Client Side

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Key Lifecycle Management

---

## Decision Context

Managing idempotency key creation, usage, and expiration.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the upstream provider have a maximum retry window?
↓
YES → Set TTL to match provider's retry window (Stripe: 24h)
  ↓
  Does the operation have a longer business processing window?
  ↓
  YES → TTL = max(retry_window, business_window) + buffer
  NO → TTL = provider retry window + 1 hour buffer
NO → Is the operation a one-time write with no retry?
  ↓
  YES → Short TTL (1 hour); keys expire quickly
  NO → Default 24h TTL covers most retry scenarios
  ↓
  Need explicit key deletion on completion?
  ↓
  YES → Delete key after successful processing; reduces storage
  NO → Rely on TTL expiry; simpler, no explicit cleanup

---

## Rationale

TTL should match the maximum expected time between first attempt and last retry. Provider retry windows (24h for Stripe) define the standard. Explicit deletion adds complexity but reduces storage.

---

## Recommended Default

**Default:** 24-hour TTL with Redis auto-expiry
**Reason:** Covers standard provider retry windows; no cleanup code needed

---

## Risks Of Wrong Choice

TTL shorter than retry window allows duplicate processing on late retries. No TTL causes unbounded storage growth. Explicit deletion adds failure points.

---

## Related Rules

Implement TTL-Based Key Expiration

---

## Related Skills

Cache SaloonPHP Requests with the Cache Plugin

---

## Key Validation Strategy

---

## Decision Context

Handling the same key with different request payloads.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the client send the same key with identical payload?
↓
YES → Return cached first response (standard idempotent replay)
  ↓
  Does the client send the same key with DIFFERENT payload?
  ↓
  YES → Return 422 Unprocessable Entity (key prevented misuse)
  NO → Return cached first response (normal duplicate)
NO → Is this a first-time request with a valid new key?
  ↓
  YES → Process normally; store key and response
  NO → Validate key format (UUID pattern, length); reject malformed keys
  ↓
  Need to return Idempotency-Status header?
  ↓
  YES → Return Original for first request, Repeated for duplicate
  NO → No status header; caller infers from response

---

## Rationale

Same key + same payload = safe replay (return cached response). Same key + different payload = key collision or client bug (return error). Idempotency-Status header provides explicit signal to clients.

---

## Recommended Default

**Default:** Return cached response for same key+payload; 422 for same key+different payload
**Reason:** Correct deduplication; clear error signal for key misuse

---

## Risks Of Wrong Choice

Same key + different payload processing silently causes data corruption (wrong operation executed). No Idempotency-Status header leaves clients guessing whether their request was actually processed.

---

## Related Rules
Use Unique Index on Key Column, Return 409 for Duplicate Key with Same Payload

---

## Related Skills
Implement Secure Incoming Webhook Processing with Spatie
