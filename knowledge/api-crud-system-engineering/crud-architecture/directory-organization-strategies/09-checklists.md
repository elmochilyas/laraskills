# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Directory Organization Strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Directory Organization Strategies implementation follows crud-architecture patterns
- [ ] All edge cases handled for Directory Organization Strategies
- [ ] Full test coverage for Directory Organization Strategies
- [ ] Security review completed for Directory Organization Strategies
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Directory Organization Strategies
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel's default structure is layer-first â€” use it for most applications <50 models
- [ ] Domain-first requires PSR-4 prefix mapping: `"App\\Users\\": "app/Domain/Users/"`
- [ ] Migrate from layer-first to domain-first one domain at a time, never in a single commit
- [ ] Use a `Shared/` directory for cross-cutting types in domain-first structures
- [ ] Domains should not depend on each other â€” extract shared types to `Shared/`

---

# Implementation Checklist

- [ ] Controllers, Requests, Resources, Actions directories
- [ ] Version subdirectories
- [ ] Domain subdirectories
- [ ] Namespace matches directory structure
- [ ] PSR-4 autoloading configured
- [ ] Base classes for shared logic
- [ ] Directory structure documented
- [ ] Implement Directory Organization Strategies following crud-architecture patterns
- [ ] Configure all required settings for Directory Organization Strategies
- [ ] Register route/middleware/service for Directory Organization Strategies
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Directory structure has zero performance impact â€” autoloading uses namespace-to-path mapping
- [ ] OpCache caches compiled files regardless of directory layout
- [ ] Domain-first with many nested directories does not affect runtime performance

---

# Security Checklist

- [ ] Directory structure does not affect security â€” access control is determined by middleware and authorization
- [ ] Domain-first structures don't provide security isolation between domains â€” that requires separate process boundaries
- [ ] Filesystem permissions should be uniform across the application directory

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Namespace matches directory path for all classes
- [ ] PSR-4 autoloading is correctly configured in composer.json
- [ ] Primary organization strategy is applied consistently
- [ ] Domain boundaries are respected (no circular domain dependencies)
- [ ] Layer isolation is maintainable within the chosen structure
- [ ] `composer dump-autoload` has been run after structure changes
- [ ] IDE navigation (find class, go to file) works correctly with the chosen strategy
- [ ] Write feature tests for happy path of Directory Organization Strategies
- [ ] Write feature tests for validation failure of Directory Organization Strategies
- [ ] Write feature tests for authentication failure of Directory Organization Strategies
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

- [ ] Avoid: Namespace Confusion
- [ ] Avoid: Circular Domain Dependencies
- [ ] Avoid: Architecture By URL
- [ ] Avoid: Premature Domain-First
- [ ] Avoid: Inconsistent Strategy Mix

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
- Rule 1: Choose One Primary Strategy and Apply Consistently
- Rule 2: Always Match Namespace to Directory Path
- Rule 3: Start Layer-First by Default; Graduate to Domain-First When Justified
- Rule 4: Configure PSR-4 Prefix Mapping for Domain-First Structures
- Rule 5: Extract Shared Types to a Common Directory
- Rule 6: Never Couple Directory Structure to URL Structure

### Anti-Patterns
- Namespace Confusion
- Circular Domain Dependencies
- Architecture By URL
- Premature Domain-First
- Inconsistent Strategy Mix



