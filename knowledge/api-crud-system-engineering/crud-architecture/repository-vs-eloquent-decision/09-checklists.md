# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Repository vs Eloquent Decision
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Repository vs Eloquent Decision implementation follows crud-architecture patterns
- [ ] All edge cases handled for Repository vs Eloquent Decision
- [ ] Full test coverage for Repository vs Eloquent Decision
- [ ] Security review completed for Repository vs Eloquent Decision
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Repository vs Eloquent Decision
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Direct Eloquent is the default path â€” ask "do I have a problem that a repository solves?" not "should I use a repository?"
- [ ] Small teams (1-5) benefit less from repositories; large teams (10+) benefit more from clear data access contracts
- [ ] Eloquent's `scoped()` method (Laravel 8+) reduces some benefits of repository scoping by providing global query macros
- [ ] Migration is straightforward: interface â†’ implementation â†’ binding â†’ replace call sites. Start with the most complex entities.

---

# Implementation Checklist

- [ ] Data source requirements evaluated
- [ ] Team familiarity considered
- [ ] Repository or Eloquent chosen per model
- [ ] Interface defined if Repository used
- [ ] Consistent approach within project
- [ ] Decision documented
- [ ] Implement Repository vs Eloquent Decision following crud-architecture patterns
- [ ] Configure all required settings for Repository vs Eloquent Decision
- [ ] Register route/middleware/service for Repository vs Eloquent Decision
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Direct Eloquent is slightly faster â€” no interface resolution or method delegation (~0.01ms difference per query â€” irrelevant)
- [ ] Repository-level caching can dramatically outperform direct Eloquent for read-heavy workloads
- [ ] Performance should not be the deciding factor â€” the difference is negligible

---

# Security Checklist

- [ ] Direct Eloquent scattered across call sites makes it harder to ensure consistent multi-tenant scoping
- [ ] Repositories centralize query logic, making it easier to audit data access patterns
- [ ] Direct Eloquent queries may miss global scopes if developers forget to apply them
- [ ] Hybrid approach: critical security scoping (tenancy) should use repositories; non-sensitive entities can use direct Eloquent

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Simple entities use direct Eloquent (no unnecessary repository abstraction)
- [ ] Complex entities with multi-tenancy, caching, or complex queries use repositories
- [ ] Repository interfaces exist only when there are multiple implementations or decoration needs
- [ ] Repositories add value beyond mirroring Eloquent's API
- [ ] Hybrid approach is applied consistently based on entity complexity
- [ ] Migration path is documented for entities that may need repositories later
- [ ] Write feature tests for happy path of Repository vs Eloquent Decision
- [ ] Write feature tests for validation failure of Repository vs Eloquent Decision
- [ ] Write feature tests for authentication failure of Repository vs Eloquent Decision
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

- [ ] Avoid: Java-itis
- [ ] Avoid: Scattered Queries Hell
- [ ] Avoid: Repository as Eloquent Mirror
- [ ] Avoid: Premature Repository Abstraction
- [ ] Avoid: Never Using Repositories When Needed

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
- Rule 1: Default to Direct Eloquent for New Entities
- Rule 2: Repository Must Add Value Beyond Eloquent's API
- Rule 3: Use Hybrid Approach â€” Repositories Only for Complex Entities
- Rule 4: Extract Repository Later â€” Migration Is Low Risk
- Rule 5: Use Direct Eloquent for Simple Lookups and Read Operations

### Anti-Patterns
- Java-itis
- Scattered Queries Hell
- Repository as Eloquent Mirror
- Premature Repository Abstraction
- Never Using Repositories When Needed



