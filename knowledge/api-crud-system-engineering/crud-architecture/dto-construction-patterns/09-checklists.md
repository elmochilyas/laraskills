# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** DTO Construction Patterns
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] DTO Construction Patterns implementation follows crud-architecture patterns
- [ ] All edge cases handled for DTO Construction Patterns
- [ ] Full test coverage for DTO Construction Patterns
- [ ] Security review completed for DTO Construction Patterns
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for DTO Construction Patterns
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] For complex construction logic, extract a separate factory class with injectable dependencies
- [ ] Use `fromArray` for pure key-to-property mapping without source-specific transformations
- [ ] Use `fromRequest` for request-specific transformations (extracting validated data, formatting)
- [ ] Use `fromModel` for Eloquent model-to-DTO mappings
- [ ] Limit named constructors to 3-4 per DTO â€” more indicates the DTO is used in too many contexts

---

# Implementation Checklist

- [ ] fromRequest() named constructor
- [ ] fromArray() named constructor
- [ ] fromModel() named constructor
- [ ] Validation before construction
- [ ] Invalid data throws exception
- [ ] Private constructor forces named usage
- [ ] Tested for all construction patterns
- [ ] Implement DTO Construction Patterns following crud-architecture patterns
- [ ] Configure all required settings for DTO Construction Patterns
- [ ] Register route/middleware/service for DTO Construction Patterns
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Static factory method overhead is identical to direct construction â€” the static method is inlined by OpCache
- [ ] Collection construction using `array_map` is efficient for typical sizes (10-100 items)
- [ ] For large collections (1000+ items), consider generator-based construction
- [ ] Instance factories add ~0.005ms resolution cost per factory

---

# Security Checklist

- [ ] DTO factories must only receive validated data â€” never raw `$request->all()`
- [ ] Type coercion in factories protects against type confusion (e.g., string where int is expected)
- [ ] Factory methods should not silently accept missing keys â€” explicit validation prevents data corruption
- [ ] Instance factories with injected dependencies must not leak database/external state into DTOs

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each DTO has at least one named constructor for its primary data source
- [ ] Named constructors handle missing keys explicitly (throw on required, default on optional)
- [ ] Type coercion is performed in constructors or factory methods
- [ ] Factories only receive validated data, never raw input
- [ ] Each named constructor is independently tested
- [ ] No DTO has more than 4 named constructors
- [ ] Collection construction is typed (returns array of DTOs, not array of arrays)
- [ ] Write feature tests for happy path of DTO Construction Patterns
- [ ] Write feature tests for validation failure of DTO Construction Patterns
- [ ] Write feature tests for authentication failure of DTO Construction Patterns
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

- [ ] Avoid: Silent Null Assignment
- [ ] Avoid: God Factory
- [ ] Avoid: Factory in Controller
- [ ] Avoid: Factory Method Explosion
- [ ] Avoid: Mixing Source Logic in fromArray

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
- Rule 1: Always Use Named Constructors for Source-Specific Mapping
- Rule 2: Handle Missing Keys Explicitly in Factory Methods
- Rule 3: Limit Named Constructors to 3-4 Per DTO
- Rule 4: Extract Complex Construction to Instance Factories
- Rule 5: Coerce Types in Constructor or Factory Method
- Rule 6: Provide Collection Construction for Arrays of DTOs

### Anti-Patterns
- Silent Null Assignment
- God Factory
- Factory in Controller
- Factory Method Explosion
- Mixing Source Logic in fromArray



