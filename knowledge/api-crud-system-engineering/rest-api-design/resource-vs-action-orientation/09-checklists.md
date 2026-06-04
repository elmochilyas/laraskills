# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Resource vs Action Orientation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Resource vs Action Orientation implementation follows rest-api-design patterns
- [ ] All edge cases handled for Resource vs Action Orientation
- [ ] Full test coverage for Resource vs Action Orientation
- [ ] Security review completed for Resource vs Action Orientation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Resource vs Action Orientation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `Route::apiResource()` for resource-oriented CRUD. Add action endpoints as explicit POST routes alongside resource routes.
- [ ] For simple state transitions, prefer PATCH with validated status fields. Reserve action endpoints for operations with side effects beyond state change.
- [ ] Use single-action controllers (`__invoke`) for action-oriented endpoints â€” keeps each operation in its own class.
- [ ] Batch operations are action-oriented by nature â€” use `POST /resources/batch/{action}` with clear naming.
- [ ] Search endpoints: prefer GET with query parameters. Switch to POST only when query complexity exceeds URL length limits.

---

# Implementation Checklist

- [ ] Resources use `apiResource()` with standard methods
- [ ] Actions use POST routes with descriptive names
- [ ] Actions placed at `/resource/{id}/action`
- [ ] Separate controllers for actions
- [ ] Actions documented as non-CRUD
- [ ] Implement Resource vs Action Orientation following rest-api-design patterns
- [ ] Configure all required settings for Resource vs Action Orientation
- [ ] Register route/middleware/service for Resource vs Action Orientation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Resource-oriented GET endpoints can be cached at CDN and reverse proxy levels â€” significant performance advantage.
- [ ] Action-oriented POST endpoints are not cacheable by HTTP intermediaries. Convert read-heavy action endpoints to resource orientation where possible.
- [ ] Batch action endpoints can process operations in a single transaction, reducing round-trips compared to multiple individual requests.
- [ ] Resource-oriented APIs produce more predictable OpenAPI specs and better SDK generation â€” reducing integration effort.

---

# Security Checklist

- [ ] Action endpoints with side effects must have strict authorization checks â€” the verb nature may hide the impact from casual review.
- [ ] Batch action endpoints must validate every item individually â€” a single item failure should not roll back the entire batch unless atomicity is required.
- [ ] Action endpoints that accept arbitrary parameters are more vulnerable to parameter injection â€” validate rigorously.
- [ ] PATCH for state transitions must validate that the requested state transition is valid (e.g., cannot cancel a shipped order).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] CRUD operations use resource-oriented endpoints with standard HTTP methods.
- [ ] Action endpoints have clear verb names and are nested under their related resource.
- [ ] Action endpoints are justified â€” simple state changes use PATCH instead.
- [ ] All action endpoints document their side effects in OpenAPI.
- [ ] GET is used for read-heavy action endpoints where possible (search, reports).
- [ ] The API follows a consistent paradigm â€” resources or actions are not mixed arbitrarily.
- [ ] Write feature tests for happy path of Resource vs Action Orientation
- [ ] Write feature tests for validation failure of Resource vs Action Orientation
- [ ] Write feature tests for authentication failure of Resource vs Action Orientation
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

- [ ] Avoid: Pure REST Dogma
- [ ] Avoid: RPC with No Pattern
- [ ] Avoid: POST for Reads
- [ ] Avoid: Hidden State Machines
- [ ] Avoid: Overloaded POST Endpoints

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
- Default To Resource Orientation
- Use PATCH For Simple State Transitions
- Use Action Endpoints For Operations With Side Effects
- Nest Action Endpoints Under Their Related Resource
- Use Single-Action Controllers For Action Endpoints
- Use GET For Read-Only Action Endpoints
- Document Side Effects For Action Endpoints
- Use Batch Action Endpoints For Multi-Resource Operations
- Apply The Decision Framework Before Creating Action Endpoints

### Anti-Patterns
- Pure REST Dogma
- RPC with No Pattern
- POST for Reads
- Hidden State Machines
- Overloaded POST Endpoints

## Related Knowledge
- Prerequisites
- Related
- Advanced



