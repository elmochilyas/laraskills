# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Code Limits
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Code Limits implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Code Limits
- [ ] Full test coverage for Controller Code Limits
- [ ] Security review completed for Controller Code Limits
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Code Limits
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure limits in PHPStan rules, PhpMetrics, or CI scripts.
- [ ] Document the limit policy in `CONTRIBUTING.md`.
- [ ] Review limits quarterly: if every controller is under 80 lines, tighten to 80.
- [ ] Pair with thin controller enforcement rules (no Eloquent in controllers, must delegate).
- [ ] Use `php artisan make:controller` with extraction patterns from day one.
- [ ] Evaluate: Limit Enforcement Strategy

---

# Implementation Checklist

- [ ] No controller method exceeds the line limit
- [ ] No controller method exceeds cyclomatic complexity threshold
- [ ] Query logic is delegated to scopes, repositories, or query builders
- [ ] Business logic is delegated to services or actions
- [ ] Validation is delegated to Form Requests
- [ ] Response formatting is delegated to API Resources
- [ ] CI pipeline includes a controller complexity check
- [ ] Exceptions (trivial delegation methods) are documented if any
- [ ] Implement Controller Code Limits following resource-controllers patterns
- [ ] Configure all required settings for Controller Code Limits
- [ ] Register route/middleware/service for Controller Code Limits
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Line count has zero runtime impact.
- [ ] Extracted classes add one extra method call per request (negligible).
- [ ] Opcode cache handles additional files without significant impact.

---

# Security Checklist

- [ ] Code limits are a maintenance concern, not a security concern. However, thick controllers are harder to audit for security issues.
- [ ] Security-critical code should be in visible, well-organized locations â€” limits help enforce this.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Controller file limit is defined and enforced (e.g., 200 lines)
- [ ] Method length limit is defined and enforced (e.g., 15 lines)
- [ ] Method count limit is defined (e.g., 7-10 methods)
- [ ] Logical lines (excluding comments/blanks) are used for counting
- [ ] Exemption mechanism exists with documented justification
- [ ] Limits are checked in CI
- [ ] Limits are reviewed quarterly for tuning
- [ ] Write feature tests for happy path of Controller Code Limits
- [ ] Write feature tests for validation failure of Controller Code Limits
- [ ] Write feature tests for authentication failure of Controller Code Limits
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

- [ ] Avoid: Controller Exceeds 200 Lines
- [ ] Avoid: Single Controller for Multiple Resources
- [ ] Avoid: Method Exceeds 20 Lines
- [ ] Avoid: Too Many Dependencies Injected
- [ ] Avoid: Inline Query Building in Controller
- [ ] Avoid: Inline Query Building

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
- Enforce Maximum Controller File Length
- Enforce Maximum Method Length
- Limit Public Methods Per Controller
- Count Logical Lines Excluding Comments
- Enforce Cyclomatic Complexity Limit Per Method
- Run Limit Checks In CI

### Decisions
- Limit Enforcement Strategy

### Anti-Patterns
- Controller Exceeds 200 Lines
- Single Controller for Multiple Resources
- Method Exceeds 20 Lines
- Too Many Dependencies Injected
- Inline Query Building in Controller
- Inline Query Building

## Related Knowledge
- Thin Controller Enforcement â€” Automated enforcement via PHPStan/Deptrac
- Controller Action Delegation â€” The primary extraction strategy
- Controller Form Request Integration â€” Extracting validation from methods



