# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Response Shape Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Shape Testing implementation follows api-testing patterns
- [ ] All edge cases handled for Response Shape Testing
- [ ] Full test coverage for Response Shape Testing
- [ ] Security review completed for Response Shape Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Shape Testing

---

# Architecture Checklist

- [ ] Shape tests directly mirror OpenAPI response schemas.
- [ ] Fail CI if any shape test breaks â€” shape changes are contract breaks requiring version bumps.
- [ ] Shape tests catch accidental contract breaks before they reach consumers.
- [ ] Conditional shape assertions for optional fields (loaded relations, sparse fields).

---

# Implementation Checklist

- [ ] `assertJsonStructure` is called before value assertions
- [ ] `*` wildcard is used on all collection endpoints
- [ ] Per-resource-type structure helpers are defined and reused
- [ ] Deep nested structures (relations, pagination wrappers) are asserted explicitly
- [ ] Version-specific shape definitions exist when multiple API versions are active
- [ ] No unexpected keys (password, pivot, internal fields) are exposed
- [ ] Implement Response Shape Testing following api-testing patterns
- [ ] Configure all required settings for Response Shape Testing
- [ ] Register route/middleware/service for Response Shape Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Shape tests are fast â€” decode JSON and walk key tree once.
- [ ] Bundle all shape assertions into one test method per endpoint to minimize kernel boots.
- [ ] Separate shape tests for optional fields into their own methods.

---

# Security Checklist

- [ ] Shape tests verify no unexpected keys are exposed in responses.
- [ ] Can detect accidental exposure of internal fields (password hashes, pivot data).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Response Shape Testing
- [ ] Write feature tests for validation failure of Response Shape Testing
- [ ] Write feature tests for authentication failure of Response Shape Testing
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
- Assert Shape Before Content
- Use `*` Wildcard For Collection Endpoints
- Define Per-Resource-Type Structure Helpers
- Test Deep Nesting Explicitly
- Version Shape Expectations Per API Version
- Verify No Unexpected Keys Exposed

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



