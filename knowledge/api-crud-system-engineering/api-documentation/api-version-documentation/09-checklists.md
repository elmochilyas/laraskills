# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** API Version Documentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API Version Documentation implementation follows api-documentation patterns
- [ ] All edge cases handled for API Version Documentation
- [ ] Full test coverage for API Version Documentation
- [ ] Security review completed for API Version Documentation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API Version Documentation

---

# Architecture Checklist

- [ ] Organize specs per version in `docs/openapi-v1.yaml`, `docs/openapi-v2.yaml`.
- [ ] Each spec has its own `info.version` and `info.description` noting status.
- [ ] For URL versioning, server URL includes version prefix (`https://api.example.com/v2`).
- [ ] Generate per-version docs with environment-specific commands: `APP_ENV=docs-v1 php artisan scribe:generate`.
- [ ] Redirect unversioned docs to the latest stable version.
- [ ] Evaluate: Spec Organization â€” Separate Files Per Version vs Single Multi-Version Spec
- [ ] Evaluate: Version Status Documentation â€” Active vs Deprecated Presentation

---

# Implementation Checklist

- [ ] Separate OpenAPI spec file per version
- [ ] Version discovery endpoint returning all versions
- [ ] Status badges with visual distinction (green/yellow/red)
- [ ] Version comparison table published
- [ ] Root docs URL redirects to latest stable version
- [ ] Auth requirements documented per version
- [ ] Sunset version docs preserved (read-only, no interactive features)
- [ ] CI validates all version specs on PR
- [ ] Implement API Version Documentation following api-documentation patterns
- [ ] Configure all required settings for API Version Documentation
- [ ] Register route/middleware/service for API Version Documentation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Multiple spec files increase build time proportionally. No runtime impact.
- [ ] Spec file size grows with each version archived. Consider storing old specs in separate storage.

---

# Security Checklist

- [ ] Sunset version docs should remove interactive "try it out" features to prevent accidental usage.
- [ ] Version history may expose past security vulnerabilities. Review before publishing historical docs.
- [ ] Authentication requirements may differ across versions â€” document each version's auth.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of API Version Documentation
- [ ] Write feature tests for validation failure of API Version Documentation
- [ ] Write feature tests for authentication failure of API Version Documentation
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
- Separate Spec Files Per Version
- Always Expose A Version Discovery Endpoint
- Visually Distinguish Active From Deprecated Versions
- Architecture
- Never Remove Sunset Version Docs
- Publish A Version Comparison Table
- Redirect Unversioned Docs To Latest Stable Version
- Document Auth Requirements Per Version

### Decisions
- Spec Organization â€” Separate Files Per Version vs Single Multi-Version Spec
- Version Status Documentation â€” Active vs Deprecated Presentation

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



