# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Organization by Domain
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Organization by Domain implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Organization by Domain
- [ ] Full test coverage for Controller Organization by Domain
- [ ] Security review completed for Controller Organization by Domain
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Organization by Domain
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Each domain directory should contain its own `Requests/` subdirectory for form requests.
- [ ] Route groups use both `prefix` and `namespace` to point to the domain directory.
- [ ] Define a `Shared/` or `Common/` directory for cross-domain code.
- [ ] Add a PHPStan or Deptrac rule: `Billing/` controllers cannot import from `Inventory/`.
- [ ] Only introduce domain directories when there are 20+ controllers.
- [ ] Evaluate: Domain Organization Threshold

---

# Implementation Checklist

- [ ] Each controller maps to one resource or domain concept
- [ ] Controller namespace matches domain folder (e.g., `App\Http\Controllers\Billing`)
- [ ] Standard resource actions are in a single resource controller
- [ ] Non-CRUD actions have dedicated controllers or action classes
- [ ] No controller spans multiple domains
- [ ] Routing groups reflect domain boundaries
- [ ] Controller file structure is consistent across the team
- [ ] Implement Controller Organization by Domain following resource-controllers patterns
- [ ] Configure all required settings for Controller Organization by Domain
- [ ] Register route/middleware/service for Controller Organization by Domain
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] No performance impact from directory organization â€” PSR-4 autoloads by class name.
- [ ] Opcode cache stores all classes regardless of directory depth.
- [ ] Route caching compiles all route files into a single cache regardless of organization.

---

# Security Checklist

- [ ] Cross-domain import restrictions prevent accidental coupling but not security issues directly.
- [ ] Ensure domain-specific middleware (e.g., `billing.verified`) is consistently applied within each domain.
- [ ] Authorization policies should be organized alongside their domain controllers.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Controllers are organized by domain (Billing, Inventory, etc.), not flat
- [ ] Each domain has its own route file or route group
- [ ] Cross-domain imports are restricted via PHPStan or Deptrac
- [ ] Form requests are co-located in domain-specific `Requests/` directories
- [ ] `php artisan make:controller DomainName/ControllerName` generates in the correct location
- [ ] Domain organization has a documented naming convention
- [ ] Write feature tests for happy path of Controller Organization by Domain
- [ ] Write feature tests for validation failure of Controller Organization by Domain
- [ ] Write feature tests for authentication failure of Controller Organization by Domain
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

- [ ] Avoid: Flat Controller Structure
- [ ] Avoid: Mixed Domain and Generic Controllers
- [ ] Avoid: Cross-Domain Controller Responsibilities
- [ ] Avoid: No Namespace Convention
- [ ] Avoid: Overly Granular Separation

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
- Group Controllers By Bounded Context
- Co-Locate Form Requests With Domain Controllers
- Enforce Cross-Domain Dependency Rules
- Use Domain-Specific Route Files
- Use Singular Directory Names

### Decisions
- Domain Organization Threshold

### Anti-Patterns
- Flat Controller Structure
- Mixed Domain and Generic Controllers
- Cross-Domain Controller Responsibilities
- No Namespace Convention
- Overly Granular Separation

## Related Knowledge
- Controller Organization by Version â€” Alternative organization strategy
- Controller Code Limits â€” Pairing limits with domain organization
- Thin Controller Enforcement â€” Automated rules per domain



