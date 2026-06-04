# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Policy Design for APIs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Policy Design for APIs implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Policy Design for APIs
- [ ] Full test coverage for Policy Design for APIs
- [ ] Security review completed for Policy Design for APIs
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Policy Design for APIs

---

# Architecture Checklist

- [ ] All policies in `app/Policies/`. Use subdirectories for large applications (`app/Policies/Api/V1/`).
- [ ] Policy methods return boolean. Throw `AuthorizationException` for custom error messages.
- [ ] For listing endpoints, use `viewAny` for collection access and filter results via query scopes rather than checking each item.
- [ ] Rate limiting is checked before policies â€” 429 responses skip authorization entirely.
- [ ] Soft delete models require `restore` and `forceDelete` policy methods.
- [ ] Evaluate: Authorization Location â€” Policies vs Controllers vs Middleware
- [ ] Evaluate: Admin Override Pattern â€” Gate::before vs Per-Method Check
- [ ] Evaluate: Policy for Listing Endpoints â€” viewAny with Scopes vs Per-Item Check

---

# Implementation Checklist

- [ ] Policy generated per model
- [ ] Policy methods defined for all CRUD actions
- [ ] Ownership check implemented for user-owned resources
- [ ] Policy registered in AuthServiceProvider
- [ ] Controller methods authorized with `$this->authorize()`
- [ ] Super-admin gateway via `Gate::before()`
- [ ] Policy returns boolean, never throws
- [ ] Every Policy method tested (owned, not-owned, unauthenticated)
- [ ] Auto-discovery working or policies registered
- [ ] Policy applicable to nested resource authorization
- [ ] Implement Policy Design for APIs following api-authentication-authorization patterns
- [ ] Configure all required settings for Policy Design for APIs
- [ ] Register route/middleware/service for Policy Design for APIs
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Policy resolution is cached per request. No repeated autoloading.
- [ ] Policy methods querying the database add queries. Ensure foreign key indexes.
- [ ] Eager load relations used in policy checks to prevent N+1.
- [ ] Avoid checking per-item policies in collection endpoints â€” use `viewAny` + query scopes.
- [ ] Cache expensive policy checks (external API calls, computed values) with user + resource key.

---

# Security Checklist

- [ ] **AuthorizationException messages**: Do not expose denial reasons in production. Use generic "Forbidden" messages.
- [ ] **Guest user handling**: Policy methods may receive null for guest users. Check `Auth::check()` before `$user->id`.
- [ ] **Race condition**: Post owner changes between policy check and update. Use database foreign keys as safety net.
- [ ] **Admin override safety**: Test admin overrides explicitly. Avoid catch-all `return true` without conditions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Policy Design for APIs
- [ ] Write feature tests for validation failure of Policy Design for APIs
- [ ] Write feature tests for authentication failure of Policy Design for APIs
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
- Always Use Policies for Authorization, Never Controllers
- Implement Admin Override Pattern with Explicit Conditions
- Never Expose Denial Reasons in Production 403 Responses
- Handle Null Users in Policy Methods
- Use viewAny for Collection Access, Filter via Scopes
- Register Policies Explicitly for Non-Standard Models
- Always Test Owner, Non-Owner, Admin, and Guest Scenarios
- Eager Load Policy Dependencies to Prevent N+1
- Log Denied Authorization Attempts
- Include restore and forceDelete for Soft-Delete Models

### Decisions
- Authorization Location â€” Policies vs Controllers vs Middleware
- Admin Override Pattern â€” Gate::before vs Per-Method Check
- Policy for Listing Endpoints â€” viewAny with Scopes vs Per-Item Check

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



