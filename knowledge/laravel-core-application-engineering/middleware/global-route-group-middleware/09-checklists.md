# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Global, Route Group, and Route Middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Middleware does NOT need route context but is registered globally â€” verify `$request->route()` is not used
- [ ] Global middleware is infrastructure-only (TrustedProxies, HandleCors, TrimStrings, RequestId)
- [ ] Group middleware covers a route collection (web, api, admin, etc.)
- [ ] Route-level middleware is used for per-endpoint configuration
- [ ] No middleware registered globally that queries the database or performs I/O

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Global middleware registration (Laravel 11+):** `$middleware->append(...)`, `$middleware->pre...
- [ ] Architecture guideline: - **Global middleware registration (Laravel 10-):** `protected $middleware = [...]` array.
- [ ] Architecture guideline: - **Group registration (Laravel 11+):** `$middleware->group('name', [...])`, `$middleware->web(ap...
- [ ] Architecture guideline: - **Group registration (Laravel 10-):** `protected $middlewareGroups = ['name' => [...]]` array.
- [ ] Architecture guideline: - **Route middleware assignment:** `Route::get('/url', ...)->middleware('auth')->middleware('can:...
- [ ] Architecture guideline: - **Nested group middleware:** Inner groups inherit middleware from all ancestor groups. Outermos...
- [ ] Architecture guideline: - **withoutMiddleware behavior:** Only excludes middleware registered as a named route alias or F...
- [ ] Architecture guideline: - **Package registration:** Use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in ...
- [ ] Decision: Global vs Group vs Route Registration for New Middleware - ensure correct choice is made
- [ ] Decision: Custom Group Definition vs Group Modification on Default Groups - ensure correct choice is made
- [ ] Decision: Nested Group Structure vs Flat Group Structure - ensure correct choice is made
- [ ] Decision: Middleware Composition via Groups vs Per-Route Registration - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Choose the Correct Registration Tier for Middleware
- [ ] Skill applied: Modify Default Middleware Groups Without Full Replacement

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
- [ ] Middleware does NOT need route context but is registered globally â€” verify `$request->route()` is not used
- [ ] Global middleware is infrastructure-only (TrustedProxies, HandleCors, TrimStrings, RequestId)
- [ ] Group middleware covers a route collection (web, api, admin, etc.)
- [ ] Route-level middleware is used for per-endpoint configuration
- [ ] No middleware registered globally that queries the database or performs I/O

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Global Middleware for Application-Specific Concerns -- apply preferred alternative
    - [ ] Global middleware contains only infrastructure concerns (proxies, CORS, maintenance)
    - [ ] Application-specific middleware (auth, throttle, locale) is at group or route level
    - [ ] API and health check routes do not run unnecessary middleware
- [ ] Prevent: Deep Nested Middleware Groups -- apply preferred alternative
    - [ ] No more than 2 levels of middleware group nesting
    - [ ] Route groups are flat with explicit middleware composition
    - [ ] Effective middleware stack is apparent from route definition
- [ ] Prevent: Using `withoutMiddleware` to Exclude Global Middleware -- apply preferred alternative
    - [ ] `withoutMiddleware` is not used to exclude global middleware (it has no effect)
    - [ ] Global middleware contains only infrastructure concerns (not bypassed)
    - [ ] Application middleware is at group/route level and can be selectively applied
- [ ] Prevent: Adding Session Middleware to API Routes -- apply preferred alternative
    - [ ] API routes use the `api` middleware group (stateless)
    - [ ] No session middleware runs on API requests
    - [ ] No CSRF protection on API requests
- [ ] Prevent: Group Middleware Applied Outside the Closure -- apply preferred alternative
    - [ ] All routes intended to be in a group are inside its closure
    - [ ] Routes outside groups have explicit middleware if they need protection
    - [ ] Group scope is verified by automated tests

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
- Choose the Correct Registration Tier for Middleware
- Modify Default Middleware Groups Without Full Replacement
### Decision Trees (from 07)
- Global vs Group vs Route Registration for New Middleware
- Custom Group Definition vs Group Modification on Default Groups
- Nested Group Structure vs Flat Group Structure
- Middleware Composition via Groups vs Per-Route Registration
### Anti-Patterns (from 08)
- Global Middleware for Application-Specific Concerns
- Deep Nested Middleware Groups
- Using `withoutMiddleware` to Exclude Global Middleware
- Adding Session Middleware to API Routes
- Group Middleware Applied Outside the Closure
### Related Rules (from 06 skills)
- Register Middleware at the Most Restrictive Tier (global-route-group-middleware:5)
- Do Not Register Global Middleware That Requires Route Context (global-route-group-middleware:5)
- Do Not Apply the Web Group to API Routes (global-route-group-middleware:5)
- Register Cross-Cutting Concerns at the Most Restrictive Tier (cross-cutting-concerns:5)
### Related Skills (from 06 skills)
- Modify Default Middleware Groups Without Full Replacement
- Maintain a Documented Middleware Inventory

