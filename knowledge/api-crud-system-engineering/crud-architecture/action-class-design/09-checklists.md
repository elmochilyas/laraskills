# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Action Class Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Action Class Design implementation follows crud-architecture patterns
- [ ] All edge cases handled for Action Class Design
- [ ] Full test coverage for Action Class Design
- [ ] Security review completed for Action Class Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Action Class Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place actions under `app/Actions/` organized by domain subdirectory (`app/Actions/Users/`, `app/Actions/Orders/`)
- [ ] Use constructor property promotion (PHP 8.0+) for dependency injection
- [ ] The container resolves actions automatically â€” no service provider binding needed for concrete classes
- [ ] Skip the action layer for operations with zero business logic; go from controller directly to model

---

# Implementation Checklist

- [ ] Exactly one public method per action class
- [ ] DTO as single primary input parameter
- [ ] No HTTP dependencies imported
- [ ] Stateless â€” no per-request mutable properties
- [ ] Write operations wrapped in `DB::transaction()`
- [ ] Authenticated user passed explicitly, not via `auth()->user()`
- [ ] Action name follows `[Verb][Entity]Action` convention
- [ ] No service provider binding needed (concrete class auto-resolution)
- [ ] Implement Action Class Design following crud-architecture patterns
- [ ] Configure all required settings for Action Class Design
- [ ] Register route/middleware/service for Action Class Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Action resolution cost is ~0.01ms per action (container resolution)
- [ ] Action composition multiplies this â€” calling 4 composed actions adds ~0.04ms resolution overhead
- [ ] Overhead is negligible for any application compared to database query time (1-50ms)
- [ ] OpCache eliminates autoloading cost entirely

---

# Security Checklist

- [ ] Actions should receive already-authorized data â€” authorization checks happen in the controller or via `Gate` inside the action
- [ ] Never pass the authenticated user implicitly via `auth()->user()` in an action â€” pass it explicitly as a parameter
- [ ] Transactional actions prevent partial writes that could leave the system in an insecure inconsistent state

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Action has exactly one public method
- [ ] Action receives a DTO, not `$request`
- [ ] Action does not import any HTTP-related classes
- [ ] Action is stateless (no per-request mutable properties)
- [ ] Write operations are wrapped in `DB::transaction()`
- [ ] Action name follows `[Verb][Entity]Action` convention
- [ ] Action is independently testable without HTTP scaffolding
- [ ] Write feature tests for happy path of Action Class Design
- [ ] Write feature tests for validation failure of Action Class Design
- [ ] Write feature tests for authentication failure of Action Class Design
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

- [ ] Avoid: God Action
- [ ] Avoid: HTTP-Coupled Action
- [ ] Avoid: Action with Multiple Public Methods
- [ ] Avoid: Anemic Action
- [ ] Avoid: Multi-Purpose Action

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
- Rule 1: One Public Method Per Action
- Rule 2: DTO as Single Input Parameter
- Rule 3: No HTTP Dependencies in Actions
- Rule 4: Stateless Action Design
- Rule 5: Write Operations Wrapped in Transactions
- Rule 6: Name Actions as Verb + Entity + Action
- Rule 7: Prefer Concrete Class Resolution Over Service Provider Binding
- Rule 8: Skip Actions Only for Trivial Operations
- Rule 9: Pass Authenticated User Explicitly

### Anti-Patterns
- God Action
- HTTP-Coupled Action
- Action with Multiple Public Methods
- Anemic Action
- Multi-Purpose Action



