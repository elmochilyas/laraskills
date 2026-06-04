# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Pre-processing code is before `$next($request)`
- [ ] Post-processing code is after `$next($request)`
- [ ] Every code path returns a `Response` object
- [ ] `$next($request)` result is captured with `$response = $next($request)` â€” NOT called as a statement
- [ ] No instance properties for per-request data
- [ ] Short-circuit paths do not call `$next`

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Pipeline construction:** `array_reduce` over reversed middleware array creates the nested clo...
- [ ] Architecture guideline: - **Global pipeline:** Runs before routing via `Kernel::sendRequestThroughRouter()`. Cannot acces...
- [ ] Architecture guideline: - **Route pipeline:** Runs after routing via `Router::dispatch()`. Can access route parameters, r...
- [ ] Architecture guideline: - **Short-circuit behavior:** A middleware that returns a response without calling `$next` preven...
- [ ] Architecture guideline: - **Middleware registration (Laravel 11+):** `bootstrap/app.php` via `->withMiddleware()`. Fluent...
- [ ] Architecture guideline: - **Middleware registration (Laravel 10-):** `app/Http/Kernel.php` via `$middleware`, `$middlewar...
- [ ] Architecture guideline: - **Octane statelessness:** Middleware instances may persist across requests if bound as singleto...
- [ ] Decision: Global vs Route Pipeline Registration - ensure correct choice is made
- [ ] Decision: Pre-Processing vs Post-Processing in Middleware - ensure correct choice is made
- [ ] Decision: Class Middleware vs Closure Middleware - ensure correct choice is made
- [ ] Decision: Single Concern vs Multi-Concern Middleware Design - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement a Correct handle() Method with Two-Pass Execution
- [ ] Skill applied: Identify and Fix Business Logic Leaking into Middleware

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
- [ ] Pre-processing code is before `$next($request)`
- [ ] Post-processing code is after `$next($request)`
- [ ] Every code path returns a `Response` object
- [ ] `$next($request)` result is captured with `$response = $next($request)` â€” NOT called as a statement
- [ ] No instance properties for per-request data
- [ ] Short-circuit paths do not call `$next`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Middleware as Business Logic Layer -- apply preferred alternative
    - [ ] Middleware operates only on HTTP primitives
    - [ ] No domain models or repositories in middleware
    - [ ] Business logic is in services/actions
- [ ] Prevent: Forgetting to Return `$next($request)` -- apply preferred alternative
    - [ ] Every middleware `handle()` returns a Response on all code paths
    - [ ] `return $next($request)` is used (not bare `$next($request)`)
    - [ ] Static analysis detects missing returns
- [ ] Prevent: Modifying Request Input Without Awareness -- apply preferred alternative
    - [ ] No `$request->merge()` for middleware-to-controller data
    - [ ] Middleware uses `$request->attributes->set()` for internal data
    - [ ] `$request->all()` returns only client-supplied data
- [ ] Prevent: Assuming `$next` Always Returns a Response -- apply preferred alternative
    - [ ] Middleware handling `$response` after `$next` has exception protection
    - [ ] TypeError is not thrown when controller throws exception
    - [ ] Exception path is tested
- [ ] Prevent: Heavy Database Queries in Global Middleware -- apply preferred alternative
    - [ ] Global middleware does not perform database queries
    - [ ] Database-querying middleware is at route group level
    - [ ] Cache hit rate for middleware data is >95%

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
- Implement a Correct handle() Method with Two-Pass Execution
- Identify and Fix Business Logic Leaking into Middleware
### Decision Trees (from 07)
- Global vs Route Pipeline Registration
- Pre-Processing vs Post-Processing in Middleware
- Class Middleware vs Closure Middleware
- Single Concern vs Multi-Concern Middleware Design
### Anti-Patterns (from 08)
- Middleware as Business Logic Layer
- Forgetting to Return `$next($request)`
- Modifying Request Input Without Awareness
- Assuming `$next` Always Returns a Response
- Heavy Database Queries in Global Middleware
### Related Rules (from 06 skills)
- Always Return the Result of $next($request) (middleware-fundamentals:5)
- Place Pre-Processing Code Before $next and Post-Processing Code After (middleware-fundamentals:5)
- Never Place Business Logic in Middleware (middleware-fundamentals:5)
- Do Not Store Per-Request State on Middleware Instance Properties (middleware-fundamentals:5)
### Related Skills (from 06 skills)
- Implement Custom Middleware with Single-Responsibility Pattern
- Implement a Request Transformation Middleware for Request Enrichment

