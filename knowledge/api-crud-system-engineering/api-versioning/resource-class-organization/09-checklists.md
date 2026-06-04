# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Resource Class Organization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Resource Class Organization implementation follows api-versioning patterns
- [ ] All edge cases handled for Resource Class Organization
- [ ] Full test coverage for Resource Class Organization
- [ ] Security review completed for Resource Class Organization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Resource Class Organization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Resource resolution is O(1) with factory caching.
- [ ] Inheritance chain resolution is PHP-compiled â€” no runtime cost.
- [ ] Conditional `when()` calls are evaluated only when included.
- [ ] The biggest challenge is not creating the new version â€” it's remembering to update old version tests.
- [ ] Resource classes inevitably grow fields over time â€” track field-level metadata per version.

---

# Implementation Checklist

- [ ] Versioned namespaces used for API resources
- [ ] Resource inheritance pattern used for progressive enhancement
- [ ] Conditional fields use `$this->when()` appropriately
- [ ] Each version's resource tested independently
- [ ] Old version resources never removed when adding new version
- [ ] Schema diff automated in CI for resource changes
- [ ] Response size growth monitored
- [ ] Implement Resource Class Organization following api-versioning patterns
- [ ] Configure all required settings for Resource Class Organization
- [ ] Register route/middleware/service for Resource Class Organization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Resource resolution is O(1) with factory caching.
- [ ] Inheritance chain resolution is PHP-compiled â€” no runtime cost.
- [ ] Conditional `when()` calls are evaluated only when included.
- [ ] Resource collections loop over models â€” O(n) cost per page.

---

# Security Checklist

- [ ] Ensure that new version resources don't expose sensitive fields that were intentionally excluded in old versions.
- [ ] Resource coverage matrix: validate that every model has a resource in every active version (no raw model leaks).
- [ ] Field deprecation should include a `@deprecated` response hint to consumers.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Version-specific resources in versioned namespaces
- [ ] Resource inheritance pattern used for progressive enhancement
- [ ] Conditional fields use `$this->when()` appropriately
- [ ] Each version's resource tested independently
- [ ] Resource coverage matrix validates all models have resources per version
- [ ] Schema diff automated in CI for resource changes
- [ ] Field deprecation across versions tracked and documented
- [ ] Write feature tests for happy path of Resource Class Organization
- [ ] Write feature tests for validation failure of Resource Class Organization
- [ ] Write feature tests for authentication failure of Resource Class Organization
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

- [ ] Avoid: Field Bleed
- [ ] Avoid: N+1 in Resources
- [ ] Avoid: Resource Mismatch
- [ ] Avoid: Silent Field Removal
- [ ] Avoid: Deep Resource Inheritance

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
- Use Versioned Namespace For API Resources
- Prefer Inheritance For Progressive Resource Enhancement
- Use `$this->when()` For Version-Specific Optional Fields
- Never Remove Old Version Resources When Adding New Version
- Test Each Version's Resource Independently
- Automate Schema Diff In CI For Resource Changes
- Use `->additional()` For Version-Specific Metadata
- Monitor Response Size Growth Across Versions

### Anti-Patterns
- Field Bleed
- N+1 in Resources
- Resource Mismatch
- Silent Field Removal
- Deep Resource Inheritance

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



