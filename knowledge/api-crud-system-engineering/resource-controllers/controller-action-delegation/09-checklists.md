# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Action Delegation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Action Delegation implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Action Delegation
- [ ] Full test coverage for Controller Action Delegation
- [ ] Security review completed for Controller Action Delegation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Action Delegation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] One action class per controller method that needs business logic.
- [ ] Controller constructors should contain only action classes, not repositories or domain services directly.
- [ ] Use `__invoke` for single-method action classes, or `execute()` / `handle()` / `run()` for named methods.
- [ ] Write tests for action classes without HTTP concerns (pure unit tests).
- [ ] Over-delegation for simple CRUD is an anti-pattern â€” delegate only when the method exceeds one line or has logic beyond a simple query.
- [ ] Evaluate: Delegation Threshold Decision

---

# Implementation Checklist

- [ ] Actions injected into controller
- [ ] Form Request handles validation
- [ ] `$this->authorize()` called before action
- [ ] DTO created from validated request
- [ ] Action called with DTO
- [ ] Action result transformed to Resource
- [ ] Controller < 10 lines per method
- [ ] Action has single responsibility
- [ ] Implement Controller Action Delegation following resource-controllers patterns
- [ ] Configure all required settings for Controller Action Delegation
- [ ] Register route/middleware/service for Controller Action Delegation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each delegation adds one PHP method call and autoload â€” negligible (sub-millisecond).
- [ ] Opcode cache caches action classes after first request.
- [ ] Mark expensive-to-construct actions as singletons in the container.

---

# Security Checklist

- [ ] Actions should not receive the `Request` object directly; receive only validated data arrays.
- [ ] Authorization should happen before delegation (in form request's `authorize()` or policy).
- [ ] Actions are unaware of authentication context â€” pass user ID explicitly if needed.
- [ ] Ensure action exceptions don't leak sensitive information to HTTP responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] No controller method contains inline business logic beyond a delegation call
- [ ] Action classes are injected via constructor (not instantiated inline)
- [ ] Action classes return domain objects (not HTTP responses)
- [ ] Action classes are testable without HTTP concerns
- [ ] Controller constructors contain only action classes, not repositories
- [ ] Write feature tests for happy path of Controller Action Delegation
- [ ] Write feature tests for validation failure of Controller Action Delegation
- [ ] Write feature tests for authentication failure of Controller Action Delegation
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

- [ ] Avoid: Controller Does Everything Inline
- [ ] Avoid: Inconsistent Delegation Pattern
- [ ] Avoid: Delegating Too Early
- [ ] Avoid: Missing Error Handling After Delegation
- [ ] Avoid: Action Returns HTTP Response

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
- Delegate Business Logic Out Of Controllers
- Inject Action Classes Via Constructor
- Actions Must Return Domain Objects, Never HTTP Responses
- Name Action Classes With Verb-First Naming
- Keep Action Classes Stateless
- Limit Action Class Constructor Dependencies To Four

### Decisions
- Delegation Threshold Decision

### Anti-Patterns
- Controller Does Everything Inline
- Inconsistent Delegation Pattern
- Delegating Too Early
- Missing Error Handling After Delegation
- Action Returns HTTP Response

## Related Knowledge
- Controller Dependency Injection â€” How actions are injected into controllers
- Single-Action Invokable Controllers â€” Controllers that are themselves single-action
- Thin Controller Enforcement â€” Automated rules enforcing delegation



