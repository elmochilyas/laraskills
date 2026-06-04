# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Token Ability Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Token Ability Design implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Token Ability Design
- [ ] Full test coverage for Token Ability Design
- [ ] Security review completed for Token Ability Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Token Ability Design

---

# Architecture Checklist

- [ ] Abilities stored as JSON array in `personal_access_tokens.abilities` column.
- [ ] Sanctum's `abilities` middleware requires ALL specified abilities (AND logic).
- [ ] Sanctum's `ability` middleware requires at least one (OR logic).
- [ ] No built-in wildcard support. Implement custom middleware for prefix matching (`str_starts_with`).
- [ ] Check abilities in middleware before controllers. Controllers use policies for instance checks.
- [ ] Evaluate: Ability Naming Convention â€” resource:action vs domain:resource:action
- [ ] Evaluate: Ability Granularity â€” Per-CRUD vs Monolithic Per-Resource
- [ ] Evaluate: Ability Check Pattern â€” Middleware AND vs OR Logic

---

# Implementation Checklist

- [ ] Ability naming convention defined: `resource:action`
- [ ] Resource-scoped abilities for granular control
- [ ] Wildcard `*` ability for full-access tokens
- [ ] Abilities assigned at token creation
- [ ] Abilities middleware applied on routes
- [ ] `tokenCan()` checks in authorization logic
- [ ] Token name never used for authorization
- [ ] Ability taxonomy documented
- [ ] Tests verify ability enforcement (403 for insufficient)
- [ ] Ability names consistent across all resources and actions
- [ ] Implement Token Ability Design following api-authentication-authorization patterns
- [ ] Configure all required settings for Token Ability Design
- [ ] Register route/middleware/service for Token Ability Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `in_array()` on small JSON array â€” sub-millisecond.
- [ ] Avoid hundreds of abilities per token (JSON column deserialization overhead).
- [ ] Sanctum caches token lookup per request. Ability check reuses cached token.
- [ ] Custom wildcard matching adds microseconds â€” acceptable for most APIs.

---

# Security Checklist

- [ ] **`*` is literal, not wildcard**: Sanctum treats `*` as a literal string. `tokenCan('*')` matches only if `'*'` is in the array.
- [ ] **Empty abilities array**: All `tokenCan()` calls return false. Document this behavior.
- [ ] **Overly broad abilities**: A `posts:admin` ability grants everything for posts â€” defeats fine-grained control.
- [ ] **Stale abilities**: If you remove an ability from the system, existing tokens still have it in their JSON. Migrate to strip unknown abilities.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Token Ability Design
- [ ] Write feature tests for validation failure of Token Ability Design
- [ ] Write feature tests for authentication failure of Token Ability Design
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
- Use resource:action Naming Convention
- Define Abilities as Class Constants
- Use Granular Per-CRUD-Operation Abilities
- Check Abilities in Middleware, Policies for Instance Checks
- Never Use * as a Wildcard
- Use Domain:Resource:Action for Large Systems
- Map Roles to Ability Arrays at Token Creation
- Use abilities Middleware for AND Logic
- Check Ability Authorization in FormRequests
- Strip Unknown Abilities During Token Migration

### Decisions
- Ability Naming Convention â€” resource:action vs domain:resource:action
- Ability Granularity â€” Per-CRUD vs Monolithic Per-Resource
- Ability Check Pattern â€” Middleware AND vs OR Logic

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



