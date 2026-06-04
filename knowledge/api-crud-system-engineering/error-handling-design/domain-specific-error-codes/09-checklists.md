# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Domain Specific Error Codes
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Domain Specific Error Codes implementation follows error-handling-design patterns
- [ ] All edge cases handled for Domain Specific Error Codes
- [ ] Full test coverage for Domain Specific Error Codes
- [ ] Security review completed for Domain Specific Error Codes
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Domain Specific Error Codes
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Each custom exception class defines a `getErrorCode(): string` method returning the code constant.
- [ ] The global exception handler calls `getErrorCode()` and places it in the envelope.
- [ ] A central `ErrorCodes` class (or backed enum) enumerates all codes as constants.
- [ ] CI enforces no duplicate values in the registry.
- [ ] Use code prefix by domain: `USER_*`, `ORDER_*`, `PAYMENT_*`.
- [ ] Keep the exception class name and error code one-to-one: `UserNotFoundError` â†’ `USER_NOT_FOUND`.

---

# Implementation Checklist

- [ ] Error code format defined and consistent
- [ ] One error code per distinct error scenario
- [ ] Codes grouped by domain and subdomain
- [ ] Each error code documented with trigger and recovery
- [ ] Error codes implemented as constants or enum
- [ ] Exception-to-code mapping in handler
- [ ] Error code included in all error responses
- [ ] Implement Domain Specific Error Codes following error-handling-design patterns
- [ ] Configure all required settings for Domain Specific Error Codes
- [ ] Register route/middleware/service for Domain Specific Error Codes
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] String comparison for code matching is trivial â€” no performance concern.
- [ ] Enumeration/all-codes listing is a documentation-time concern, not runtime.
- [ ] The registry file is autoloaded once and cached by OPcache.
- [ ] Code resolution adds no measurable overhead to error response generation.

---

# Security Checklist

- [ ] Error codes themselves are safe to expose â€” they are identifiers, not data.
- [ ] Never include dynamic values (user IDs, emails) inside the error code string.
- [ ] Do not use error codes to infer internal system structure (e.g., `DB_CONNECTION_FAILED` reveals database type).
- [ ] Ensure codes do not leak business logic details (e.g., `ORDER_MINIMUM_NOT_MET` reveals pricing strategy).
- [ ] Document publicly which codes are exposed vs internal-only.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All error codes are defined as constants in the central `ErrorCodes` registry
- [ ] Every custom exception class implements `getErrorCode()` returning a registry constant
- [ ] No two exception classes return the same error code
- [ ] CI enforces that all thrown error codes exist in the registry
- [ ] Error code reference documentation is auto-generated from the registry
- [ ] Total code count is between 20 and 50 per API version
- [ ] No code has been repurposed or removed â€” only deprecated
- [ ] Write feature tests for happy path of Domain Specific Error Codes
- [ ] Write feature tests for validation failure of Domain Specific Error Codes
- [ ] Write feature tests for authentication failure of Domain Specific Error Codes
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

- [ ] Avoid: Single Code for All Errors
- [ ] Avoid: Codes Embedded in Messages
- [ ] Avoid: Dynamic Code Generation
- [ ] Avoid: Frame-Shifting Codes
- [ ] Avoid: Codes as Translated Strings

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
- Use Descriptive String Error Codes, Never Numeric
- Define All Error Codes in a Central Registry
- Never Change an Error Code's Meaning After Release
- Use Domain Prefix for Automatic Groupability
- Keep Error Code Count Between 20 and 50 Per API Version
- Never Include Dynamic Values Inside Error Code Strings
- Enforce One-to-One Exception Class to Error Code Mapping
- Document Every Error Code in the API Reference

### Anti-Patterns
- Single Code for All Errors
- Codes Embedded in Messages
- Dynamic Code Generation
- Frame-Shifting Codes
- Codes as Translated Strings

## Related Knowledge
- Error Code Namespace Design (hierarchical code organization)
- Exception-to-Code Mapping (connecting exceptions to codes)
- Custom Exception Classes (each class maps to one code)
- Standardized Error Envelope (the `code` field inside the envelope)
- Error Response Testing (asserting error codes in tests)



