# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Sensitive Data Leak Prevention
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sensitive Data Leak Prevention implementation follows error-handling-design patterns
- [ ] All edge cases handled for Sensitive Data Leak Prevention
- [ ] Full test coverage for Sensitive Data Leak Prevention
- [ ] Security review completed for Sensitive Data Leak Prevention
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sensitive Data Leak Prevention
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Implement `SanitiseExceptionContext` class that recursively redacts sensitive keys.
- [ ] Register log processor that redacts known patterns (`password`, `token`, `secret`, `credit_card`).
- [ ] Apply sanitisation in the exception handler before building the response.
- [ ] Strip HTML/JS from error messages to prevent XSS.
- [ ] Never log raw request bodies â€” they often contain PII.
- [ ] Configure Sentry "Data Scrubbing" for server-side redaction.
- [ ] Add CI test: throw exception with known sensitive keys and assert they are redacted.

---

# Implementation Checklist

- [ ] Sensitive data types identified and documented
- [ ] Exception context scrubbed of sensitive fields
- [ ] Exception messages sanitized
- [ ] Error tracking SDK scrubs sensitive data
- [ ] `$_SERVER`, `$_ENV`, config never in responses
- [ ] SQL queries never in responses
- [ ] Full context logged to secure storage only
- [ ] Tests verify no sensitive data in responses
- [ ] Implement Sensitive Data Leak Prevention following error-handling-design patterns
- [ ] Configure all required settings for Sensitive Data Leak Prevention
- [ ] Register route/middleware/service for Sensitive Data Leak Prevention
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Context sanitisation is O(n) on context keys (n < 20 typically).
- [ ] Regex-based PII detection is slower â€” use only on message strings, not context.
- [ ] Log processor overhead adds ~0.1ms per log entry.
- [ ] Use an allowlist cache (static array) for dev mode to avoid re-computation.
- [ ] Redaction is not on the hot path (only runs for error responses).

---

# Security Checklist

- [ ] Never store sensitive values in exception context â€” they may be logged and tracked.
- [ ] Redaction is a safety net, not primary defence â€” train developers to never include sensitive data.
- [ ] Ensure redaction patterns cover all known sensitive keys.
- [ ] Test redaction with fuzzing â€” throw errors with random context and verify no leak.
- [ ] PII detection should cover emails, phone numbers, credit card numbers, and SSNs.
- [ ] GDPR requires that PII in error contexts be subject to data retention policies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Exception context is sanitised before response rendering
- [ ] Log channel configuration includes redaction processor
- [ ] No `$request->all()` calls in exception context creation
- [ ] Sensitive key patterns (`password`, `token`, `secret`, `credit_card`) are redacted
- [ ] Stack traces have server paths stripped
- [ ] Error tracking service (Sentry/Flare) has data scrubbing configured
- [ ] CI test verifies sensitive data is redacted from error responses
- [ ] Quarterly audit of error logs for leaked sensitive data
- [ ] Write feature tests for happy path of Sensitive Data Leak Prevention
- [ ] Write feature tests for validation failure of Sensitive Data Leak Prevention
- [ ] Write feature tests for authentication failure of Sensitive Data Leak Prevention
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

- [ ] Avoid: Including $request->all() in Context
- [ ] Avoid: Only Redacting at One Layer
- [ ] Avoid: Blacklist-Based Redaction
- [ ] Avoid: SQL Bindings in Log Messages
- [ ] Avoid: Not Sanitising Third-Party Packages

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
- Never Include Sensitive Data in Exception Context at the Source
- Apply Layered Defence â€” Source, Handler, and Log Redaction
- Implement Global Key-Name Redaction for Context Arrays
- Strip Server Paths from Stack Traces Before Logging
- Never Log Raw Request Bodies
- Apply Redaction Globally in Log Channel Configuration
- Use Allowlist for Dev Mode Debug Output
- Test Redaction with Automated CI Tests
- Audit Error Logs Quarterly for Sensitive Data Patterns

### Anti-Patterns
- Including $request->all() in Context
- Only Redacting at One Layer
- Blacklist-Based Redaction
- SQL Bindings in Log Messages
- Not Sanitising Third-Party Packages

## Related Knowledge
- Server Error Responses (the safe output baseline)
- Production vs Dev Error Detail (dev mode expands what must be sanitised)
- Error Logging Context (context must be sanitised before logging)
- Error Tracking Integration (Sentry/Flare data scrubbing)
- PII compliance (GDPR, CCPA, HIPAA)



