# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Server Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Server Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Server Error Responses
- [ ] Full test coverage for Server Error Responses
- [ ] Security review completed for Server Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Server Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Generate a UUID trace ID per 500 response (not reused from request ID).
- [ ] Log full exception with trace_id, stack trace, and request context before rendering.
- [ ] Classify by exception type for infrastructure-specific codes (DB vs queue vs HTTP).
- [ ] Wrap render method in try/catch with hardcoded fallback (prevent error-during-error-handling).
- [ ] Configure async log channels (daily, syslog) to avoid blocking the response.
- [ ] Include trace_id in log aggregation tool (Sentry, ELK, CloudWatch).
- [ ] Health check endpoints should treat 500 as unhealthy node signal.

---

# Implementation Checklist

- [ ] Fallback renderable registered for unhandled Throwable
- [ ] Production 500 responses contain only generic safe message
- [ ] Debug mode includes full exception detail
- [ ] Full exception logged to log channels
- [ ] Error tracking receives server errors
- [ ] No config or env values in responses
- [ ] Server error tested in both modes
- [ ] Implement Server Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Server Error Responses
- [ ] Register route/middleware/service for Server Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] UUID generation and logging are the primary cost â€” roughly 1â€“2ms per 500 response.
- [ ] Avoid sending alert notifications from within the render method (circular dependency risk).
- [ ] Rate-limit log writes within the error handler to prevent log overflow during error bursts.
- [ ] Limit context size passed to logger to prevent memory exhaustion.

---

# Security Checklist

- [ ] Never include stack traces, file paths, or SQL in any part of the response.
- [ ] Never include `$_ENV`, `$_SERVER`, or configuration values in error responses.
- [ ] Never expose third-party API keys or service endpoints in error messages.
- [ ] Ensure the trace ID is a random UUID, not sequential â€” prevents request enumeration.
- [ ] Rate-limit error response production to prevent error flooding from exhausting response workers.
- [ ] PCI DSS Section 6.5.5 requires secure error handling â€” no sensitive data in responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 500 responses contain `detail.trace_id` (UUID)
- [ ] No stack traces, file paths, or SQL appear in any 500 response
- [ ] A catch-all Throwable renderable is registered as last fallback
- [ ] 500 render method is wrapped in try/catch with hardcoded fallback
- [ ] Log entries for 500s include trace_id, user, URL, method, and full exception
- [ ] Infrastructure-specific error codes resolve correctly (DB, queue, third-party)
- [ ] Integration tests with APP_DEBUG=false verify no sensitive data in 500 responses
- [ ] Write feature tests for happy path of Server Error Responses
- [ ] Write feature tests for validation failure of Server Error Responses
- [ ] Write feature tests for authentication failure of Server Error Responses
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

- [ ] Avoid: Returning Different 500 Shapes Per Endpoint
- [ ] Avoid: Including Exception Class Name in Response
- [ ] Avoid: Logging After Sending the Response
- [ ] Avoid: Reusing X-Request-ID as Trace ID
- [ ] Avoid: Detailed Error Messages in Staging

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
- Always Include a Trace ID in Every 500 Response
- Never Include Stack Traces, File Paths, or SQL in 500 Responses
- Use Infrastructure-Specific Error Codes for Known Failure Modes
- Register a Throwable Fallback as the Last Renderable Callback
- Wrap the 500 Render Method in Try/Catch with Hardcoded Fallback
- Log Full Exception Details Before Rendering the Response
- Use a UUID Trace ID â€” Never Sequential or Request ID
- Force application/json Content-Type on 500 Responses

### Anti-Patterns
- Returning Different 500 Shapes Per Endpoint
- Including Exception Class Name in Response
- Logging After Sending the Response
- Reusing X-Request-ID as Trace ID
- Detailed Error Messages in Staging

## Related Knowledge
- Production vs Dev Error Detail (dev mode response difference)
- Sensitive Data Leak Prevention (complementary security)
- Error Tracking Integration (trace ID correlation)
- Global Exception Handler Config (where 500 rendering is configured)
- Error Type Taxonomy (500 = programmer + infrastructure)



