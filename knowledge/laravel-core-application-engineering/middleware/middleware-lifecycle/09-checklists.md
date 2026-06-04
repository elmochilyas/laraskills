# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Lifecycle
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Middleware that accesses `$request->route()` is NOT registered as global
- [ ] Global middleware only contains infrastructure concerns (TrustedProxies, HandleCors, TrimStrings)
- [ ] Path-based middleware (`$request->is()`) is correctly identified as safe for global
- [ ] Route pipeline middleware has access to all needed route context
- [ ] No middleware is registered globally that needs the matched route for authentication, authorization, or rate limiting

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Request flow:** `Kernel::handle()` â†’ bootstrap â†’ global pipeline â†’ router dispatch â†’ ...
- [ ] Architecture guideline: - **Global pipeline construction:** `$this->app->shouldSkipMiddleware() ? [] : $this->middleware`...
- [ ] Architecture guideline: - **Route middleware gathering:** Merges controller middleware + route middleware + group middlew...
- [ ] Architecture guideline: - **Controller instantiation:** Happens before middleware runs. This is a known framework design ...
- [ ] Architecture guideline: - **Terminate phase:** Both global and route middleware are checked for `terminate()`. Route midd...
- [ ] Architecture guideline: - **Octane lifecycle:** Same per-request pipeline but (a) no re-bootstrap per request, (b) middle...
- [ ] Decision: Placement in Global Pipeline vs Route Pipeline - ensure correct choice is made
- [ ] Decision: Pre-Processing vs Post-Processing in Middleware Lifecycle - ensure correct choice is made
- [ ] Decision: Controller Constructor Initialization vs Lazy Initialization - ensure correct choice is made
- [ ] Decision: Terminable Middleware vs Queue-Based Post-Response Processing - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Determine Correct Pipeline Placement Based on Route Context Requirements
- [ ] Skill applied: Keep Controller Constructors Lightweight for Middleware-Aware Design

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
- [ ] Middleware that accesses `$request->route()` is NOT registered as global
- [ ] Global middleware only contains infrastructure concerns (TrustedProxies, HandleCors, TrimStrings)
- [ ] Path-based middleware (`$request->is()`) is correctly identified as safe for global
- [ ] Route pipeline middleware has access to all needed route context
- [ ] No middleware is registered globally that needs the matched route for authentication, authorization, or rate limiting

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Global Middleware That Needs Route Data -- apply preferred alternative
    - [ ] No global middleware accesses `$request->route()`
    - [ ] Route-parameter-aware middleware is not global
    - [ ] Route-aware logic uses route data directly, not path string matching
- [ ] Prevent: Route Middleware That Modifies Request Interpretation -- apply preferred alternative
    - [ ] Request-interpretation middleware (proxies, CORS, scheme) is global, not route-level
    - [ ] Route middleware does not modify request scheme, method, or URI
    - [ ] URL generation produces correct scheme
- [ ] Prevent: Controller Constructor with Expensive Initialization -- apply preferred alternative
    - [ ] Controller constructors do not perform expensive operations
    - [ ] Database queries are in methods, not constructors
    - [ ] Unauthorized requests are fast (no constructor work)
- [ ] Prevent: Terminable Middleware with Heavy Processing -- apply preferred alternative
    - [ ] Terminable middleware does not perform heavy I/O
    - [ ] Heavy operations are dispatched to queue
    - [ ] `terminate()` completes in under 1ms
- [ ] Prevent: Assuming Controller Runs After Middleware -- apply preferred alternative
    - [ ] Controller constructors have no side effects
    - [ ] Expensive initialization is in methods, not constructors
    - [ ] Unauthorized requests do not trigger constructor side effects

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
- Determine Correct Pipeline Placement Based on Route Context Requirements
- Keep Controller Constructors Lightweight for Middleware-Aware Design
### Decision Trees (from 07)
- Placement in Global Pipeline vs Route Pipeline
- Pre-Processing vs Post-Processing in Middleware Lifecycle
- Controller Constructor Initialization vs Lazy Initialization
- Terminable Middleware vs Queue-Based Post-Response Processing
### Anti-Patterns (from 08)
- Global Middleware That Needs Route Data
- Route Middleware That Modifies Request Interpretation
- Controller Constructor with Expensive Initialization
- Terminable Middleware with Heavy Processing
- Assuming Controller Runs After Middleware
### Related Rules (from 06 skills)
- Differentiate Global and Route Pipeline Placement by Route Context Requirement (middleware-lifecycle:5)
- Do Not Register Global Middleware That Requires Route Context (global-route-group-middleware:5)
### Related Skills (from 06 skills)
- Choose the Correct Registration Tier for Middleware

