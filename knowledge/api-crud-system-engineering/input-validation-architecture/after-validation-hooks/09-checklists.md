# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** After Validation Hooks
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] After Validation Hooks implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for After Validation Hooks
- [ ] Full test coverage for After Validation Hooks
- [ ] Security review completed for After Validation Hooks
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for After Validation Hooks
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `passedValidation()` for in-memory data transformations only (no I/O).
- [ ] Use `Validator::after()` for external service validation that must block the request.
- [ ] Wrap `after()` body in try/catch to prevent 500 errors on service failures.
- [ ] Log `passedValidation()` side effects for debugging.
- [ ] Keep `passedValidation()` methods focused â€” one transformation per hook.
- [ ] Consider extracting complex after-validation logic to dedicated classes.

---

# Implementation Checklist

- [ ] `passedValidation()` is defined on the Form Request, not in the controller
- [ ] Side-effect logic references validated data only
- [ ] Logging messages include correlation ID and timestamp
- [ ] No data transformation occurs in `passedValidation()`
- [ ] Audit events are dispatched when required by compliance rules
- [ ] Implement After Validation Hooks following input-validation-architecture patterns
- [ ] Configure all required settings for After Validation Hooks
- [ ] Register route/middleware/service for After Validation Hooks
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `after()` callbacks run synchronously during validation â€” slow callbacks delay the response.
- [ ] External API calls in `after()` should have short timeouts (2-3s).
- [ ] `passedValidation()` is fast â€” use for in-memory transformations only.
- [ ] Avoid DB queries in `passedValidation()` â€” they add latency to the validation pipeline.
- [ ] Multiple `after()` callbacks run sequentially â€” minimize count.

---

# Security Checklist

- [ ] Never trust user input in `passedValidation()` â€” validate before transforming.
- [ ] External service calls in `after()` may fail â€” handle failures gracefully without exposing internals.
- [ ] Audit fields injected in `passedValidation()` (user ID, IP) must come from authenticated context, not user input.
- [ ] `merge()` after validation does not re-validate â€” ensure merged data is safe.
- [ ] Log transformations for auditability.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `passedValidation()` contains only in-memory transformations
- [ ] `Validator::after()` callbacks check `errors()->isEmpty()` first
- [ ] External API calls in `after()` have explicit timeouts and try/catch
- [ ] No DB writes or job dispatches exist in any validation hook
- [ ] Merged data uses new keys, not overwrites of validated fields
- [ ] Logging exists for after-validation transformations
- [ ] Integration tests verify data transformations in hooks
- [ ] Write feature tests for happy path of After Validation Hooks
- [ ] Write feature tests for validation failure of After Validation Hooks
- [ ] Write feature tests for authentication failure of After Validation Hooks
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

- [ ] Avoid: passedValidation as Dumping Ground
- [ ] Avoid: Side Effects in passedValidation
- [ ] Avoid: after Callback Without Error Check
- [ ] Avoid: External API Calls Without Timeout
- [ ] Avoid: Modifying Validated Data After Hooks

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
- Keep passedValidation() Side-Effect Free
- Check errors()->isEmpty() in after() Callbacks
- Use passedValidation() for Data, after() for Cross-Field Checks
- Wrap External Service Calls in after() With try/catch
- Merge New Keys, Never Overwrite Validated Keys
- Set Short Timeouts on External Calls in after()

### Anti-Patterns
- passedValidation as Dumping Ground
- Side Effects in passedValidation
- after Callback Without Error Check
- External API Calls Without Timeout
- Modifying Validated Data After Hooks

## Related Knowledge
- Form Request Design for APIs (the request class providing hooks)
- Conditional Validation Patterns (interaction between conditionals and after hooks)
- Input Preparation (pre-validation hooks that complement post-validation)
- DTO Integration: payload() Method (preparing data for DTO creation after validation)
- Manual Validator Creation (after hooks in non-FormRequest validation)



