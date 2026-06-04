# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Service vs Action Decision
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Service vs Action Decision implementation follows crud-architecture patterns
- [ ] All edge cases handled for Service vs Action Decision
- [ ] Full test coverage for Service vs Action Decision
- [ ] Security review completed for Service vs Action Decision
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Service vs Action Decision
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Actions maximize isolation and clarity per operation; services maximize shared context and minimize injection points
- [ ] The best codebases use both, choosing based on operation grouping and dependency sharing
- [ ] Moving from actions to services is straightforward â€” inject actions into a service and expose their methods
- [ ] Moving from services to actions requires extracting each method into its own class
- [ ] The cost of choosing wrong is low â€” refactoring between patterns is straightforward

---

# Implementation Checklist

- [ ] Action used for single operations
- [ ] Service used for multi-method domains
- [ ] Pattern consistent across project
- [ ] Decision documented
- [ ] Implement Service vs Action Decision following crud-architecture patterns
- [ ] Configure all required settings for Service vs Action Decision
- [ ] Register route/middleware/service for Service vs Action Decision
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] No meaningful performance difference â€” both patterns add ~0.01ms for container resolution
- [ ] The choice is purely architectural, not performance-driven

---

# Security Checklist

- [ ] Both patterns support authorization equally â€” the choice does not affect security posture
- [ ] Services with many methods may inadvertently share security context across unrelated operations â€” ensure authorization is per-method, not per-class

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] 1-2 operations with few dependencies â†’ Action pattern
- [ ] 3+ operations with shared dependencies â†’ Service pattern
- [ ] Decision framework is documented and applied consistently
- [ ] Services are not created prematurely for single-method entities
- [ ] Actions are not artificially grouped into services that don't add value
- [ ] Code review enforces the team's action vs service conventions
- [ ] Migration path is understood for refactoring between patterns
- [ ] Write feature tests for happy path of Service vs Action Decision
- [ ] Write feature tests for validation failure of Service vs Action Decision
- [ ] Write feature tests for authentication failure of Service vs Action Decision
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

- [ ] Avoid: Decision Paralysis
- [ ] Avoid: Fat Service from the Start
- [ ] Avoid: Anemic Action Library
- [ ] Avoid: Dogmatic Adherence to One Pattern
- [ ] Avoid: Mixed Inconsistency

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
- Rule 1: Default to Actions for New Operations
- Rule 2: Use the 3-Operation Threshold for Service Promotion
- Rule 3: Document the Team's Decision Framework
- Rule 4: Services Can Delegate to Actions Internally
- Rule 5: Enforce the Decision in Code Review

### Anti-Patterns
- Decision Paralysis
- Fat Service from the Start
- Anemic Action Library
- Dogmatic Adherence to One Pattern
- Mixed Inconsistency



