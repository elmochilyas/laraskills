# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Custom Validation Rules
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Custom Validation Rules implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Custom Validation Rules
- [ ] Full test coverage for Custom Validation Rules
- [ ] Security review completed for Custom Validation Rules
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Custom Validation Rules
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Rule classes implement `Illuminate\Contracts\Validation\ValidationRule`.
- [ ] Store rule classes in `App\Rules\` directory.
- [ ] Name rule classes after what they validate: `ValidCurrencyRule`, `UniqueSkuRule`, `StartBeforeEndRule`.
- [ ] Register rules as services in the container if they have dependencies.
- [ ] Use inline closures only for trivial, non-reusable validation.
- [ ] For multi-field rules, pass data resolvers (closures) rather than the entire request.
- [ ] Override error messages with descriptive text that includes the field name.

---

# Implementation Checklist

- [ ] Rule class extends ValidationRule
- [ ] Constructor injection for parameters
- [ ] validate() method implementation
- [ ] Dependency injection for services
- [ ] Type-specific failure messages
- [ ] Registered in container
- [ ] Custom error codes
- [ ] Tested with valid and invalid data
- [ ] Implement Custom Validation Rules following input-validation-architecture patterns
- [ ] Configure all required settings for Custom Validation Rules
- [ ] Register route/middleware/service for Custom Validation Rules
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Rule classes are resolved per-validation â€” cache expensive computations in constructor.
- [ ] Closure rules cannot be serialized â€” use Rule classes if caching route definitions.
- [ ] Avoid DB queries inside `__invoke()` â€” batch queries in constructor.
- [ ] `Rule::when()` adds condition evaluation overhead â€” negligible for single use.
- [ ] Rules with external API calls should have short timeouts and caching.

---

# Security Checklist

- [ ] Never include raw user input in error messages without sanitization.
- [ ] Rule classes should not log or expose sensitive validation data.
- [ ] Multi-field rules should not leak data about other fields in error messages.
- [ ] Ensure rules that check existence (DB lookups) are bounded by authorization.
- [ ] Rule classes with dependencies should not store sensitive data as constructor parameters.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Rule classes implement `ValidationRule` interface with `__invoke`
- [ ] All rules call `$fail()` for invalid values (no return values used)
- [ ] No Rule class injects the `Request` object
- [ ] Rule classes are stateless â€” no shared instance state across invocations
- [ ] Rules with dependencies use constructor injection
- [ ] Rule classes are in `App\Rules\` with descriptive naming
- [ ] Unit tests exist for each custom rule with both pass and fail cases
- [ ] Write feature tests for happy path of Custom Validation Rules
- [ ] Write feature tests for validation failure of Custom Validation Rules
- [ ] Write feature tests for authentication failure of Custom Validation Rules
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

- [ ] Avoid: Returning bool Instead of Calling $fail
- [ ] Avoid: Stateful Rule Instances
- [ ] Avoid: Injecting Request Into Rules
- [ ] Avoid: Throwing Exceptions Inside Rules
- [ ] Avoid: One Gigantic Rule Class

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
- Prefer Rule Classes over Closures for Reusable Logic
- Call $fail(), Never Return bool
- Inject Dependencies via Constructor, Never Inject the Request
- Keep Rules Stateless â€” No Instance Properties Across Invocations
- Batch Expensive Operations in Constructor, Not __invoke()
- Name Rules After the Constraint, Not the Field
- Never Throw Exceptions Inside Rules â€” Use $fail()

### Anti-Patterns
- Returning bool Instead of Calling $fail
- Stateful Rule Instances
- Injecting Request Into Rules
- Throwing Exceptions Inside Rules
- One Gigantic Rule Class

## Related Knowledge
- Form Request Design for APIs (base request hosting custom rules)
- Validation Rule Array Design (custom rules applied to array elements)
- Conditional Validation Patterns (combining custom rules with conditionals)
- Manual Validator Creation (using custom rules outside FormRequests)
- After Validation Hooks (post-validation with custom rule data)



