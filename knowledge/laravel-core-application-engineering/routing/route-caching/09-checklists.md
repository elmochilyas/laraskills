# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Caching
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use Controllers for ALL Routes
- [ ] Verify: Cache on Every Deployment
- [ ] Verify: Verify After Caching
- [ ] Verify: Clear Cache Before Modifications
- [ ] `route:cache` runs successfully without `LogicException`
- [ ] `route:list` after caching shows ALL expected routes
- [ ] No Closure routes in production route files
- [ ] Deployment script includes `route:cache`
- [ ] Development workflow uses `route:clear` (not cache)
- [ ] Cache file at `bootstrap/cache/routes-v7.php` is not publicly writable
- [ ] Performance: ### Uncached Routing
- [ ] Performance: - O(n) iteration over all routes
- [ ] Performance: - Regex compilation on first match per route

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Cache File Location
- [ ] Architecture guideline: `bootstrap/cache/routes-v7.php` â€” the version number in the filename prevents loading stale cac...
- [ ] Architecture guideline: ### Cache Content
- [ ] Architecture guideline: The cached file contains serialized Route objects with: URI patterns, regex compilations, control...
- [ ] Architecture guideline: ### Cache Miss Behavior
- [ ] Architecture guideline: If the cache file doesn't exist or is unreadable, the framework falls back to standard route file...
- [ ] Decision: Controller-Based Routes vs Closure Routes (Cacheable vs Non-Cacheable) - ensure correct choice is made
- [ ] Decision: Route Caching on Every Deployment vs Conditional/Optional Caching - ensure correct choice is made
- [ ] Decision: Route Caching in CI/CD Pipeline vs Manual Cache on Server - ensure correct choice is made
- [ ] Decision: Caching in Development vs Always Running route:clear - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use Controllers for ALL Routes
- [ ] Best practice: Cache on Every Deployment
- [ ] Best practice: Verify After Caching
- [ ] Best practice: Clear Cache Before Modifications
- [ ] Skill applied: Optimize Route Matching with Route Caching
- [ ] Skill applied: Migrate Closure Routes to Cache-Compatible Controllers

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Uncached Routing
- [ ] - O(n) iteration over all routes
- [ ] - Regex compilation on first match per route
- [ ] - 5-15ms for 100 routes on first request
- [ ] - 2-5ms on subsequent requests (OpCache)
- [ ] ### Cached Routing
- [ ] - Uses Symfony `CompiledUrlMatcher` (prefix-tree regex)
- [ ] - O(log n) or near-constant matching
- [ ] - ~1-2ms regardless of route count

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Stale Route Cache
- [ ] A stale cache may expose old routes or miss new security middleware. Always regenerate cache after route changes.
- [ ] ### Cache File Permissions
- [ ] The cached route file is a PHP file executed by the framework. Protect it with filesystem permissions to prevent unau...
- [ ] ### Cache Poisoning
- [ ] If an attacker can modify `bootstrap/cache/routes-v7.php`, they can change routing behavior. Ensure the cache directo...

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
- [ ] `route:cache` runs successfully without `LogicException`
- [ ] `route:list` after caching shows ALL expected routes
- [ ] No Closure routes in production route files
- [ ] Deployment script includes `route:cache`
- [ ] Development workflow uses `route:clear` (not cache)
- [ ] Cache file at `bootstrap/cache/routes-v7.php` is not publicly writable

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
- Optimize Route Matching with Route Caching
- Migrate Closure Routes to Cache-Compatible Controllers
### Decision Trees (from 07)
- Controller-Based Routes vs Closure Routes (Cacheable vs Non-Cacheable)
- Route Caching on Every Deployment vs Conditional/Optional Caching
- Route Caching in CI/CD Pipeline vs Manual Cache on Server
- Caching in Development vs Always Running route:clear
### Related Rules (from 06 skills)
- Ban Closure Routes in Production
- Run route:cache on Every Deployment
- Verify After Caching
- Clear Cache Before Route Modifications in Development
- Do Not Use Conditional Route Registration
### Related Skills (from 06 skills)
- Migrate Closure Routes to Cache-Compatible Controllers
- Define Application Routes
- Implement Route Groups

