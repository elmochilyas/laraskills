# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Enum Binding
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use Backed Enums for Route Parameters
- [ ] Verify: Combine with Route Constraints
- [ ] Enum is backed (`: string` or `: int`) â€” not a pure enum
- [ ] Route parameter type-hint uses the fully qualified enum class
- [ ] Controller does NOT contain manual `tryFrom()` for this parameter
- [ ] Invalid URL segments return 404, not 500
- [ ] Authorization is applied independently of enum binding
- [ ] Regex constraint added for additional format validation (optional)
- [ ] Performance: Enum binding uses `tryFrom()` which is O(1) for backed enums. Negligible perf...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Binding Flow
- [ ] Architecture guideline: URL: /posts/draft
- [ ] Architecture guideline: â†’ Route parameter {status} â†’ PostStatus $status
- [ ] Architecture guideline: â†’ PostStatus::tryFrom('draft') â†’ PostStatus::Draft
- [ ] Architecture guideline: â†’ If null â†’ 404
- [ ] Architecture guideline: ### Invalid Value Behavior
- [ ] Architecture guideline: URL: /posts/archived
- [ ] Architecture guideline: â†’ PostStatus::tryFrom('archived') â†’ null
- [ ] Architecture guideline: â†’ 404 response
- [ ] Decision: Enum Binding vs Manual tryFrom() in Controllers - ensure correct choice is made
- [ ] Decision: String-Backed Enums vs Integer-Backed Enums for Route Parameters - ensure correct choice is made
- [ ] Decision: Enum Binding vs Route Constraints for Validation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use Backed Enums for Route Parameters
- [ ] Best practice: Combine with Route Constraints
- [ ] Skill applied: Bind Backed Enum Values from Route Parameters

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Enum binding uses `tryFrom()` which is O(1) for backed enums. Negligible performance cost. No database query involved.
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] Enum binding does not replace authorization. An enum value in a URL may be valid but the user may not be authorized t...

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
- [ ] Enum is backed (`: string` or `: int`) â€” not a pure enum
- [ ] Route parameter type-hint uses the fully qualified enum class
- [ ] Controller does NOT contain manual `tryFrom()` for this parameter
- [ ] Invalid URL segments return 404, not 500
- [ ] Authorization is applied independently of enum binding
- [ ] Regex constraint added for additional format validation (optional)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Route Ordering Without `whereIn()` Workaround -- apply preferred alternative
    - [ ] Enum-bound routes use `->whereIn('param', Enum::cases())`
    - [ ] Or literal routes are registered before enum routes
    - [ ] Specific routes are not shadowed by enum routes
- [ ] Prevent: Using Enum Binding for Dynamic Value Sets -- apply preferred alternative
    - [ ] Enum-bound routes use only static, stable value sets
    - [ ] Dynamic value sets use database-backed binding or custom validation
    - [ ] Adding a new valid value does not always require a deployment
- [ ] Prevent: Expecting Int-Backed Enum Support -- apply preferred alternative
    - [ ] All route-bound enums are string-backed (`: string`)
    - [ ] URL segments use readable strings, not numeric codes
    - [ ] No int-backed enums in route parameter type-hints
- [ ] Prevent: Manual `tryFrom()` in Controllers Instead of Enum Binding -- apply preferred alternative
    - [ ] No manual `EnumType::tryFrom()` with route parameters in controllers
    - [ ] Controller parameters use enum type-hints for enum-bound routes
    - [ ] Invalid enum values return 404 without controller code executing
- [ ] Prevent: Enum Case Rename Breaking Production URLs -- apply preferred alternative
    - [ ] No enum case values have been renamed after production deployment
    - [ ] Old enum values still resolve in URL routes
    - [ ] Redirects exist for any changed values

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
- Bind Backed Enum Values from Route Parameters
### Decision Trees (from 07)
- Enum Binding vs Manual tryFrom() in Controllers
- String-Backed Enums vs Integer-Backed Enums for Route Parameters
- Enum Binding vs Route Constraints for Validation
- Pure Enum Routes vs Backed Enum Routes
### Anti-Patterns (from 08)
- Route Ordering Without `whereIn()` Workaround
- Using Enum Binding for Dynamic Value Sets
- Expecting Int-Backed Enum Support
- Manual `tryFrom()` in Controllers Instead of Enum Binding
- Enum Case Rename Breaking Production URLs
### Related Rules (from 06 skills)
- Use Backed Enums for Route Parameters
- Reject Manual tryFrom() in Controllers
- Apply Regex Constraints for Additional Validation
- Do Not Use Enum Binding as Authorization
### Related Skills (from 06 skills)
- Implement Implicit Route Model Binding
- Define Application Routes
- Implement Route Model Binding (Explicit)

