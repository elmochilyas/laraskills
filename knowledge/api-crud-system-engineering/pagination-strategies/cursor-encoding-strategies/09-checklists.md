# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Cursor Encoding Strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Cursor Encoding Strategies implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Cursor Encoding Strategies
- [ ] Full test coverage for Cursor Encoding Strategies
- [ ] Security review completed for Cursor Encoding Strategies
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cursor Encoding Strategies
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Prefer Laravel's built-in cursor encoding (`Illuminate\Pagination\Cursor`) for consistency and automatic handling.
- [ ] For custom encoding, create a dedicated `CursorEncoder` class with `encode()` and `decode()` methods, isolating encoding logic from pagination logic.
- [ ] Support both old and new cursor formats during migration periods by checking the version field and dispatching to the appropriate decoder.
- [ ] Use a try-catch around cursor decode operations; return HTTP 400 with a clear message for malformed cursors, never exposing internal error details.
- [ ] For APIs with multiple clients, choose the encoding strategy that satisfies the most restrictive client's security requirements.
- [ ] Evaluate: Cursor Encoding Strategy Selection
- [ ] Evaluate: Cursor Versioning Decision

---

# Implementation Checklist

- [ ] Cursor payload is JSON â†’ base64url â†’ (optionally HMAC-signed)
- [ ] Decoded cursor is validated against an allowed-column whitelist
- [ ] Tampered cursor (invalid HMAC, malformed JSON) returns 400 error
- [ ] Sorting direction is encoded in and decoded from the cursor
- [ ] Cursor does not expose raw DB column names in readable form
- [ ] Encoding/decoding is handled by a dedicated Cursor class or service
- [ ] Implement Cursor Encoding Strategies following pagination-strategies patterns
- [ ] Configure all required settings for Cursor Encoding Strategies
- [ ] Register route/middleware/service for Cursor Encoding Strategies
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Encode/decode overhead is negligible for all strategies (<0.1ms) compared to database query time (1â€“100ms).
- [ ] Base64 JSON and binary encoding produce deterministic cursors, enabling response caching at CDN and reverse proxy layers.
- [ ] Encrypted cursors produce unique values per encoding (due to IV/nonce), making response caching impossible.
- [ ] Cursor size impacts URL length for GET requests; very large cursors (300+ chars) may approach 2048-char URL limits in some clients and proxies.
- [ ] Binary encoding is fastest (~0.001ms encode/decode) but least debuggable; reserved for high-throughput, bandwidth-sensitive endpoints.

---

# Security Checklist

- [ ] **Tampering**: Plain base64 cursors can be decoded and modified by clients. Use HMAC signing to detect manipulation or encryption to prevent it.
- [ ] **Exposure**: Cursor values may reveal internal record IDs, timestamps, or ordering. If the sort order or record count is sensitive, encrypt the cursor or use opaque values.
- [ ] **Enumeration**: Sequential or predictable cursors enable clients to enumerate all records. Use opaque tokens or include multiple fields to prevent enumeration.
- [ ] **Logging**: Log cursor decode failure rates; a spike may indicate client bugs, CSRF/enumeration attacks, or format mismatch after deployment.
- [ ] **Key Management**: Rotate encryption keys periodically. Maintain previous keys in a key ring for a grace period to avoid breaking in-flight cursors.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Encode/decode round-trip works correctly for all cursor field types (int, string, datetime, uuid)
- [ ] Invalid/malformed cursors return HTTP 400 with clear error message, not 500
- [ ] Tampered signed cursors are detected and rejected (400 response)
- [ ] Encrypted cursors with expired/rotated keys return appropriate error
- [ ] Cursor versioning allows coexistence of old and new formats during migration
- [ ] URL encoding of cursors in query strings handles special characters (=, &, +)
- [ ] Maximum cursor size does not exceed documented limit (256 chars recommended)
- [ ] No sensitive data (PII, credentials, roles) is present in decoded cursor contents
- [ ] Write feature tests for happy path of Cursor Encoding Strategies
- [ ] Write feature tests for validation failure of Cursor Encoding Strategies
- [ ] Write feature tests for authentication failure of Cursor Encoding Strategies
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

- [ ] Avoid: Sequential Integers as Cursors
- [ ] Avoid: Encryption Applied to All Cursors
- [ ] Avoid: Mixing Encoding Strategies Without Documentation
- [ ] Avoid: Relying on Client to Preserve Cursor Integrity
- [ ] Avoid: Unversioned Cursor Formats

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
- Version Cursors From Day One
- Keep Cursors Opaque to Clients
- Never Encode Sensitive Data in Base64 Cursors
- Sign for Integrity, Encrypt Only When Necessary
- Use Laravel's Built-in Cursor Encoding by Default
- Isolate Custom Encoding Behind a Dedicated Service Class
- Encode Only Sort Column Values, Not Full Records
- Include a Key Identifier When Using Encryption
- Handle Decode Failures Gracefully With 400 Responses
- Keep Cursor Size Under 256 Characters

### Decisions
- Cursor Encoding Strategy Selection
- Cursor Versioning Decision

### Anti-Patterns
- Sequential Integers as Cursors
- Encryption Applied to All Cursors
- Mixing Encoding Strategies Without Documentation
- Relying on Client to Preserve Cursor Integrity
- Unversioned Cursor Formats

## Related Knowledge
- Cursor Pagination Design â€” Where cursors are used and how they drive API pagination
- API Security â€” Token handling, encryption, key management
- Multi-Column Cursor Pagination â€” Composite cursor contents for multi-column sorts



