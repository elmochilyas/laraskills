# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Action Composition
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Action Composition implementation follows crud-architecture patterns
- [ ] All edge cases handled for Action Composition
- [ ] Full test coverage for Action Composition
- [ ] Security review completed for Action Composition
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Action Composition
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] The coordinator's constructor declares all sub-actions it calls â€” the container resolves the entire dependency tree
- [ ] Sub-actions handle errors within their own scope (validation, business rule violations); the coordinator handles workflow-level errors
- [ ] A coordinator doing sub-action work (instead of delegating) violates the pattern â€” extract distinct operations to their own action classes
- [ ] Consider extracting to a service when composition exceeds 3-4 levels

---

# Implementation Checklist

- [ ] Coordinator delegates to sub-actions, not inline business logic
- [ ] Each sub-action independently testable without coordinator
- [ ] Composition depth 3-4 levels or fewer
- [ ] Context passed through method parameters, not shared state
- [ ] Error handling at coordinator level for partial failure
- [ ] Logging at coordinator level
- [ ] Sub-actions reusable across multiple coordinators
- [ ] Implement Action Composition following crud-architecture patterns
- [ ] Configure all required settings for Action Composition
- [ ] Register route/middleware/service for Action Composition
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each composed sub-action adds a container resolution + method call overhead (~0.01ms)
- [ ] For a workflow with 5 sub-actions: ~0.05ms total overhead
- [ ] Database operations within each sub-action dominate performance â€” composition overhead is irrelevant
- [ ] The container resolves each leaf dependency once and shares instances where possible

---

# Security Checklist

- [ ] Ensure the coordinator passes the authenticated actor explicitly to sub-actions that need authorization
- [ ] Transaction rollback at the coordinator level prevents partial writes that could leave sensitive data in an inconsistent state
- [ ] Logging at the coordinator level must not leak sensitive DTO data in workflow traces

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Coordinator delegates to sub-actions, not inline business logic
- [ ] Each sub-action is independently testable without the coordinator
- [ ] Composition depth is 3-4 levels or fewer
- [ ] Context is passed through method parameters, not shared mutable state
- [ ] Error handling exists at the coordinator level for partial failure recovery
- [ ] Logging or tracing is present at coordinator level
- [ ] Sub-actions are reusable across multiple coordinators or entry points
- [ ] Write feature tests for happy path of Action Composition
- [ ] Write feature tests for validation failure of Action Composition
- [ ] Write feature tests for authentication failure of Action Composition
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

- [ ] Avoid: Deep Composition Without Error Recovery
- [ ] Avoid: Coordinator as God Class
- [ ] Avoid: Implicit Context Passing
- [ ] Avoid: Composition Without Reusability
- [ ] Avoid: Missing Transaction at Coordinator Level

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
- Rule 1: Coordinator Delegates All Business Logic
- Rule 2: Limit Composition Depth to 3-4 Levels
- Rule 3: Pass Context Through Method Parameters Only
- Rule 4: Ensure Each Sub-Action Is Independently Testable
- Rule 5: Add Error Handling at the Coordinator Level
- Rule 6: Test Coordinators with Mocked Sub-Actions

### Anti-Patterns
- Deep Composition Without Error Recovery
- Coordinator as God Class
- Implicit Context Passing
- Composition Without Reusability
- Missing Transaction at Coordinator Level



