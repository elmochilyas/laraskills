# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** API Versioning
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Prefer URI Versioning
- [ ] Verify: Use Controller Inheritance for Migration
- [ ] Verify: Version Resources Separately
- [ ] Verify: Document Deprecation
- [ ] URI prefix used for versioning (`/api/v1/`) â€” no header or query parameter versioning
- [ ] All versions use the same authentication middleware
- [ ] Maximum 2 active major versions
- [ ] Older version has deprecation headers configured
- [ ] V1 routes return V1 controllers, V2 routes return V2 controllers
- [ ] `php artisan route:list` shows all versioned routes
- [ ] Route caching works with versioned route groups
- [ ] Performance: Versioning adds no direct performance overhead. The routing layer handles ver...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### URI Version Structure
- [ ] Architecture guideline: Route::prefix('api')->group(function () {
- [ ] Architecture guideline: Route::prefix('v1')->group(function () {
- [ ] Architecture guideline: Route::apiResource('users', Api\V1\UserController::class);
- [ ] Architecture guideline: Route::prefix('v2')->group(function () {
- [ ] Architecture guideline: Route::apiResource('users', Api\V2\UserController::class);
- [ ] Architecture guideline: ### Controller Inheritance
- [ ] Architecture guideline: namespace App\Http\Controllers\Api\V2;
- [ ] Architecture guideline: use App\Http\Controllers\Api\V1\UserController as V1UserController;
- [ ] Architecture guideline: class UserController extends V1UserController
- [ ] Architecture guideline: // Override only changed endpoints
- [ ] Architecture guideline: public function show($id)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Prefer URI Versioning
- [ ] Best practice: Use Controller Inheritance for Migration
- [ ] Best practice: Version Resources Separately
- [ ] Best practice: Document Deprecation
- [ ] Skill applied: Implement URI-Based API Versioning
- [ ] Skill applied: Migrate API Versions Using Controller Inheritance

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Versioning adds no direct performance overhead. The routing layer handles version-specific matching via standard grou...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Deprecated Version Vulnerabilities
- [ ] Old API versions often lack security fixes applied to newer versions. Consider rate-limiting deprecated versions more...
- [ ] ### Authentication Consistency
- [ ] All versions should use the same authentication mechanism. Different auth schemes per version create security confusi...

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] URI prefix used for versioning (`/api/v1/`) â€” no header or query parameter versioning
- [ ] All versions use the same authentication middleware
- [ ] Maximum 2 active major versions
- [ ] Older version has deprecation headers configured
- [ ] V1 routes return V1 controllers, V2 routes return V2 controllers
- [ ] `php artisan route:list` shows all versioned routes
- [ ] Route caching works with versioned route groups

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Not Versioning from Day One -- apply preferred alternative
    - [ ] API routes use `/api/v1/` or versioned prefix from the start
    - [ ] No unversioned API routes in production
    - [ ] Version prefix is present in API documentation
- [ ] Prevent: Returning Raw Eloquent Models from Controllers -- apply preferred alternative
    - [ ] No controller returns Eloquent models directly
    - [ ] API Resources define explicit response contracts
    - [ ] Database schema changes do not affect API responses
- [ ] Prevent: Using `if` Version Branches Inside Controllers -- apply preferred alternative
    - [ ] No version conditionals in controllers
    - [ ] Each version has its own controller classes
    - [ ] Adding a new version creates new files, does not modify old ones
- [ ] Prevent: Mixing Versioning Strategies Across Endpoints -- apply preferred alternative
    - [ ] All API endpoints use the same versioning strategy
    - [ ] URI versioning is used consistently (or chosen strategy is documented)
    - [ ] No mixed header/URI/query parameter versioning
- [ ] Prevent: Supporting Too Many Versions Indefinitely -- apply preferred alternative
    - [ ] Maximum 2 active API versions at any time
    - [ ] Deprecation headers are present on older versions
    - [ ] Sunset dates are defined and communicated

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Implement URI-Based API Versioning
- Migrate API Versions Using Controller Inheritance
### Decision Trees (from 07)
- URI Versioning vs Header Versioning vs Query Parameter Versioning
- Controller Inheritance vs Full Duplication Across Versions
- Maximum Active Versions Policy vs Unlimited Version Support
- When to Start Versioning vs When to Add It Later
### Anti-Patterns (from 08)
- Not Versioning from Day One
- Returning Raw Eloquent Models from Controllers
- Using `if` Version Branches Inside Controllers
- Mixing Versioning Strategies Across Endpoints
- Supporting Too Many Versions Indefinitely
### Related Rules (from 06 skills)
- Enforce URI Versioning
- Limit Active Versions to Two
- Enforce Consistent Authentication Across Versions
- Add Deprecation Headers
- Version Resources Separately
### Related Skills (from 06 skills)
- Migrate API Versions Using Controller Inheritance
- Define Application Routes
- Implement Route Groups

