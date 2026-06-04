# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Organization by Version
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Organization by Version implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Organization by Version
- [ ] Full test coverage for Controller Organization by Version
- [ ] Security review completed for Controller Organization by Version
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Organization by Version
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Register each version as a separate route group with distinct prefix and namespace.
- [ ] Pin V1 controllers to V1-specific service bindings using contextual binding.
- [ ] For minimal changes, extend V1 and override only changed methods.
- [ ] Maintain a changelog per version directory.
- [ ] Archive old version directories to `_archive/` rather than deleting immediately.
- [ ] Evaluate: Versioning Strategy Selection

---

# Implementation Checklist

- [ ] Controllers organized by version in directories
- [ ] Versioned namespaces
- [ ] Versioned route files
- [ ] Registered in RouteServiceProvider
- [ ] Version-specific logic in version controllers
- [ ] Controller removed on version sunset
- [ ] Implement Controller Organization by Version following resource-controllers patterns
- [ ] Configure all required settings for Controller Organization by Version
- [ ] Register route/middleware/service for Controller Organization by Version
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Route cache size grows linearly with versions Ã— routes â€” still negligible for practical numbers.
- [ ] Only the requested version's controller is autoloaded per request.
- [ ] PHP opcode cache handles the increased file count without significant impact.
- [ ] Database query differences between versions (e.g., V2 adds eager loads) dominate performance.

---

# Security Checklist

- [ ] Route name collisions between versions can cause unexpected URL generation â€” use versioned prefixes.
- [ ] Missing V2 implementation methods cause 404s for V2 clients â€” enforce implementation parity.
- [ ] Shared services modified for V2 can silently break V1 â€” pin V1 to dedicated bindings.
- [ ] Deprecation headers (`Deprecation`, `Sunset`) should be added to deprecated version responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each version has its own controller directory and namespace
- [ ] Route files are split per version (`routes/api/v1.php`, `routes/api/v2.php`)
- [ ] Route name prefixes are versioned (e.g., `v1.photos.index`, `v2.photos.index`)
- [ ] V2 controllers exist for all V1 controller methods (no missing endpoints)
- [ ] V1 and V2 test suites run independently in CI
- [ ] Deprecated versions have `Deprecation` and `Sunset` headers
- [ ] Shared services are pinned per version when behavior differs
- [ ] Write feature tests for happy path of Controller Organization by Version
- [ ] Write feature tests for validation failure of Controller Organization by Version
- [ ] Write feature tests for authentication failure of Controller Organization by Version
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

- [ ] Avoid: Version Clutter in Single Controller
- [ ] Avoid: Duplicated Controllers Across Versions
- [ ] Avoid: Missing Base Version Controller
- [ ] Avoid: Inconsistent Version Directory Structure
- [ ] Avoid: Versioned Mixed with Unversioned

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
- Use URL Prefix Versioning
- Duplicate Controllers By Default, Inherit For Minor Changes
- Run Versioned Test Suites Independently
- Pin V1 Controllers To V1-Specific Service Bindings
- Add Deprecation And Sunset Headers
- Maintain Implementation Parity Across Versions

### Decisions
- Versioning Strategy Selection

### Anti-Patterns
- Version Clutter in Single Controller
- Duplicated Controllers Across Versions
- Missing Base Version Controller
- Inconsistent Version Directory Structure
- Versioned Mixed with Unversioned

## Related Knowledge
- Controller Organization by Domain â€” Alternative organization strategy
- API Versioning Strategies â€” Broader versioning approaches
- Controller Testing Strategies â€” Testing multiple API versions



