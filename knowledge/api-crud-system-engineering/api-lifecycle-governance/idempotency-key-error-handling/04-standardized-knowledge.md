# ECC Standardized Knowledge — Idempotency Key Error Handling

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Idempotency Key Error Handling |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Idempotency key error handling defines how the API communicates idempotency-related errors to consumers. Clear, structured error responses for conflicts, expired keys, validation failures, and store unavailability enable consumers to build robust retry logic. Each idempotency error returns a unique error code with structured JSON containing code, message, and resolution steps.

## Core Concepts

- **Conflict (409)**: Request arrives with key that matches a different request payload than already processed.
- **Key missing (422)**: Idempotency-Key header required but not provided.
- **Key invalid (422)**: Key format invalid (too long, wrong characters, empty).
- **Key expired (422)**: Key's TTL elapsed and stored response no longer available.
- **Store unavailable (503)**: Idempotency store (Redis) unreachable.
- **Concurrent lock (409)**: Another request with same key currently being processed. Includes Retry-After header.
- **Structured error schema**: `error.code`, `error.message`, `error.resolution` for machine and human readability.

## When To Use

- Every idempotency-protected endpoint
- Error responses for consumer-facing APIs
- Developer portal error documentation

## When NOT To Use

- Internal-only endpoints without idempotency (error handling not needed)
- Non-idempotent endpoints

## Best Practices

- **Unique error codes per scenario**: `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_EXPIRED`, `IDEMPOTENCY_STORE_UNAVAILABLE`, `CONCURRENT_REQUEST_LOCK`.
- **Retry-After header on concurrent lock**: Include with suggested wait time (500ms default).
- **Resolution steps in error body**: Each error includes `resolution` field explaining consumer action.
- **HTTP status semantic accuracy**: Use 409 for conflicts (different payloads), not 422.
- **No sensitive data in errors**: Never include stored request payload in conflict responses.
- **Warning header for near-expiry**: When key within 10% of TTL, include Warning header to alert consumers.

## Architecture Guidelines

- Custom exception classes per idempotency error type with render() returning structured JSON.
- Error format: `{ "error": { "code": "IDEMPOTENCY_CONFLICT", "message": "...", "resolution": "..." } }`.
- Circuit breaker for store unavailable: return 503 with retry guidance; fall back to process-without-idempotency with warning log.
- Soft-delete store consulted on expired key lookups to provide better error messages.

## Performance Considerations

- Error response generation adds no measurable overhead.
- Concurrent lock handling requires Redis lock check — ~2ms per request.
- Warning header injection on near-expiry keys requires TTL check — O(1).

## Security Considerations

- Never include stored request payload in conflict error responses (PII/sensitive data leak).
- Key prefixes logged, not full keys, for PII reasons.
- Error messages must not reveal internal implementation details or store topology.
- Rate limit idempotency error responses to prevent abuse-driven log flooding.

## Common Mistakes

- Returning same error code for all idempotency failures (cannot distinguish conflict from expiration).
- Including stored request payload in conflict error responses (security / PII leak).
- Not setting Retry-After on concurrent-lock responses (consumers retry immediately).
- Using 400 for all idempotency issues (conflict is semantically different from invalid).
- Not handling store-down gracefully (500 errors cascade to consumers).

## Anti-Patterns

- **Error response loop**: Consumer receives conflict, changes payload, retries same key -> same conflict. Document that new key required for different payloads.
- **No resolution guidance**: Error messages that say what's wrong but not what to do about it.
- **Generic error message**: All idempotency errors return "Idempotency error" with no distinguishing code.

## Examples

- Conflict response: `HTTP 409 { "error": { "code": "IDEMPOTENCY_CONFLICT", "message": "Request payload differs from original request with this idempotency key.", "resolution": "Use a new idempotency key for different payloads." } }`.
- Concurrent lock: `HTTP 409 Retry-After: 1 { "error": { "code": "CONCURRENT_REQUEST_LOCK", "message": "Another request with this key is being processed.", "resolution": "Retry after the specified Retry-After period." } }`.

## Related Topics

- **Prerequisites**: Idempotency Key Design, Idempotency Key TTL Expiration
- **Closely Related**: Backward Compatibility Policy, API Style Guide Documentation
- **Advanced**: Consumer-side idempotency error handling SDK, Idempotency error analytics dashboard, Webhook idempotency error notification

## AI Agent Notes

When implementing idempotency error handling: return unique error codes per scenario, use semantic HTTP status codes (409 conflict, 422 invalid/missing, 503 store down), include Retry-After on concurrent locks, provide resolution steps in error body, never leak stored payloads in errors, log key prefixes not full keys.

## Verification

Sources: Stripe idempotency error format, Twilio structured errors, Shopify retry_after_ms field, domain-analysis.md.
