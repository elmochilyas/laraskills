# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Custom Exception Classes
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Custom Exception Classes implementation follows error-handling-design patterns
- [ ] All edge cases handled for Custom Exception Classes
- [ ] Full test coverage for Custom Exception Classes
- [ ] Security review completed for Custom Exception Classes
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Custom Exception Classes
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Base `ApiException` extends `\RuntimeException` with abstract `getCategory(): ErrorCategory`.
- [ ] Category base classes (`OperationalException`, `ProgrammerException`, `InfrastructureException`) are abstract and final-constructor.
- [ ] Domain exception classes extend the appropriate category base class.
- [ ] Each domain exception sets error code, status code, message, and context in its constructor.
- [ ] Implement `HasErrorEnvelope` trait on the base class for `toEnvelope()` method.
- [ ] Register all custom exception classes in the handler's mapping table.
- [ ] PHPStan rule: all `ApiException` subclasses must be registered.

---

# Implementation Checklist

- [ ] Custom exception classes extend HttpException or base Exception
- [ ] Constructor accepts message, status code, error code
- [ ] `render()` returns consistent JSON error envelope
- [ ] Application-specific error code included
- [ ] Detail and source pointer included where applicable
- [ ] `report()` for selective logging
- [ ] Exceptions used in actions/services
- [ ] `$dontReport` configured in Handler
- [ ] Exception hierarchy is flat
- [ ] Exception types documented
- [ ] Implement Custom Exception Classes following error-handling-design patterns
- [ ] Configure all required settings for Custom Exception Classes
- [ ] Register route/middleware/service for Custom Exception Classes
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Exception construction is rare â€” not on the hot path.
- [ ] `readonly` properties reduce memory overhead slightly.
- [ ] Stack trace generation on `throw` is the dominant cost (not class design).
- [ ] Never inject services into exceptions â€” they are serialized and logged, services cause serialisation errors.

---

# Security Checklist

- [ ] Never include sensitive data (passwords, tokens, PII) in exception context.
- [ ] Context is logged â€” ensure sensitive data is not logged.
- [ ] Exception classes names should not leak internal system details.
- [ ] `__toString()` includes the stack trace with file paths â€” override to prevent log leakage.
- [ ] PHP 8.2+ `sensitive_parameter` attribute marks function parameters as redactable from stack traces.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Base hierarchy: ApiException â†’ {Operational, Programmer, Infrastructure} â†’ domain classes
- [ ] All properties are `readonly` or the class is `readonly`
- [ ] No business logic exists in any exception class (no logging, DB, notifications)
- [ ] Each domain exception has a unique error code from the registry
- [ ] Exception classes are in the `app/Domains/{Domain}/Exceptions/` directory
- [ ] All exception classes are registered in the handler
- [ ] CI/PHPStan enforces registration requirement
- [ ] Context is limited to 5 fields max, no sensitive data
- [ ] Write feature tests for happy path of Custom Exception Classes
- [ ] Write feature tests for validation failure of Custom Exception Classes
- [ ] Write feature tests for authentication failure of Custom Exception Classes
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

- [ ] Avoid: Catch-All Exception Classes
- [ ] Avoid: Exception Classes with Services
- [ ] Avoid: Exception as DTO
- [ ] Avoid: Exception in Wrong Category
- [ ] Avoid: Deep Inheritance Beyond 3 Levels
- [ ] Avoid: Forgotten Registration

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
- One Exception Class Per Error Code
- Never Include Business Logic in Exception Constructors
- Mark All Exception Properties as readonly
- Use Static Factory Methods for Varying Exception Contexts
- Use Three-Level Inheritance Hierarchy Maximum
- Place All Domain Exceptions in app/Domains/{Domain}/Exceptions/
- Register All Custom Exception Classes in the Handler
- Limit Exception Context to 5 Fields Maximum

### Anti-Patterns
- Catch-All Exception Classes
- Exception Classes with Services
- Exception as DTO
- Exception in Wrong Category
- Deep Inheritance Beyond 3 Levels
- Forgotten Registration

## Related Knowledge
- Error Type Taxonomy (determines the base exception class)
- Domain-Specific Error Codes (each class maps to a code)
- Exception-to-Code Mapping (how exceptions map to response codes)
- Global Exception Handler Config (where exceptions are caught)
- Sensitive Data Leak Prevention (context must be safe to log)



