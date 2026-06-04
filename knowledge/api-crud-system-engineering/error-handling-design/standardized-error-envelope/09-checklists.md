# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Standardized Error Envelope
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Standardized Error Envelope implementation follows error-handling-design patterns
- [ ] All edge cases handled for Standardized Error Envelope
- [ ] Full test coverage for Standardized Error Envelope
- [ ] Security review completed for Standardized Error Envelope
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Standardized Error Envelope
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define an `ErrorEnvelope` readonly DTO with `code`, `message`, `status`, and optional `detail`.
- [ ] Serialize via a dedicated `ErrorResource` or `JsonResponse` for consistent output.
- [ ] Implement a `HasErrorEnvelope` trait on exception base classes returning `toEnvelope(): ErrorEnvelope`.
- [ ] Add middleware wrapping for uncaught exceptions to ensure envelope compliance.
- [ ] Configure `Content-Type: application/problem+json` (RFC 7807) for standards alignment.
- [ ] Never include exception class, file, line, or stack trace in the envelope.
- [ ] Rate-limit error response production to prevent error flooding from exhausting response workers.

---

# Implementation Checklist

- [ ] All error responses use `{ error: { code, message, status, detail? } }` structure
- [ ] ErrorEnvelope implemented as typed readonly DTO class
- [ ] `error` is top-level key (no fields outside it)
- [ ] Status code duplicated in envelope body
- [ ] `detail` omitted when null (not sent as `detail: null`)
- [ ] No `success: false` or similar redundant fields
- [ ] All renderable callbacks guarded by `expectsJson()`
- [ ] Envelope shape identical in dev and production
- [ ] Common envelopes (401, 403, 404) pre-built as cached constants
- [ ] Implement Standardized Error Envelope following error-handling-design patterns
- [ ] Configure all required settings for Standardized Error Envelope
- [ ] Register route/middleware/service for Standardized Error Envelope
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Envelope serialisation overhead is negligible (< 0.01ms).
- [ ] Pre-serialize common error envelopes as constants or cached closures.
- [ ] For rare errors, construct on-demand â€” the allocation cost is acceptable.
- [ ] Avoid logging within the envelope construction path (logging should happen in the handler).

---

# Security Checklist

- [ ] Never include stack traces, file paths, SQL queries, or internal variable values.
- [ ] Strip sensitive keys from detail (passwords, tokens, PII) before serialization.
- [ ] Do not echo submitted values in validation error messages that could leak PII.
- [ ] Ensure the envelope shape is identical in dev and production â€” only add a separate `debug` key in dev.
- [ ] Use a consistent envelope across all endpoints to prevent information leakage via shape differences.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every error response across all endpoints uses the exact same envelope structure
- [ ] The envelope contains only: `code`, `message`, `status`, and optional `detail`
- [ ] No stack trace, file path, or SQL appears in any envelope field
- [ ] Common envelopes (401, 403, 404) are pre-built and cached
- [ ] All renderable callbacks in the handler are guarded by `$request->expectsJson()`
- [ ] The `error` key is always top-level; no extra keys outside it
- [ ] Integration tests verify envelope shape for every error scenario
- [ ] Write feature tests for happy path of Standardized Error Envelope
- [ ] Write feature tests for validation failure of Standardized Error Envelope
- [ ] Write feature tests for authentication failure of Standardized Error Envelope
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: Different Envelope Per Endpoint
- [ ] Avoid: Nested Error Inside Data
- [ ] Avoid: Raw ValidationException Output
- [ ] Avoid: Including Stack Traces in Dev-Only
- [ ] Avoid: Envelope as Associative Array

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Use error as the Top-Level Key
- Keep Envelope Fields Immutable â€” Code, Message, Status, Detail
- Use a Typed DTO Class for the Envelope
- Duplicate the HTTP Status Code in the Envelope Body
- Keep detail Optional â€” Omit When Empty
- Never Include success: false or Similar Redundant Fields
- Guard All Envelope-Producing Callbacks with expectsJson()
- Pre-Build Common Envelopes as Cached Constants
- Never Modify the Envelope Shape in Different Environments

### Anti-Patterns
- Different Envelope Per Endpoint
- Nested Error Inside Data
- Raw ValidationException Output
- Including Stack Traces in Dev-Only
- Envelope as Associative Array

## Related Knowledge
- Error Type Taxonomy (classifies what goes into the envelope)
- Domain-Specific Error Codes (the `code` field in the envelope)
- RFC 9457 Problem Details (alternative envelope standard)
- Server Error Responses (safe production envelope)
- Validation Error Shape Design (detail sub-shape for 422)



