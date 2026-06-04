# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Spatie Laravel Data Integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Spatie Laravel Data Integration implementation follows crud-architecture patterns
- [ ] All edge cases handled for Spatie Laravel Data Integration
- [ ] Full test coverage for Spatie Laravel Data Integration
- [ ] Security review completed for Spatie Laravel Data Integration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Spatie Laravel Data Integration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Spatie Data can serve as both input DTOs and output resources via transformers
- [ ] Validation strategy options: FormRequest handles HTTP validation, Data handles structural validation (types, nested structures); or Data handles all validation
- [ ] The package handles nested construction automatically â€” child Data classes are constructed recursively
- [ ] Custom casts are registered as classes implementing the `Cast` interface with the `#[WithCast]` attribute
- [ ] TypeScript generation produces `.d.ts` files from all Data classes in the application

---

# Implementation Checklist

- [ ] Package approach applied consistently across all DTOs
- [ ] Package version pinned exact in composer.json
- [ ] Validation strategy decided and documented (FormRequest+Data or Data-only)
- [ ] Data classes use `Data::from()` for construction
- [ ] Custom casts registered for application-specific types
- [ ] TypeScript generation configured and run in CI
- [ ] Data construction tested for edge cases
- [ ] Implement Spatie Laravel Data Integration following crud-architecture patterns
- [ ] Configure all required settings for Spatie Laravel Data Integration
- [ ] Register route/middleware/service for Spatie Laravel Data Integration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Spatie Data objects are slightly slower than manual DTOs due to reflection-based construction and type casting
- [ ] For typical usage (10-50 DTO constructions per request), overhead is ~0.1-0.5ms â€” negligible
- [ ] The reflection overhead is incurred once per class per process, then cached

---

# Security Checklist

- [ ] Validation in Data classes runs automatically â€” ensure validation rules are as strict as FormRequest rules
- [ ] `Data::from()` with invalid input throws `DataValidationException` â€” catch it appropriately to avoid 500 errors
- [ ] TypeScript generation may expose internal DTO structure â€” review generated types for sensitive fields
- [ ] Custom casts must not introduce security vulnerabilities (e.g., executing code from input)

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Data classes use `extends Data` with typed constructor properties
- [ ] Construction uses `Data::from()`, not manual factories
- [ ] Validation rules are defined via `rules()` method where needed
- [ ] Custom casts are registered for application-specific types
- [ ] TypeScript generation is configured and run during CI
- [ ] Package approach is applied consistently across all DTOs
- [ ] DTO construction is tested for edge cases (missing keys, type mismatches)
- [ ] Package version is pinned and upgrade plan is documented
- [ ] Write feature tests for happy path of Spatie Laravel Data Integration
- [ ] Write feature tests for validation failure of Spatie Laravel Data Integration
- [ ] Write feature tests for authentication failure of Spatie Laravel Data Integration
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

- [ ] Avoid: Manual + Spatie Mix
- [ ] Avoid: Data as FormRequest Replacement
- [ ] Avoid: Ignoring Package Updates
- [ ] Avoid: Over-Reliance on Automatic Construction
- [ ] Avoid: Validation Exception in Controllers

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
- Rule 1: Choose One Approach â€” Package or Manual â€” and Apply Consistently
- Rule 2: Pin the Exact Package Version
- Rule 3: Decide on Validation Strategy â€” FormRequest + Data or Data-Only
- Rule 4: Test Data Class Construction for Edge Cases
- Rule 5: Configure TypeScript Generation and Run in CI
- Rule 6: Use Custom Casts for Application-Specific Types

### Anti-Patterns
- Manual + Spatie Mix
- Data as FormRequest Replacement
- Ignoring Package Updates
- Over-Reliance on Automatic Construction
- Validation Exception in Controllers



