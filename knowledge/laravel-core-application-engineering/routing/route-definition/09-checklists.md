# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Definition
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Always Use Controller Array Syntax
- [ ] Verify: Never Use Closure Routes in Production
- [ ] Verify: Always Name Routes
- [ ] Verify: Split by Domain at Scale
- [ ] Controller array syntax used (`[Controller::class, 'method']`)
- [ ] Route has a unique name via `->name()`
- [ ] No Closure-based routes in production code
- [ ] Explicit HTTP verb methods used (no `any()`)
- [ ] Route files organized by domain if >50 routes
- [ ] Business logic is in controllers, not route files
- [ ] `php artisan route:list` shows the route
- [ ] `route()` helper generates the correct URL
- [ ] Performance: ### Route Registration Cost
- [ ] Performance: ~1-2ms per 100 routes. Not optimized by caching â€” registration always runs.
- [ ] Performance: ### Uncached Matching

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Route File Loading (Laravel 11+)
- [ ] Architecture guideline: web: __DIR__.'/../routes/web.php',
- [ ] Architecture guideline: api: __DIR__.'/../routes/api.php',
- [ ] Architecture guideline: ### Registration vs Dispatch
- [ ] Architecture guideline: Registration (loading files, building RouteCollection) happens at bootstrap. Dispatch (matching, ...
- [ ] Architecture guideline: ### Route Collection Structure
- [ ] Architecture guideline: `$routes[method]` â€” routes grouped by HTTP method
- [ ] Architecture guideline: `$nameList[name]` â€” hash table for named lookup (O(1))
- [ ] Decision: Controller Array Syntax vs Closure Routes - ensure correct choice is made
- [ ] Decision: Named Routes vs Unnamed Routes - ensure correct choice is made
- [ ] Decision: Feature-Based Route Files vs Single File - ensure correct choice is made
- [ ] Decision: Fallback Routes vs Per-Method 404 Handling - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Always Use Controller Array Syntax
- [ ] Best practice: Never Use Closure Routes in Production
- [ ] Best practice: Always Name Routes
- [ ] Best practice: Split by Domain at Scale
- [ ] Skill applied: Define Application Routes

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Route Registration Cost
- [ ] ~1-2ms per 100 routes. Not optimized by caching â€” registration always runs.
- [ ] ### Uncached Matching
- [ ] Iterates routes in registration order. 5-15ms per 100 routes on first request, 2-5ms on subsequent (OpCache).
- [ ] ### Cached Matching
- [ ] Uses Symfony `CompiledUrlMatcher` with prefix-tree regex. ~1-2ms regardless of route count. O(log n) or near-constant.
- [ ] ### Closure Blocking
- [ ] One Closure route blocks caching entirely. All routes lose 5x performance benefit.

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Route Exposure
- [ ] Every registered route is a potential attack surface. Audit with `php artisan route:list` regularly.
- [ ] ### Method Confusion
- [ ] Using `any()` lets unintended HTTP methods reach handlers that expect specific methods. Use explicit verb methods or ...
- [ ] ### Hidden Routes
- [ ] Routes in files not loaded (misspelled path, missing `require`) silently don't exist. The application returns 404 wit...

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
- [ ] Controller array syntax used (`[Controller::class, 'method']`)
- [ ] Route has a unique name via `->name()`
- [ ] No Closure-based routes in production code
- [ ] Explicit HTTP verb methods used (no `any()`)
- [ ] Route files organized by domain if >50 routes
- [ ] Business logic is in controllers, not route files
- [ ] `php artisan route:list` shows the route

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Define Application Routes
### Decision Trees (from 07)
- Controller Array Syntax vs Closure Routes
- Named Routes vs Unnamed Routes
- Feature-Based Route Files vs Single File
- Fallback Routes vs Per-Method 404 Handling
### Related Rules (from 06 skills)
- Use Controller Array Syntax
- Ban Closure Routes in Production
- Name Every Route
- Use Explicit HTTP Verb Methods
- Split Route Files by Domain at Scale
- Keep Business Logic Out of Route Files
### Related Skills (from 06 skills)
- Implement Route Groups
- Define Resourceful Routes
- Configure Route Model Binding
- Optimize Route Caching

