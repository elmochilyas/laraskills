# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Thin Controller Enforcement
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Thin Controller Enforcement implementation follows resource-controllers patterns
- [ ] All edge cases handled for Thin Controller Enforcement
- [ ] Full test coverage for Thin Controller Enforcement
- [ ] Security review completed for Thin Controller Enforcement
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Thin Controller Enforcement
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Start with these 5 rules: (1) no Eloquent static calls in controllers, (2) max 200 lines per controller, (3) controller methods must not call `Model::query()`, (4) form request must be type-hinted for store/update, (5) no `DB::` facade in controllers.
- [ ] Run PHPStan at max level in CI; use baseline for existing violations with a plan to reduce them.
- [ ] Deptrac layers: `Controllers â†’ Services â†’ Repositories` â€” enforce one direction only.
- [ ] CI pipeline order: lint â†’ PHPStan (thin controller rules) â†’ Deptrac â†’ Tests.
- [ ] Never use enforcement as a replacement for code review â€” enforcement catches objective violations; review catches design problems.
- [ ] Provide a pre-commit hook for instant feedback in addition to CI checks.
- [ ] Evaluate: Enforcement Rule Selection

---

# Implementation Checklist

- [ ] Form Request handles validation
- [ ] Policy or authorize() handles authorization
- [ ] Action/service handles business logic
- [ ] API Resource handles response transformation
- [ ] Controller methods < 10 lines
- [ ] Controller < 5 injected dependencies
- [ ] No business logic in controller
- [ ] Integration tests cover full flow
- [ ] Implement Thin Controller Enforcement following resource-controllers patterns
- [ ] Configure all required settings for Thin Controller Enforcement
- [ ] Register route/middleware/service for Thin Controller Enforcement
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] 10-20 custom PHPStan rules add ~5-15 seconds to analysis time.
- [ ] Deptrac analysis runs in ~1-2 seconds for most project sizes.
- [ ] CI enforcement adds 30-60 seconds total â€” negligible compared to test suites (5-15 minutes).
- [ ] Use PHPStan's `--memory-limit` to prevent memory exhaustion on large projects.
- [ ] Run enforcement rules separately from main analysis in CI to pinpoint violations faster.

---

# Security Checklist

- [ ] Enforcement rules can detect security-relevant violations: raw SQL in controllers (bypassing Eloquent), missing authorization in store/update methods, missing type hints on form requests.
- [ ] Deptrac can enforce that controllers only use authorized dependencies (no direct repository access bypassing service layer).
- [ ] Ensure enforcement rules don't create false sense of security â€” automated rules complement, not replace, security review.
- [ ] Exemption annotations should be reviewed in security-sensitive contexts.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] At least 2-3 PHPStan custom rules implemented for thin controller checks
- [ ] Deptrac configuration with Controller â†’ Service â†’ Repository layer rules
- [ ] Rules run in CI pipeline (pre-merge check)
- [ ] Exemption mechanism with mandatory reason annotation
- [ ] Graduated rollout plan documented (warnings â†’ errors â†’ CI failure phases)
- [ ] False positive rate <10% (tracked and tuned quarterly)
- [ ] Existing violations captured in PHPStan baseline (not blocking CI)
- [ ] Write feature tests for happy path of Thin Controller Enforcement
- [ ] Write feature tests for validation failure of Thin Controller Enforcement
- [ ] Write feature tests for authentication failure of Thin Controller Enforcement
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

- [ ] Avoid: No Automated Enforcement
- [ ] Avoid: Manual Code Review as Only Enforcement
- [ ] Avoid: Inconsistent Enforcement Across Team
- [ ] Avoid: No Defined Threshold for Thin
- [ ] Avoid: Enforcement Without Migration Support
- [ ] Avoid: Inconsistent Enforcement
- [ ] Avoid: No Defined Threshold

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
- Enforce No Eloquent In Controllers
- Enforce Controller File Size With PHPStan
- Enforce Form Request Type Hint On Store And Update
- Enforce Layer Direction With Deptrac
- Start With Few Rules And Add Gradually
- Provide Exemption Mechanism With Mandatory Reason

### Decisions
- Enforcement Rule Selection

### Anti-Patterns
- No Automated Enforcement
- Manual Code Review as Only Enforcement
- Inconsistent Enforcement Across Team
- No Defined Threshold for Thin
- Enforcement Without Migration Support
- Inconsistent Enforcement
- No Defined Threshold

## Related Knowledge
- Controller Code Limits â€” Manual line/method limits that enforcement rules check
- Controller Action Delegation â€” The delegation pattern that enforcement rules require
- Controller Dependency Injection â€” Constructor DI that enforcement rules can verify
- Controller Organization by Domain â€” Directory structure that Deptrac layers reference
- Controller Testing Strategies â€” Testing that enforcement rules correctly identify violations



