# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Dto Integration Payload Method
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Dto Integration Payload Method implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Dto Integration Payload Method
- [ ] Full test coverage for Dto Integration Payload Method
- [ ] Security review completed for Dto Integration Payload Method
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Dto Integration Payload Method
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define `payload(): SomeDto` on each FormRequest that produces typed data.
- [ ] Use only `$this->validated()` as the data source â€” never `$this->all()` or `$this->input()`.
- [ ] For nested DTOs, manually map using constructor pattern.
- [ ] Use Spatie's `DataRequest` for auto-generated payload() from `$dataClass`.
- [ ] Test `payload()` by constructing the request, calling `validate()`, and asserting DTO properties.
- [ ] Keep conditional logic in `payload()` minimal â€” extract to factory methods if needed.

---

# Implementation Checklist

- [ ] DTO properties match validated keys (or mapping is explicit)
- [ ] DTO constructor or factory uses `validated()` â€” never raw `$this->input()`
- [ ] DTO is type-hinted in the controller method for automatic resolution
- [ ] Optional fields are nullable in the DTO to match validation
- [ ] Nested data is mapped to nested DTOs or value objects
- [ ] Implement Dto Integration Payload Method following input-validation-architecture patterns
- [ ] Configure all required settings for Dto Integration Payload Method
- [ ] Register route/middleware/service for Dto Integration Payload Method
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] DTO construction in `payload()` is a one-time cost per request.
- [ ] Spatie's `from()` uses reflection â€” cache DTO class metadata if constructing many DTOs.
- [ ] Constructor-based DTO creation (no reflection) is faster than `from()`.
- [ ] `array_map` over validated items is O(n) â€” fine for typical batch sizes.

---

# Security Checklist

- [ ] Never include unvalidated data in `payload()` â€” use only `$this->validated()`.
- [ ] Audit fields (user ID, IP) merged in `payload()` must come from authenticated context.
- [ ] DTOs returned from `payload()` should be immutable â€” prevents downstream mutation.
- [ ] Ensure nested DTOs receive validated nested data, not raw input.
- [ ] `payload()` should not expose internal identifiers that weren't part of validated input.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every FormRequest with downstream DTO has a `payload()` method
- [ ] `payload()` uses only `$this->validated()` as data source
- [ ] DTO returned from `payload()` is readonly/immutable
- [ ] No I/O or side effects in `payload()` methods
- [ ] Controllers use `$request->payload()` instead of `$request->validated()`
- [ ] Integration tests verify `payload()` DTO construction matches validation rules
- [ ] Nested DTOs are manually mapped with proper type handling
- [ ] Write feature tests for happy path of Dto Integration Payload Method
- [ ] Write feature tests for validation failure of Dto Integration Payload Method
- [ ] Write feature tests for authentication failure of Dto Integration Payload Method
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

- [ ] Avoid: payload Returning Array Instead of Typed DTO
- [ ] Avoid: payload Mixing Validated and Request Data
- [ ] Avoid: payload With Side Effects
- [ ] Avoid: payload With Business Logic
- [ ] Avoid: payload Called Before Validation

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
- Use payload() Over validated() in Controllers
- Use Only $this->validated() as payload() Data Source
- Return Readonly/Immutable DTOs from payload()
- Keep payload() Free of I/O and Side Effects
- Prefer Constructor-Based DTOs Over from() for Complex Mapping
- Document payload() Return Type with PHPDoc

### Anti-Patterns
- payload Returning Array Instead of Typed DTO
- payload Mixing Validated and Request Data
- payload With Side Effects
- payload With Business Logic
- payload Called Before Validation

## Related Knowledge
- Form Request Design for APIs (base request hosting payload())
- Data Transfer Object Design (DTO fundamentals for payload())
- DTO Integration: toDto() Method (alternative toDto() pattern)
- Input Preparation (preparing input before payload() mapping)
- Controller â†’ DTO â†’ Action â†’ Response Flow (end-to-end data flow)



