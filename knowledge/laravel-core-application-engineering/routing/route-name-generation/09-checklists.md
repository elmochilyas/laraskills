# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Name Generation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Name Every Route
- [ ] Verify: Use Dot Notation Names
- [ ] Verify: Use Name Prefixes Matching URL Prefixes
- [ ] Verify: Prefer route() Over Hardcoded URLs
- [ ] Every route has a unique name via `->name()`
- [ ] Names use dot notation (`resource.action`)
- [ ] No two routes share the same name
- [ ] `route('name')` generates the correct URL
- [ ] No hardcoded URIs in views, controllers, or tests
- [ ] `redirect()->route()` used instead of `redirect('/path')`
- [ ] `php artisan route:list` shows all names
- [ ] Performance: Named route lookup is O(1) via the `$nameList` hash table. The `route()` help...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Route Name Resolution
- [ ] Architecture guideline: route('users.show', ['user' => 5])
- [ ] Architecture guideline: â†’ RouteCollection::$nameList['users.show']
- [ ] Architecture guideline: â†’ Route::uri() + parameter substitution
- [ ] Architecture guideline: â†’ https://example.com/users/5
- [ ] Architecture guideline: ### Named Route Registration
- [ ] Architecture guideline: Route::get('/users/{user}', [UserController::class, 'show'])
- [ ] Architecture guideline: ->name('users.show');
- [ ] Architecture guideline: ### Resource Naming
- [ ] Architecture guideline: Route::resource('photos', PhotoController::class);
- [ ] Architecture guideline: // Names: photos.index, photos.create, photos.store, photos.show
- [ ] Architecture guideline: //        photos.edit, photos.update, photos.destroy

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Name Every Route
- [ ] Best practice: Use Dot Notation Names
- [ ] Best practice: Use Name Prefixes Matching URL Prefixes
- [ ] Best practice: Prefer route() Over Hardcoded URLs
- [ ] Skill applied: Name Routes and Generate URLs from Named Routes
- [ ] Skill applied: Organize Route Names with Group Prefixes

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Named route lookup is O(1) via the `$nameList` hash table. The `route()` helper performance is dominated by URL param...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Name Collision
- [ ] Duplicate route names silently overwrite. The later registration wins. One route may be unreachable via `route()` whi...
- [ ] ### Name Exposure
- [ ] Route names appear in `route()` generated URLs only as URL segments (via parameters). The name itself is NOT exposed ...

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
- [ ] Every route has a unique name via `->name()`
- [ ] Names use dot notation (`resource.action`)
- [ ] No two routes share the same name
- [ ] `route('name')` generates the correct URL
- [ ] No hardcoded URIs in views, controllers, or tests
- [ ] `redirect()->route()` used instead of `redirect('/path')`
- [ ] `php artisan route:list` shows all names

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
- Name Routes and Generate URLs from Named Routes
- Organize Route Names with Group Prefixes
### Decision Trees (from 07)
- Named Routes vs action() Helper for URL Generation
- Dot Notation Names vs Flat Names
- Name Prefixes in Groups vs Individual ->name() Calls
- route() Helper vs Hardcoded URLs
### Related Rules (from 06 skills)
- Name Every Route
- Use Dot Notation Naming
- Ban Hardcoded URLs
- Ensure Globally Unique Route Names
### Related Skills (from 06 skills)
- Organize Route Names with Group Prefixes
- Define Application Routes
- Implement URI-Based API Versioning

