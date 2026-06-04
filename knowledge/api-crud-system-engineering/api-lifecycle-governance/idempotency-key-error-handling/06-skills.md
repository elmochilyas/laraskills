# Skill: Handle Idempotency Key Errors

## Purpose
Implement structured error responses for idempotency failures with unique error codes per scenario, semantic HTTP status codes, Retry-After headers on concurrent locks, resolution steps in error bodies, and secure logging of key prefixes only.

## When To Use
- Every idempotency-protected endpoint
- Error responses for consumer-facing APIs
- Developer portal error documentation

## When NOT To Use
- Internal-only endpoints without idempotency
- Non-idempotent endpoints

## Prerequisites
- Idempotency key design implemented
- Custom exception handling infrastructure
- Error response format standardized

## Inputs
- Idempotency error scenarios (missing key, conflict, expired, store down, concurrent lock)
- Error code namespace
- Error response envelope format

## Workflow
1. Return unique error codes per idempotency scenario: `IDEMPOTENCY_KEY_MISSING`, `IDEMPOTENCY_CONFLICT`, `IDEMPOTENCY_EXPIRED`, `IDEMPOTENCY_STORE_UNAVAILABLE`, `CONCURRENT_REQUEST_LOCK`
2. Use HTTP 409 for payload conflicts (different payload, same key), 422 for missing/invalid keys, 503 for store unavailable
3. Include `Retry-After` header (default 500ms-1s) on CONCURRENT_REQUEST_LOCK responses
4. Never include stored request payload or response data in conflict error responses
5. Include a `resolution` field in every idempotency error response explaining the consumer action
6. Log only key prefixes (consumer prefix), never full keys, to logs or error tracking
7. Add Warning header when key is within 10% of TTL expiration to alert consumers

## Validation Checklist
- [ ] Unique error codes per idempotency failure scenario
- [ ] Semantic HTTP status codes (409 conflict, 422 invalid, 503 store down)
- [ ] Retry-After header on CONCURRENT_REQUEST_LOCK responses
- [ ] No stored payload leaked in conflict responses
- [ ] Resolution field in every error response
- [ ] Only key prefixes logged, never full keys
- [ ] Warning header for near-expiry keys

## Common Failures
- Returning same error code for all idempotency failures
- Including stored request payload in conflict responses (PII leak)
- Not setting Retry-After on concurrent-lock responses
- Using 400 for all idempotency issues (conflict ≠ validation)
- Not handling store-down gracefully (500 errors cascade)

## Decision Points
- Retry-After duration: 500ms default vs consumer-specific vs exponential backoff hint
- Warning threshold: 10% of TTL vs specific remaining time (e.g., 1 hour)
- Error format: RFC 9457 Problem Details vs custom envelope vs JSON:API errors

## Performance Considerations
- Error response generation adds no measurable overhead
- Concurrent lock handling via Redis check ~2ms per request
- Warning header injection on near-expiry O(1)

## Security Considerations
- Never include stored request payload in conflict error responses
- Log key prefixes not full keys for PII reasons
- Error messages must not reveal internal implementation details
- Rate limit idempotency error responses to prevent abuse-driven log flooding

## Related Rules
- Return Unique Error Codes Per Idempotency Scenario
- Use HTTP 409 for Payload Conflicts, 422 for Validation Errors
- Include Retry-After Header on Concurrent Lock Responses
- Never Include Stored Payload in Conflict Error Responses
- Provide Resolution Steps in Every Error Response
- Log Key Prefixes, Not Full Keys
- Add Warning Header for Near-Expiry Keys

## Related Skills
- Implement Idempotency Key Design
- Manage Idempotency Key TTL Expiration
- Design Error Response Envelope

## Success Criteria
- Each idempotency failure returns a unique, distinguishable error code
- HTTP status codes are semantically correct per scenario
- Concurrent lock responses include Retry-After header
- Conflict responses do not leak stored payload data
- Error responses include resolution guidance for consumers
- Full idempotency keys never appear in logs
- Near-expiry replays include Warning header
