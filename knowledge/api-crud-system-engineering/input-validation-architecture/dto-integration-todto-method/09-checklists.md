# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Dto Integration Todto Method
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Dto Integration Todto Method implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Dto Integration Todto Method
- [ ] Full test coverage for Dto Integration Todto Method
- [ ] Security review completed for Dto Integration Todto Method
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Dto Integration Todto Method
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place standalone mappers in `App\Mappers\{Resource}\` directory.
- [ ] Name invokable mappers with action-oriented names: `MapPostRequestToData`.
- [ ] Register mappers in the container for dependency injection.
- [ ] For update scenarios, pass the existing model to `toDto()` for default values.
- [ ] Use `toDto()` on the request for simple endpoint-specific mapping.
- [ ] Use standalone mappers when the same DTO construction is needed across multiple request types.

---

# Implementation Checklist

- [ ] `toDto()` references only `validated()` â€” never raw request data
- [ ] DTO constructor accepts mapped parameter names matching the DTO properties
- [ ] Nested arrays are mapped to typed sub-DTOs or collections
- [ ] Optional validated fields default correctly in the DTO
- [ ] `toDto()` is tested independently with known validated data
- [ ] Implement Dto Integration Todto Method following input-validation-architecture patterns
- [ ] Configure all required settings for Dto Integration Todto Method
- [ ] Register route/middleware/service for Dto Integration Todto Method
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] DTO construction in `toDto()` is in-memory â€” negligible cost.
- [ ] Standalone mappers add one class per request-to-DTO mapping.
- [ ] Invokable mappers resolved via container per request â€” fine for typical use.
- [ ] Mapper services are shared (singleton) in the container â€” resolved once.

---

# Security Checklist

- [ ] `toDto()` should only use validated data from the request â€” never raw input.
- [ ] Standalone mappers must not bypass validation â€” they receive `validated()` data, not the raw request.
- [ ] Audit fields should come from authenticated context, not user input.
- [ ] Mappers should not have side effects â€” only data transformation.
- [ ] When version bridging, ensure the mapper doesn't introduce fields that didn't pass validation.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] toDto() / mapper uses only validated data from the request
- [ ] Standalone mappers are registered in the container
- [ ] Mappers are pure transformation â€” no I/O or side effects
- [ ] Returned DTOs are readonly/immutable
- [ ] Mapper naming is clear and doesn't collide with Eloquent methods
- [ ] Version bridging mappers exist for each API version when needed
- [ ] Tests verify mapper output matches expected DTO structure
- [ ] Write feature tests for happy path of Dto Integration Todto Method
- [ ] Write feature tests for validation failure of Dto Integration Todto Method
- [ ] Write feature tests for authentication failure of Dto Integration Todto Method
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

- [ ] Avoid: Mapper Accessing Request Object Directly
- [ ] Avoid: Mapper With Business Logic
- [ ] Avoid: payload and toDto on Same Endpoint
- [ ] Avoid: Mapper Serializing/Deserializing
- [ ] Avoid: Mapper With Side Effects

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
- Choose payload() or toDto() â€” Never Both on the Same Endpoint
- Use Standalone Mappers for Cross-Version Scenarios
- Keep Mappers as Pure Transformations â€” No I/O or Side Effects
- Use Only Validated Data in toDto() Mappers
- Register Invokable Mappers in the Container
- Name Mappers Descriptively â€” Avoid Collision with Eloquent

### Anti-Patterns
- Mapper Accessing Request Object Directly
- Mapper With Business Logic
- payload and toDto on Same Endpoint
- Mapper Serializing/Deserializing
- Mapper With Side Effects

## Related Knowledge
- Form Request Design for APIs (request providing validated data)
- DTO Integration: payload() Method (alternative payload() pattern)
- Data Transfer Object Design (DTO fundamentals)
- Input Preparation (preparing input before toDto())
- Controller â†’ DTO â†’ Action â†’ Response Flow (end-to-end data flow)



