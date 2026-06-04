# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Custom Middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Class name describes the concern (e.g., `ForceJson`), not the location (e.g., `ApiMiddleware`)
- [ ] Exactly one concern per class â€” no auth + logging + locale in the same middleware
- [ ] Every code path returns `Response`
- [ ] `return $next($request)` on the pass-through path
- [ ] `$request->attributes->set()` used for resolved data, not `$request->merge()`
- [ ] No instance properties for per-request data
- [ ] Alias registered (if used by name in route definitions)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Middleware file location:** `app/Http/Middleware/` (convention). Named by concern: `CheckRole...
- [ ] Architecture guideline: - **Middleware resolution:** Fresh via `Container::make()` per request. Constructor injection wor...
- [ ] Architecture guideline: - **Closure middleware:** Defined inline on route: `->middleware(function (Request $req, Closure ...
- [ ] Architecture guideline: - **Three execution paths:** Pass through (`return $next($request)`), Short-circuit (`return resp...
- [ ] Architecture guideline: - **Registration tiers:** Global (every request), Group (route collections), Route (individual ro...
- [ ] Architecture guideline: - **Registration methods (Laravel 11+):** `$middleware->append(...)`, `$middleware->alias(...)`, ...
- [ ] Architecture guideline: - **Registration methods (Laravel 10-):** `$middleware` array, `$routeMiddleware` array, `$middle...
- [ ] Architecture guideline: - **Octane safety:** Do not store per-request data on `$this` â€” use `$request->attributes->set(...
- [ ] Decision: Guard Middleware vs Logging/Enrichment Middleware Pattern - ensure correct choice is made
- [ ] Decision: Class Middleware with Injection vs Closure Middleware - ensure correct choice is made
- [ ] Decision: Parameterized Middleware vs Separate Middleware Classes - ensure correct choice is made
- [ ] Decision: Global vs Group vs Route-Level Registration for Custom Middleware - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Custom Middleware with Single-Responsibility Pattern
- [ ] Skill applied: Test All Three Execution Paths of Custom Middleware

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
- [ ] Class name describes the concern (e.g., `ForceJson`), not the location (e.g., `ApiMiddleware`)
- [ ] Exactly one concern per class â€” no auth + logging + locale in the same middleware
- [ ] Every code path returns `Response`
- [ ] `return $next($request)` on the pass-through path
- [ ] `$request->attributes->set()` used for resolved data, not `$request->merge()`
- [ ] No instance properties for per-request data
- [ ] Alias registered (if used by name in route definitions)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Middleware Calling `$next` Twice -- apply preferred alternative
    - [ ] `$next($request)` is called exactly once per middleware
    - [ ] Controller-side effects (writes, API calls, email) happen exactly once
    - [ ] Response headers are not duplicated by middleware
- [ ] Prevent: Singleton Middleware with Mutable Properties -- apply preferred alternative
    - [ ] No per-request data stored on `$this` properties in middleware
    - [ ] All per-request data uses `$request->attributes->set()`
    - [ ] Middleware is not registered as singleton
- [ ] Prevent: Middleware That Modifies `$request->merge()` for Non-Sanitization Data -- apply preferred alternative
    - [ ] No `$request->merge()` for application-internal data
    - [ ] Middleware-to-controller data uses `$request->attributes->set()`
    - [ ] `$request->all()` returns only user-supplied input
- [ ] Prevent: Middleware with Multiple Responsibilities -- apply preferred alternative
    - [ ] Each middleware class handles exactly one concern
    - [ ] Middleware named by concern, not usage location
    - [ ] Constructor has dependencies from only one domain
- [ ] Prevent: Heavy Database Queries in Global Middleware -- apply preferred alternative
    - [ ] Global middleware does not perform database queries
    - [ ] Database-querying middleware is registered at route group level (not global)
    - [ ] Caching is implemented for any unavoidable heavy middleware

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
- Implement Custom Middleware with Single-Responsibility Pattern
- Test All Three Execution Paths of Custom Middleware
### Decision Trees (from 07)
- Guard Middleware vs Logging/Enrichment Middleware Pattern
- Class Middleware with Injection vs Closure Middleware
- Parameterized Middleware vs Separate Middleware Classes
- Global vs Group vs Route-Level Registration for Custom Middleware
### Anti-Patterns (from 08)
- Middleware Calling `$next` Twice
- Singleton Middleware with Mutable Properties
- Middleware That Modifies `$request->merge()` for Non-Sanitization Data
- Middleware with Multiple Responsibilities
- Heavy Database Queries in Global Middleware
### Related Rules (from 06 skills)
- Implement Exactly One Concern Per Middleware Class (custom-middleware:5)
- Always Return the Result of $next($request) (custom-middleware:5)
- Use $request->attributes->set() for Middleware-to-Controller Communication (custom-middleware:5)
- Do Not Store Per-Request Data on Instance Properties (custom-middleware:5)
### Related Skills (from 06 skills)
- Apply the Cross-Cutting Boundary Test to New Middleware
- Test All Three Execution Paths of Custom Middleware

