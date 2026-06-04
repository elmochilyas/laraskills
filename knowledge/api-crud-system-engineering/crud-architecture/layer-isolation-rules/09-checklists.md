# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Layer Isolation Rules
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Layer Isolation Rules implementation follows crud-architecture patterns
- [ ] All edge cases handled for Layer Isolation Rules
- [ ] Full test coverage for Layer Isolation Rules
- [ ] Security review completed for Layer Isolation Rules
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Layer Isolation Rules
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Controllers must only call services or actions â€” never `Model::query()`, `Model::find()`, `DB::table()`, or repositories directly
- [ ] Services may call repositories or use Eloquent directly â€” never call raw SQL or external APIs without an abstraction
- [ ] Repositories must only use Eloquent or the DB facade â€” never call services, dispatch events, or apply business logic
- [ ] Service A may call Service B, but Service B may NOT call Service A â€” extract shared logic to a lower layer
- [ ] A service method should call the repository once per logical operation â€” multiple calls suggest the repository API is not expressive enough

---

# Implementation Checklist

- [ ] Controller only does HTTP concerns
- [ ] Action/Service has no HTTP awareness
- [ ] Repository/query handles data access only
- [ ] No direct Controller â†’ Repository calls
- [ ] Architecture tests enforce rules
- [ ] Layer dependencies documented
- [ ] Implement Layer Isolation Rules following crud-architecture patterns
- [ ] Configure all required settings for Layer Isolation Rules
- [ ] Register route/middleware/service for Layer Isolation Rules
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Layer isolation adds ~0.001ms per method call layer â€” Controller â†’ Service â†’ Repository â†’ DB is 3 calls vs Controller â†’ DB = 1 call
- [ ] The ~0.003ms overhead is negligible compared to database query time (1-50ms)
- [ ] No measurable performance impact from enforced layer boundaries

---

# Security Checklist

- [ ] Layer isolation prevents controllers from bypassing authorization logic in the service layer
- [ ] Repository-level query scoping for multi-tenancy is only effective if all data access goes through repositories
- [ ] Bypassing layers can lead to inconsistent security policy enforcement (e.g., soft-delete filtering, tenant scoping)
- [ ] Architecture collapse (no layer isolation) means any security change requires auditing every call site

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Controllers never call Eloquent models directly
- [ ] Controllers never call repositories directly (if services exist)
- [ ] Services never call raw SQL or DB::raw()
- [ ] Services never dispatch events (that belongs in the service layer)
- [ ] No circular dependencies exist between services
- [ ] Repository methods do not call other repositories
- [ ] Layer violations are detected by static analysis or architectural tests
- [ ] Layer exception documentation exists for any deliberate bypass
- [ ] Write feature tests for happy path of Layer Isolation Rules
- [ ] Write feature tests for validation failure of Layer Isolation Rules
- [ ] Write feature tests for authentication failure of Layer Isolation Rules
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

- [ ] Avoid: Architecture Collapse
- [ ] Avoid: The "Just This Once" Exception
- [ ] Avoid: Repository as Bypass
- [ ] Avoid: Controller as Query Layer
- [ ] Avoid: Circular Service Dependencies

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
- Rule 1: Controllers Must Never Call Eloquent or Repositories Directly
- Rule 2: Services Must Not Call Raw SQL or External APIs
- Rule 3: Repositories Must Never Call Services or Dispatch Events
- Rule 4: No Circular Service Dependencies
- Rule 5: Enforce Layer Rules with Static Analysis
- Rule 6: A Service Method Should Call the Repository Once Per Logical Operation

### Anti-Patterns
- Architecture Collapse
- The "Just This Once" Exception
- Repository as Bypass
- Controller as Query Layer
- Circular Service Dependencies



