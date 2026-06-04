# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Scribe Integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Scribe Integration implementation follows api-documentation patterns
- [ ] All edge cases handled for Scribe Integration
- [ ] Full test coverage for Scribe Integration
- [ ] Security review completed for Scribe Integration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Scribe Integration

---

# Architecture Checklist

- [ ] Documentation is a build artifact, not a runtime resource. Add `php artisan scribe:generate` to deployment pipeline after migrations.
- [ ] Static HTML can be served by Laravel's public directory or copied to a CDN/developer portal.
- [ ] Annotations and inferred rules (when Form Request inference enabled): Scribe prioritizes annotations over inferred rules for a given field.
- [ ] CI pipeline must regenerate docs on every deployment. Consider excluding `public/docs/` from version control.
- [ ] Evaluate: Generation Mode â€” Extract vs Call
- [ ] Evaluate: Documentation Hosting â€” Static Files vs Dedicated Service

---

# Implementation Checklist

- [ ] Scribe installed and configured with `config/scribe.php`
- [ ] Every public controller method has `@group` annotation
- [ ] Request body parameters documented with `@bodyParam`
- [ ] Success responses documented with `@response`
- [ ] Error responses documented with `@response status=4xx`
- [ ] Auth configured for call mode generation
- [ ] Demo data seeder available for call mode
- [ ] Generation runs in CI/local only (never production)
- [ ] Annotation updates required in code review checklist
- [ ] Implement Scribe Integration following api-documentation patterns
- [ ] Configure all required settings for Scribe Integration
- [ ] Register route/middleware/service for Scribe Integration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Extract mode: 5-15 seconds for 100 endpoints. Call mode: 30-60 seconds (depends on endpoint response times).
- [ ] Call mode executes real controller logic and database queries. Use dedicated testing database.
- [ ] Generated HTML docs for 100 endpoints: 2-5 MB (HTML, CSS, JS).

---

# Security Checklist

- [ ] Generated docs expose full API surface. Protect the `/docs` route or restrict access to the generated files.
- [ ] Never run call mode on production â€” test requests execute against live data.
- [ ] Configure test tokens in scribe.php; ensure they have limited permissions.
- [ ] Review generated docs before deployment for accidental internal endpoint exposure.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Scribe Integration
- [ ] Write feature tests for validation failure of Scribe Integration
- [ ] Write feature tests for authentication failure of Scribe Integration
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
- Annotate Every Public Controller Method With @group
- Document Error Responses Explicitly With @response Status
- Seed Database Before Running Call Mode Generation
- Configure Auth In scribe.php For Call Mode
- Never Run Call Mode Against Production
- Keep Annotations In Sync With Code During Code Review

### Decisions
- Generation Mode â€” Extract vs Call
- Documentation Hosting â€” Static Files vs Dedicated Service

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



