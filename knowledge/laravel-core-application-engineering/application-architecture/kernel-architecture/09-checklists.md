# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Kernel Architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Each middleware class is registered in exactly one location
- [ ] No middleware appears in both global and group registration (no duplication)
- [ ] Middleware priority is explicitly defined (not relying on framework defaults)
- [ ] Unused framework middleware is removed (API-only: remove cookie/session/CSRF)
- [ ] Custom middleware classes are testable and have no business logic in the kernel
- [ ] `withoutMiddleware()` is never used in production code paths
- [ ] Middleware order is verified after framework upgrades

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Middleware Pipeline Order
- [ ] Architecture guideline: Global middleware ($middleware) â€” runs on all routes
- [ ] Architecture guideline: Group middleware (web/api group) â€” runs on grouped routes
- [ ] Architecture guideline: Route middleware (per-route) â€” runs on individual routes
- [ ] Architecture guideline: Controller/Handler
- [ ] Architecture guideline: Route middleware (outbound pass)
- [ ] Architecture guideline: Group middleware (outbound pass)
- [ ] Architecture guideline: Global middleware (outbound pass)
- [ ] Architecture guideline: ### Laravel 10- vs 11+ Registration
- [ ] Architecture guideline: ### Console Kernel Schedule Best Practices
- [ ] Decision: Laravel 10- vs 11+ Kernel Configuration - ensure correct choice is made
- [ ] Decision: Middleware Registration Level (Global vs Group vs Route) - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Middleware Pipeline via Kernel

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
- [ ] Each middleware class is registered in exactly one location
- [ ] No middleware appears in both global and group registration (no duplication)
- [ ] Middleware priority is explicitly defined (not relying on framework defaults)
- [ ] Unused framework middleware is removed (API-only: remove cookie/session/CSRF)
- [ ] Custom middleware classes are testable and have no business logic in the kernel
- [ ] `withoutMiddleware()` is never used in production code paths
- [ ] Middleware order is verified after framework upgrades

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Fat Kernel -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Middleware Duplication Across Registration Points -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Explicit Middleware Priority -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Migrating Kernel Config on Laravel 10â†’11 Upgrade -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Configure Middleware Pipeline via Kernel
### Decision Trees (from 07)
- Laravel 10- vs 11+ Kernel Configuration
- Middleware Registration Level (Global vs Group vs Route)
- Console Schedule Task Strategy
### Anti-Patterns (from 08)
- Fat Kernel
- Middleware Duplication Across Registration Points
- Missing Explicit Middleware Priority
- Not Migrating Kernel Config on Laravel 10â†’11 Upgrade
### Related Rules (from 06 skills)
- Never Put Business Logic in Kernel Classes (05-rules.md)
- Enable All Caches in Production (05-rules.md)
- Keep Middleware Priority Explicit (05-rules.md)
- Never Duplicate Middleware Across Registration Points (05-rules.md)
- Validate Middleware Order After Framework Upgrades (05-rules.md)
- Remove Unused Framework Middleware (05-rules.md)
- Never Use withoutMiddleware() in Production (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Configure Application via Fluent API
- Skill: Optimize Bootstrap Performance

