# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Controller Inheritance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Inheritance implementation follows api-versioning patterns
- [ ] All edge cases handled for Controller Inheritance
- [ ] Full test coverage for Controller Inheritance
- [ ] Security review completed for Controller Inheritance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Inheritance
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] PHP inheritance adds zero runtime overhead (method resolution is compile-time).
- [ ] Base controller constructor can be heavy if it resolves many dependencies â€” use lazy resolution.
- [ ] Trait composition is equivalent to copy-paste at compile time â€” no performance impact.
- [ ] Controller inheritance is a "young API" pattern â€” as the API matures and versions diverge, evolve to composition.
- [ ] A `ControllerInheritanceAnalyzer` can calculate override percentage to detect when refactoring is needed.

---

# Implementation Checklist

- [ ] Inheritance depth limited to 2 levels (Base â†’ Version)
- [ ] Security methods marked `final` in base
- [ ] `#[Override]` attribute used for method overrides
- [ ] Base controller is lean â€” no god objects
- [ ] Override ratio monitored â€” alert when >60%
- [ ] Cross-cutting concerns extracted to traits
- [ ] No shared mutable state in base properties
- [ ] Implement Controller Inheritance following api-versioning patterns
- [ ] Configure all required settings for Controller Inheritance
- [ ] Register route/middleware/service for Controller Inheritance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] PHP inheritance adds zero runtime overhead (compile-time method resolution).
- [ ] Base controller constructor with many dependencies can add startup overhead â€” use lazy resolution.
- [ ] Trait composition has no performance impact.
- [ ] Test suite execution time may increase with deep hierarchy complexity.

---

# Security Checklist

- [ ] `final` methods in base controller prevent override for security-critical logic (auth, throttle).
- [ ] Security audits should check that version controllers don't accidentally bypass base authorization.
- [ ] When adding new version controllers, ensure security tests are duplicated or inherited.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Base controller defined with shared logic (auth, pagination, error handling)
- [ ] Version controllers extend base with minimal overrides
- [ ] Inheritance depth limited to 2 levels (Base â†’ Version)
- [ ] Override ratio monitored â€” alert when >60%
- [ ] Security-critical methods marked `final` in base
- [ ] Base controller is lean â€” no god objects
- [ ] `#[Override]` attribute used for method overrides (PHP 8.3+)
- [ ] Write feature tests for happy path of Controller Inheritance
- [ ] Write feature tests for validation failure of Controller Inheritance
- [ ] Write feature tests for authentication failure of Controller Inheritance
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

- [ ] Avoid: God Base Controller
- [ ] Avoid: Abandoned Base
- [ ] Avoid: Version Bleed
- [ ] Avoid: Deep Inheritance Chain
- [ ] Avoid: Missing `parent::` Call

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
- Limit Inheritance Depth To Two Levels
- Mark Security Methods As `final` In Base Controller
- Use `#[Override]` Attribute For All Overridden Methods
- Extract Cross-Cutting Concerns To Traits
- Keep Base Controller Lean
- Test Base Controller Once, Override Tests For Versions
- Avoid Shared Mutable State In Base Properties
- Monitor Override Ratio For Refactoring Signal

### Anti-Patterns
- God Base Controller
- Abandoned Base
- Version Bleed
- Deep Inheritance Chain
- Missing `parent::` Call

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



