# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Type Taxonomy
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Type Taxonomy implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Type Taxonomy
- [ ] Full test coverage for Error Type Taxonomy
- [ ] Security review completed for Error Type Taxonomy
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Type Taxonomy
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define three abstract base classes: `OperationalException`, `ProgrammerException`, `InfrastructureException`, all extending `ApiException`.
- [ ] Use a backed enum `ErrorCategory: string` for serialization and logging.
- [ ] Register category-specific render callbacks in `App\Exceptions\Handler::register()`.
- [ ] Map third-party library exceptions into the taxonomy explicitly â€” never let them land in an "unknown" bucket.
- [ ] Keep classification logic in a single `classify(Throwable): ErrorCategory` method.
- [ ] Store the category tag in every error log line for dashboard aggregation.

---

# Implementation Checklist

- [ ] Error types defined and mutually exclusive
- [ ] Each type mapped to correct HTTP status code
- [ ] Each error scenario classified into exactly one type
- [ ] Client vs server error distinction documented
- [ ] Severity per type defined
- [ ] Exceptions mapped to taxonomy types
- [ ] Taxonomy determines handling behavior
- [ ] Implement Error Type Taxonomy following error-handling-design patterns
- [ ] Configure all required settings for Error Type Taxonomy
- [ ] Register route/middleware/service for Error Type Taxonomy
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Classification is O(1) â€” a single `instanceof` check per base type.
- [ ] No measurable overhead at exception-handler scale (exceptions are not on the hot path).
- [ ] Avoid reflection-based classification; use explicit type checks.
- [ ] Pre-compile the classification map at boot time for maximum speed.

---

# Security Checklist

- [ ] Never expose the error category to API clients â€” it reveals internal system knowledge.
- [ ] Programmer error details (file paths, stack traces) must never appear in production responses.
- [ ] Infrastructure error messages can leak topology (e.g., "Redis connection failed" reveals caching infrastructure).
- [ ] Log category internally for debugging but strip from all external responses.
- [ ] Ensure third-party package exceptions are classified and sanitised.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All custom exception classes extend one of the three category base classes
- [ ] The handler contains a `classify()` method that returns `ErrorCategory` for any `Throwable`
- [ ] Every log line for errors includes the `error_category` tag
- [ ] CI contains a lint rule that fails if any `Throwable` is not classified
- [ ] Third-party package exceptions are explicitly mapped in the handler
- [ ] No programmer errors are silenced by being classified as operational
- [ ] Taxonomy is reviewed at least quarterly and updated as error patterns evolve
- [ ] Write feature tests for happy path of Error Type Taxonomy
- [ ] Write feature tests for validation failure of Error Type Taxonomy
- [ ] Write feature tests for authentication failure of Error Type Taxonomy
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

- [ ] Avoid: Single Catch-All Category
- [ ] Avoid: Classification by HTTP Status Code
- [ ] Avoid: No Default Classification
- [ ] Avoid: Classifying Programmer Errors as Operational
- [ ] Avoid: Dynamic Classification via Reflection
- [ ] Avoid: No Classification for Third-Party Exceptions

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
- Classify All Custom Exceptions into Exactly One of Three Categories
- Use instanceof for Classification, Never Reflection or String Matching
- Never Classify Programmer Errors as Operational
- Tag Every Error Log Line with the Error Category
- Map Every Third-Party Exception Explicitly to a Category
- Use Abstract Base Classes, Not Enums, for the Exception Hierarchy
- Review Taxonomy Quarterly

### Anti-Patterns
- Single Catch-All Category
- Classification by HTTP Status Code
- No Default Classification
- Classifying Programmer Errors as Operational
- Dynamic Classification via Reflection
- No Classification for Third-Party Exceptions

## Related Knowledge
- Standardized Error Envelope (carries the categorized error)
- Custom Exception Classes (makes taxonomy concrete)
- Global Exception Handler Config (where classification is applied)
- Incident severity classification (P0â€“P4 mirrors operational vs programmer)
- Chaos engineering â€” verifying taxonomy via fault injection



