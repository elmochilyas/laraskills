# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Tracking Integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Tracking Integration implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Tracking Integration
- [ ] Full test coverage for Error Tracking Integration
- [ ] Security review completed for Error Tracking Integration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Tracking Integration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Register error tracking in `Handler::register()` via `reportable()` callbacks.
- [ ] Enrich scope with error code, domain, user ID, request ID, and trace ID.
- [ ] Filter expected exceptions (Authentication, Validation) from tracking to reduce noise.
- [ ] Set release version from `APP_VERSION` or git SHA at deploy time.
- [ ] Move event sending to a queued job to avoid blocking the response.
- [ ] Configure Sentry "Inbound Filters" to ignore known noisy exceptions.
- [ ] Set up Sentry alerts: P1 on new error types, P2 on error count spike.

---

# Implementation Checklist

- [ ] Tracking SDK installed and configured
- [ ] DSN configured per environment
- [ ] Structured context added to reports
- [ ] Breadcrumbs added for key operations
- [ ] User context included (where available)
- [ ] Sensitive data filtered before sending
- [ ] Alerting configured on thresholds
- [ ] Errors grouped by code/class for trends
- [ ] Implement Error Tracking Integration following error-handling-design patterns
- [ ] Configure all required settings for Error Tracking Integration
- [ ] Register route/middleware/service for Error Tracking Integration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Context enrichment adds < 0.1ms per exception.
- [ ] Async sending (queue) moves HTTP call overhead off the request thread.
- [ ] Breadcrumb collection adds slight overhead per DB/HTTP call â€” sample in high-throughput endpoints.
- [ ] Sentry SDK is lazy-loaded â€” no memory impact until an exception occurs.
- [ ] Queue failures (Sentry down) should not impact application availability.

---

# Security Checklist

- [ ] Never send PII (email, name, IP) in user context â€” user ID only.
- [ ] Configure Sentry data scrubbing for server-side redaction.
- [ ] Ensure error tracking data retention complies with GDPR/CCPA.
- [ ] Review context sent to third-party tracking â€” it may include sensitive data.
- [ ] Do not send raw request bodies or session data to tracking services.
- [ ] Audit tracking payloads regularly for accidental PII inclusion.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Error tracking is registered via `reportable()` callback in the handler
- [ ] Operational exceptions (401, 403, 422) are filtered/sampled
- [ ] Event scope is enriched with error_code, domain, user_id (not PII), trace_id
- [ ] Release version is set from APP_VERSION or git SHA
- [ ] Event sending is queued (async)
- [ ] Sentry data scrubbing is configured for server-side redaction
- [ ] Integration tests verify tracking is called for programmer errors but not for operational errors
- [ ] Write feature tests for happy path of Error Tracking Integration
- [ ] Write feature tests for validation failure of Error Tracking Integration
- [ ] Write feature tests for authentication failure of Error Tracking Integration
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

- [ ] Avoid: Tracking All 401/403 Errors
- [ ] Avoid: Including PII in User Context
- [ ] Avoid: No Release Tag
- [ ] Avoid: Synchronous Sending
- [ ] Avoid: Failing Open When Sentry Is Down

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
- Register Error Tracking via reportable() Callbacks
- Filter High-Volume Operational Exceptions from Tracking
- Tag Every Error Event with Error Code and Domain
- Set Release Version for Deploy Tracking
- Attach User ID, Never PII, to Tracking Events
- Always Queue Error Tracking Events Asynchronously
- Never Send Raw Request Bodies or Session Data to Tracking
- Configure Server-Side Data Scrubbing in Tracking Service
- Monitor Error Tracking Budget and Set Event Rate Limits

### Anti-Patterns
- Tracking All 401/403 Errors
- Including PII in User Context
- No Release Tag
- Synchronous Sending
- Failing Open When Sentry Is Down

## Related Knowledge
- Global Exception Handler Config (where integration hooks in)
- Sensitive Data Leak Prevention (context must be sanitised before sending)
- Error Logging Context (structured logging complements tracking)
- Production vs Dev Error Detail (environment-specific tracking behaviour)
- CI/CD release tagging



