# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Controller-DTO-Action Flow
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller-DTO-Action Flow implementation follows crud-architecture patterns
- [ ] All edge cases handled for Controller-DTO-Action Flow
- [ ] Full test coverage for Controller-DTO-Action Flow
- [ ] Security review completed for Controller-DTO-Action Flow
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller-DTO-Action Flow
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use DTO when data shape is complex, reused across multiple actions, or must guarantee type safety
- [ ] Pass `$request->validated()` directly only when data crosses two layers and the shape is simple (3-5 fields)
- [ ] Every action class is a file â€” for trivial operations (toggle boolean), consider skipping the action
- [ ] The pattern adds ~0.01ms per request for DTO construction and action resolution â€” negligible

---

# Implementation Checklist

- [ ] Controller constructs DTO from validated request data
- [ ] Action receives DTO, not `$request` or loose parameters
- [ ] Action has no HTTP imports or HTTP return types
- [ ] DTO is typed class with named properties, not associative array
- [ ] Controller builds response from action result
- [ ] Flow testable without HTTP for action layer
- [ ] Three-layer responsibility boundaries respected
- [ ] Implement Controller-DTO-Action Flow following crud-architecture patterns
- [ ] Configure all required settings for Controller-DTO-Action Flow
- [ ] Register route/middleware/service for Controller-DTO-Action Flow
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] DTO construction and action resolution adds ~0.01ms per request â€” immeasurable for typical CRUD (10-50ms total)
- [ ] Action class autoloading is zero-cost with OpCache
- [ ] DTO property promotion (PHP 8.0+) eliminates constructor boilerplate overhead

---

# Security Checklist

- [ ] Authorization should happen before or during action execution â€” never in the DTO
- [ ] The DTO should only carry data, never perform authorization or validation beyond type enforcement
- [ ] Actions must not implicitly trust the DTO â€” business rule validation should still occur in the action
- [ ] Ensure DTOs don't carry sensitive data beyond what the action needs (principle of least data)

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Controller constructs DTO from validated request data, not from `$request` directly
- [ ] Action receives DTO, not `$request` or loose parameters
- [ ] Action has no HTTP imports or HTTP return types
- [ ] DTO is a typed class with named properties, not an associative array
- [ ] Controller builds response from action result
- [ ] Flow is testable without HTTP for the action layer
- [ ] Three-layer responsibility boundaries are respected
- [ ] Write feature tests for happy path of Controller-DTO-Action Flow
- [ ] Write feature tests for validation failure of Controller-DTO-Action Flow
- [ ] Write feature tests for authentication failure of Controller-DTO-Action Flow
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

- [ ] Avoid: Fat Controller
- [ ] Avoid: Anemic Action
- [ ] Avoid: DTO-Less Flow
- [ ] Avoid: DTO and FormRequest Duplication Without Intent
- [ ] Avoid: Action Contains HTTP Logic

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
- Rule 1: Controller Constructs DTO from Validated Data Only
- Rule 2: Action Receives DTO, Never Request
- Rule 3: Action Returns Domain Data, Controller Handles HTTP Response
- Rule 4: Three-Layer Responsibility Boundaries Must Be Respected
- Rule 5: Return 204 for Void Actions
- Rule 6: Test Flow Without HTTP by Constructing DTOs Directly

### Anti-Patterns
- Fat Controller
- Anemic Action
- DTO-Less Flow
- DTO and FormRequest Duplication Without Intent
- Action Contains HTTP Logic



