# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Logging Context
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Logging Context implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Logging Context
- [ ] Full test coverage for Error Logging Context
- [ ] Security review completed for Error Logging Context
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Logging Context
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Set trace ID via middleware at request start using `Log::withContext()`.
- [ ] Override `Handler::context()` to add system-level context automatically.
- [ ] Custom exception constructors accept `$context` for business-specific data.
- [ ] Apply redaction (KU-16) to context before logging.
- [ ] Use a structured log driver for JSON output.
- [ ] Include context in error tracking events (Sentry `setExtra()`).
- [ ] Reset context at job start for queue workers (prevents cross-job context leak).

---

# Implementation Checklist

- [ ] Exception handler context() overridden
- [ ] request_id in log context
- [ ] user_id in log context
- [ ] url and method in log context
- [ ] IP in log context
- [ ] Sensitive fields excluded
- [ ] JSON format configured
- [ ] Log format tested
- [ ] Implement Error Logging Context following error-handling-design patterns
- [ ] Configure all required settings for Error Logging Context
- [ ] Register route/middleware/service for Error Logging Context
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `Log::withContext()` stores data in memory for the request â€” minimal impact.
- [ ] Context array serialisation is O(n) on fields; keep < 50 fields.
- [ ] JSON log formatting adds 0.05ms per line â€” negligible.
- [ ] Avoid logging large objects (file uploads, raw request bodies) in context.
- [ ] Log level sampling for high-throughput endpoints in production.

---

# Security Checklist

- [ ] Never include `$request->all()` in context (includes passwords, tokens).
- [ ] Sanitise business context before logging (KU-16).
- [ ] Mask IP addresses if GDPR required.
- [ ] Ensure log files are not publicly accessible.
- [ ] Apply retention policies to log data containing PII.
- [ ] Do not log raw request bodies â€” they may contain PII.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Trace ID middleware sets `Log::withContext()` at request start
- [ ] `Handler::context()` enriches all logs with trace_id, user_id, request_id, url, method, ip
- [ ] Log driver is structured (JSON) for aggregation tool compatibility
- [ ] No `$request->all()` calls in log context creation
- [ ] Business context is added via exception $context, not manual log calls
- [ ] Context size is limited (50 fields, 100KB)
- [ ] Context is sanitised for sensitive data before logging
- [ ] Queue workers reset context between jobs
- [ ] Write feature tests for happy path of Error Logging Context
- [ ] Write feature tests for validation failure of Error Logging Context
- [ ] Write feature tests for authentication failure of Error Logging Context
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

- [ ] Avoid: Logging Same Data in Multiple Places
- [ ] Avoid: Unstructured Log Messages
- [ ] Avoid: Logging Sensitive Data
- [ ] Avoid: Logging in Exception Constructors
- [ ] Avoid: No Context Reset in Queue Workers

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
- Always Set Trace ID Context at Middleware Level
- Override Handler::context() for System-Level Enrichment
- Never Include $request->all() or Full Request Bodies in Context
- Add Business Context at Throw Site via Exception $context
- Use Structured Log Driver for JSON Output
- Limit Context Size to 50 Fields and 100KB
- Redact Sensitive Data Before Logging
- Reset Log Context in Queue Workers Between Jobs
- Never Log in Exception Constructors

### Anti-Patterns
- Logging Same Data in Multiple Places
- Unstructured Log Messages
- Logging Sensitive Data
- Logging in Exception Constructors
- No Context Reset in Queue Workers

## Related Knowledge
- Global Exception Handler Config (where context() method lives)
- Sensitive Data Leak Prevention (sanitising context before logging)
- Error Tracking Integration (Sentry context enrichment)
- Server Error Responses (trace ID correlation)
- Middleware design for trace ID propagation



