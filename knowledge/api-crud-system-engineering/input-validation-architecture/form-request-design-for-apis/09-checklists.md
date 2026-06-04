# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Form Request Design For Apis
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Form Request Design For Apis implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Form Request Design For Apis
- [ ] Full test coverage for Form Request Design For Apis
- [ ] Security review completed for Form Request Design For Apis
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Form Request Design For Apis
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] All API FormRequests extend a base `App\Http\Requests\Api\ApiRequest` class.
- [ ] The base class overrides `failedValidation()` to return consistent JSON error envelopes.
- [ ] Use array syntax exclusively for rules â€” never pipe-delimited strings.
- [ ] Keep `rules()` methods readable by extracting complex logic to dedicated helper methods.
- [ ] Use constructor injection for repositories/services needed in rule generation.
- [ ] Place FormRequests in `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`.

---

# Implementation Checklist

- [ ] Base `ApiRequest` class with overridden `failedValidation()`
- [ ] One FormRequest per action (not shared via `isMethod()`)
- [ ] Array syntax for all validation rules
- [ ] Explicit `authorize()` method in every FormRequest
- [ ] `validationData()` overridden to scope input
- [ ] `$stopOnFirstFailure` configured appropriately
- [ ] Dependencies injected via constructor
- [ ] FormRequest type-hinted in controller signature
- [ ] Implement Form Request Design For Apis following input-validation-architecture patterns
- [ ] Configure all required settings for Form Request Design For Apis
- [ ] Register route/middleware/service for Form Request Design For Apis
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] FormRequests are resolved once per request and reused â€” singleton-like in request lifecycle.
- [ ] Avoid database queries inside `rules()` for every field; batch queries in constructor.
- [ ] Use `Rule::unique()->ignore($id)` instead of `exists` + `whereNot` closure.
- [ ] `validationData()` filtering reduces validator workload on large payloads.
- [ ] Setting `$stopOnFirstFailure` reduces processing for batch validation.

---

# Security Checklist

- [ ] `authorize()` runs before `rules()` â€” prevents unauthorized actors from triggering validation.
- [ ] Never include sensitive data in validation error messages.
- [ ] Sanitize input in `prepareForValidation()` before rules evaluate.
- [ ] Use `validationData()` to exclude route parameters from validation scope.
- [ ] Log validation failures at warning level for observability.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All FormRequests extend a base `ApiRequest` class with overridden `failedValidation()`
- [ ] Array syntax used for all validation rules
- [ ] `authorize()` method is explicitly defined in every FormRequest
- [ ] `validationData()` is overridden to restrict input scope
- [ ] No pipe-delimited string rules exist
- [ ] `$stopOnFirstFailure` is configured appropriately
- [ ] FormRequest unit tests exist for critical validation scenarios
- [ ] Write feature tests for happy path of Form Request Design For Apis
- [ ] Write feature tests for validation failure of Form Request Design For Apis
- [ ] Write feature tests for authentication failure of Form Request Design For Apis
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

- [ ] Avoid: Single FormRequest for Store and Update
- [ ] Avoid: Rules Method With DB Queries for Every Field
- [ ] Avoid: FormRequest With No authorize Method
- [ ] Avoid: Pipe-Delimited Rules
- [ ] Avoid: FormRequest as a Dumping Ground

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
- Always Use Array Syntax for Validation Rules
- Define authorize() in Every FormRequest
- Override failedValidation() in a Base ApiRequest Class
- Use One FormRequest Per Action
- Inject Dependencies via Constructor, Not Facades
- Override validationData() to Control Input Scope
- Use $stopOnFirstFailure for Write-Heavy Endpoints

### Anti-Patterns
- Single FormRequest for Store and Update
- Rules Method With DB Queries for Every Field
- FormRequest With No authorize Method
- Pipe-Delimited Rules
- FormRequest as a Dumping Ground

## Related Knowledge
- Form Request Organization (directory placement and naming)
- Authorization in Form Requests (authorize() mechanics)
- Validation Rule Array Design (array and wildcard rules)
- Custom Validation Rules (rule objects and closures)
- Validation Error Shape Customization (customizing error responses)



