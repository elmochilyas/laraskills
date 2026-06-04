# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Data Transfer Object Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Data Transfer Object Design implementation follows crud-architecture patterns
- [ ] All edge cases handled for Data Transfer Object Design
- [ ] Full test coverage for Data Transfer Object Design
- [ ] Security review completed for Data Transfer Object Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Data Transfer Object Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] DTOs bridge the HTTP layer and business logic â€” they must not import HTTP-related classes
- [ ] Per-operation DTOs are preferred over per-entity DTOs in larger codebases
- [ ] DTOs simplify test setup â€” construct them directly without HTTP scaffolding
- [ ] Validate data before DTO construction, not after â€” DTOs assume valid input

---

# Implementation Checklist

- [ ] DTO class is final with readonly properties
- [ ] Constructor property promotion used
- [ ] `fromArray()` named constructor for array creation
- [ ] Typed properties with nullable types where needed
- [ ] `toArray()` method for serialization
- [ ] Static `rules()` for validation rule integration
- [ ] DTO is anemic â€” no business logic
- [ ] Action accepts DTO as parameter
- [ ] DTO created from validated request in controller
- [ ] Property docblocks describe fields
- [ ] Implement Data Transfer Object Design following crud-architecture patterns
- [ ] Configure all required settings for Data Transfer Object Design
- [ ] Register route/middleware/service for Data Transfer Object Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] DTO construction overhead is ~0.005ms per object â€” negligible
- [ ] Array-to-DTO mapping (copying values by key) is the dominant cost, not object allocation
- [ ] At 50 DTOs per request: ~0.25ms total â€” irrelevant compared to database queries
- [ ] OpCache eliminates repeated autoloading cost

---

# Security Checklist

- [ ] DTOs must never receive raw `$request->all()` â€” only validated data
- [ ] DTOs should not carry sensitive data beyond what the consuming layer needs (principle of least data)
- [ ] Type coercion in constructors protects against type confusion attacks
- [ ] Serialization must not expose internal properties unintentionally

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] DTO properties are readonly (public readonly or readonly class)
- [ ] DTO has no business logic or validation rules
- [ ] DTO does not import HTTP-related classes
- [ ] DTO has at least one factory method (fromArray, fromRequest, fromModel)
- [ ] DTO has toArray() or JsonSerializable for serialization
- [ ] DTO constructor uses typed parameters
- [ ] DTO is immutable â€” no setters, no mutable properties
- [ ] DTO is constructed from validated data only
- [ ] Write feature tests for happy path of Data Transfer Object Design
- [ ] Write feature tests for validation failure of Data Transfer Object Design
- [ ] Write feature tests for authentication failure of Data Transfer Object Design
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

- [ ] Avoid: Anemic DTO Array Alternative
- [ ] Avoid: God DTO
- [ ] Avoid: DTO as Entity
- [ ] Avoid: Mutable DTO
- [ ] Avoid: DTO with Business Logic

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
- Rule 1: Enforce Immutability with Readonly Properties
- Rule 2: DTOs Must Not Contain Business Logic
- Rule 3: Always Construct DTOs from Validated Data
- Rule 4: Prefer Per-Operation DTOs Over Per-Entity DTOs
- Rule 5: DTOs Must Not Import HTTP Classes
- Rule 6: Use Typed Constructor Properties with Full Type Hints
- Rule 7: Provide Factory Methods for Each Primary Data Source

### Anti-Patterns
- Anemic DTO Array Alternative
- God DTO
- DTO as Entity
- Mutable DTO
- DTO with Business Logic



