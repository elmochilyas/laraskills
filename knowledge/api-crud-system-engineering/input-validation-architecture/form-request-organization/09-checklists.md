# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Form Request Organization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Form Request Organization implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Form Request Organization
- [ ] Full test coverage for Form Request Organization
- [ ] Security review completed for Form Request Organization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Form Request Organization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Layout: `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`
- [ ] Suffix mapping: `Index`, `Store`, `Show`, `Update`, `Destroy`, `BulkStore` + resource name.
- [ ] Base request per resource: `Base{Resource}Request` with shared rules.
- [ ] Application-wide base: `App\Http\Requests\Api\ApiRequest` overriding `failedValidation()` and `failedAuthorization()`.
- [ ] Use `git mv` when renaming endpoints to preserve file history.
- [ ] For versioned APIs, maintain parallel directory trees (`V1/`, `V2/`).

---

# Implementation Checklist

- [ ] Directory per version: `Requests/Api/V1/User/`
- [ ] Store, Update, Index, Destroy separate requests
- [ ] Versioned namespace
- [ ] Base class for shared validation
- [ ] Rules reused via trait/base class
- [ ] Store and Update separated
- [ ] Organization documented
- [ ] Implement Form Request Organization following input-validation-architecture patterns
- [ ] Configure all required settings for Form Request Organization
- [ ] Register route/middleware/service for Form Request Organization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Deep namespaces have zero runtime cost â€” autoloader only loads used files.
- [ ] Avoid loading all FormRequests in a ServiceProvider â€” register only when needed.
- [ ] Base request classes should be `abstract` to prevent direct instantiation.
- [ ] Autoloader caching (Composer optimized) reduces filesystem lookups.

---

# Security Checklist

- [ ] Versioned namespaces prevent old request classes from being accidentally loaded.
- [ ] Base request classes enforce consistent authorization and error handling.
- [ ] Inheritance chains should be limited to 2 levels max to prevent security logic from being buried.
- [ ] CI should validate that all FormRequests extend the correct base class.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All FormRequests follow `App\Http\Requests\Api\V{N}\{Resource}\{Action}Request` convention
- [ ] Action suffix matches HTTP method (Index, Store, Show, Update, Destroy)
- [ ] A base `ApiRequest` class exists in `App\Http\Requests\Api\`
- [ ] Per-resource base requests are prefixed `Base`
- [ ] No flat directory with mixed resources
- [ ] No single file handling both Store and Update via `isMethod()`
- [ ] CI validates directory structure against API route definitions
- [ ] Write feature tests for happy path of Form Request Organization
- [ ] Write feature tests for validation failure of Form Request Organization
- [ ] Write feature tests for authentication failure of Form Request Organization
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

- [ ] Avoid: Flat Requests Directory With 100+ Files
- [ ] Avoid: Actions as Directories
- [ ] Avoid: No Base Request Class
- [ ] Avoid: Abstract Naming Without Base Prefix
- [ ] Avoid: Mix of Web and API Requests in Same Directory

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
- Organize by Resource, Then Action
- Use Action-Suffixed Naming
- Version the Namespace Always
- Create a Base ApiRequest for Shared Behavior
- Use Base{Resource}Request for Shared Store/Update Rules
- Limit Inheritance to 2 Levels Max
- Keep API Requests Separate from Web Requests

### Anti-Patterns
- Flat Requests Directory With 100+ Files
- Actions as Directories
- No Base Request Class
- Abstract Naming Without Base Prefix
- Mix of Web and API Requests in Same Directory

## Related Knowledge
- Form Request Design for APIs (the request class structure being organized)
- Authorization in Form Requests (authorize() placement)
- DTO Integration: payload() Method (payload() within organized requests)
- Conditional Validation Patterns (conditional rules across request classes)



