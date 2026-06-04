# Idempotency Key Error Handling

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Idempotency key error handling defines how the API communicates idempotency-related errors to consumers. Clear, structured error responses for conflicts, expired keys, validation failures, and store unavailability enable consumers to build robust retry logic and diagnose issues without support intervention.

## Core Concepts
- **Idempotency Conflict (409):** Returned when a request arrives with a key that matches a different request payload than the one already processed.
- **Idempotency Key Missing (422):** Returned when the `Idempotency-Key` header is required but not provided.
- **Idempotency Key Invalid (422):** Returned when the key format is invalid (too long, wrong characters, empty).
- **Idempotency Key Expired (422):** Returned when the key's TTL has elapsed and the stored response is no longer available.
- **Idempotency Store Unavailable (503):** Returned when the idempotency store (Redis) is unreachable.
- **Concurrent Request Lock (409):** Returned when a concurrent request with the same key is being processed.
- **Error Response Schema:** Structured JSON error with code, message, and retry instructions.

## Mental Models
- **Airport Gate Agent:** When two passengers have the same boarding pass (idempotency conflict), the agent flags the discrepancy and escalates. The passenger cannot board until the issue is resolved.
- **ATM Receipt:** If the ATM fails to print a receipt (store unavailable), you don't know if the transaction was processed. The bank advises you to check your balance rather than retry immediately.

## Internal Mechanics
1. **Key Validation:** Check header presence → format validation → length check. Return 422 on failure.
2. **Key Lookup:** Query the idempotency store. If unavailable (timeout/connection error), return 503.
3. **Conflict Detection:** If the key exists but the current request payload differs from the stored one, return 409.
4. **Expiration Check:** If the key exists in the soft-delete store but not the active store, return 422 with `expired` code.
5. **Concurrent Lock:** If another request is currently processing with the same key, return 409 with `retry_after` hint.
6. **Success Response:** Return the cached response with `Idempotency-Key-Status: replay` header.

## Patterns
- **Structured Error Codes:** Each idempotency error has a unique code (`IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_EXPIRED`).
- **Retry-After Header:** Include `Retry-After` header on 409 concurrent-lock responses with a suggested wait time.
- **Error Body with Resolution Steps:** Each error response includes a `resolution` field explaining what the consumer should do.
- **Warning Header for Impending Expiration:** When a key is within 10% of its TTL, include a `Warning` header to alert consumers.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| HTTP status for conflict | 409 / 422 | 409 (Conflict) | Follows HTTP semantics — the conflict is between two different payloads |
| Error response format | String / Structured JSON | Structured JSON (`error.code`, `error.message`, `error.resolution`) | Machine-readable and human-friendly |
| Include original payload in error | Yes / No | No | Security — avoids leaking sensitive data from other requests |
| Retry-after in concurrent lock | Yes / No | Yes (with 500ms default) | Prevents retry storms on the same key |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Strict vs lenient key validation | Strict validation prevents errors but may break consumers with unusual key formats |
| Detailed vs minimal error info | Detailed errors aid debugging but may expose internal state |
| 409 vs 422 for conflicts | 409 is semantically correct but some clients handle it poorly; 422 is more universally understood |

## Performance Considerations
- Error response generation adds no measurable overhead — same code path as success.
- Concurrent lock handling requires the Redis lock check — adds ~2ms per request.
- Warning header injection on near-expiry keys requires a TTL check — O(1).

## Production Considerations
- **Monitoring:** Track idempotency error rates by error code; alert on high conflict rates (indicates consumer bugs).
- **Logging:** Log every idempotency error with consumer ID, error code, and key prefix (not full key for PII reasons).
- **Backup:** Error responses are generated dynamically — no backup needed.
- **Rollback:** Error response changes affect all consumers; test error format changes in staging first.
- **Testing:** Comprehensive tests for every error scenario: missing key, invalid format, conflict, expired, concurrent, store down.

## Common Mistakes
- Returning the same error code for all idempotency failures (consumer cannot distinguish conflict from expiration).
- Including the stored request payload in conflict error responses (security / PII leak).
- Not setting `Retry-After` on concurrent-lock responses (consumers retry immediately → more conflicts).
- Using `400 Bad Request` for all idempotency issues (conflict is semantically different from invalid).
- Not handling the idempotency store being down gracefully (500 errors cascade to consumers).

## Failure Modes
- **Error Response Loop:** Consumer receives a conflict error, changes the payload, retries with the same key → same conflict. Mitigation: document that a new idempotency key is required for different payloads.
- **Store Down Cascade:** Idempotency store unavailable → all write requests return 503. Mitigation: circuit breaker falls back to "process without idempotency" with warning log.
- **Expired Key Confusion:** Consumer retries after expiration with the same key → request is processed as new → duplicate. Mitigation: soft-delete store provides a grace period.
- **Error Format Change:** Changing the error JSON format breaks consumer error parsers. Mitigation: version error schemas or guarantee backward compatibility.

## Ecosystem Usage
- **Stripe:** Returns `409 Conflict` with `idempotency_error` code and clear message pointing to the conflicting request.
- **Twilio:** Returns `422` with structured error object including code, message, and more_info URL.
- **Shopify:** Returns `409` for idempotency conflicts with a `retry_after_ms` field in the response body.

## Related Knowledge Units

### Prerequisites
- [Idempotency Key Design](ku-10-idempotency-key-design)
- [Idempotency Key TTL Expiration](ku-11-idempotency-key-ttl-expiration)

### Related Topics
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)
- [API Style Guide Documentation](ku-17-api-style-guide-documentation)

### Advanced Follow-up Topics
- Consumer-side idempotency error handling SDK
- Idempotency error analytics dashboard
- Webhook idempotency error notification

## Research Notes

### Source Analysis
Stripe's error format for idempotency conflicts is the industry standard: `type: "idempotency_error"`, `code: "idempotency_conflict"`, and a descriptive message linking to documentation.

### Key Insight
The most underappreciated error scenario is the **expired key retry**. When a consumer's idempotency key expires, a retry with the same key will be treated as a new request. If the original request actually succeeded before expiration, this results in a duplicate operation. The soft-delete store pattern mitigates this by retaining a record of expired keys long enough to alert consumers.

### Version-Specific Notes
- Laravel 11.x: Custom exception classes for each idempotency error type; `render()` method returns structured JSON.
- PHP 8.4: `enum IdempotencyErrorCode: string` provides type-safe error code definitions.
