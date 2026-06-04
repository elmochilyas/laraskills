# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Deprecation Notes in Docs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deprecation Notes in Docs implementation follows api-documentation patterns
- [ ] All edge cases handled for Deprecation Notes in Docs
- [ ] Full test coverage for Deprecation Notes in Docs
- [ ] Security review completed for Deprecation Notes in Docs
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Deprecation Notes in Docs

---

# Architecture Checklist

- [ ] `deprecated: true` on operation level for deprecated endpoints.
- [ ] `deprecated: true` on schema property level for deprecated fields (OpenAPI 3.1+).
- [ ] Description field contains the structured deprecation notice.
- [ ] In Scramble, use PHP 8.4 `#[Deprecated]` attribute or `@deprecated` PHPDoc.
- [ ] In Scribe, use `@deprecated` in controller doc blocks.
- [ ] Evaluate: Deprecation Announcement Channel â€” Headers vs Docs-Only vs Both
- [ ] Evaluate: Deprecation Timeline Enforcement â€” Soft vs Hard Removal
- [ ] Evaluate: Deprecated Endpoint Lifecycle â€” Keep vs Remove After Sunset

---

# Implementation Checklist

- [ ] `deprecated: true` flag set on deprecated operations and schema properties
- [ ] Structured notice in description: what, replacement, version, removal date
- [ ] Deprecation and Sunset headers in API responses from deprecated endpoints
- [ ] Migration link header present
- [ ] Deprecated endpoint usage logged with consumer identification
- [ ] Consumer notification process active before removal date
- [ ] Endpoint returns 410 Gone on sunset date (not removed silently)
- [ ] Implement Deprecation Notes in Docs following api-documentation patterns
- [ ] Configure all required settings for Deprecation Notes in Docs
- [ ] Register route/middleware/service for Deprecation Notes in Docs
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Deprecation headers add minimal overhead to response size.
- [ ] No runtime performance impact from documentation notes.

---

# Security Checklist

- [ ] Deprecated endpoints may have known security issues â€” document replacement clearly to discourage continued use.
- [ ] Sunset old auth mechanisms with migration path documented.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Deprecation Notes in Docs
- [ ] Write feature tests for validation failure of Deprecation Notes in Docs
- [ ] Write feature tests for authentication failure of Deprecation Notes in Docs
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Always Set The OpenAPI `deprecated: true` Flag
- Include Structured Deprecation Notice In Description
- Send Deprecation And Sunset Headers In Responses
- Log Deprecated Endpoint Usage And Notify Consumers
- Never Remove A Deprecated Endpoint Before The Stated Sunset Date

### Decisions
- Deprecation Announcement Channel â€” Headers vs Docs-Only vs Both
- Deprecation Timeline Enforcement â€” Soft vs Hard Removal
- Deprecated Endpoint Lifecycle â€” Keep vs Remove After Sunset

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



