# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Resourceful Routing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use apiResource for APIs
- [ ] Verify: Use only/explicitly
- [ ] Verify: Add Custom Actions Separately
- [ ] Verify: Name Resources Consistently
- [ ] `apiResource` used for API route files (not `resource`)
- [ ] `->only()` or `->except()` limits routes to intended actions
- [ ] Resource name is plural (e.g., `users`, not `user`)
- [ ] Custom actions defined outside the resource definition
- [ ] Controller has methods matching all generated routes
- [ ] `php artisan route:list` shows only the intended routes
- [ ] Performance: Resource routes generate 5-7 Route objects. The registration cost is proporti...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Resource Route Registration
- [ ] Architecture guideline: Route::resource('photos', PhotoController::class);
- [ ] Architecture guideline: // Equivalent to 7 individual route definitions
- [ ] Architecture guideline: ### Nested Resource Pattern
- [ ] Architecture guideline: Route::resource('posts.comments', CommentController::class);
- [ ] Architecture guideline: // Generates: posts/{post}/comments, posts/{post}/comments/{comment}
- [ ] Architecture guideline: ### Shallow Nesting
- [ ] Architecture guideline: Use `->shallow()` when the parent ID is unnecessary for routes that reference the child directly:
- [ ] Architecture guideline: Route::resource('posts.comments', CommentController::class)->shallow();
- [ ] Decision: Route::resource() vs Explicit Route Definitions - ensure correct choice is made
- [ ] Decision: Route::apiResource() vs Route::resource() for APIs - ensure correct choice is made
- [ ] Decision: Nested Resources with Shallow Nesting vs Full Nesting - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use apiResource for APIs
- [ ] Best practice: Use only/explicitly
- [ ] Best practice: Add Custom Actions Separately
- [ ] Best practice: Name Resources Consistently
- [ ] Skill applied: Register Resourceful Routes with Explicit Action Control
- [ ] Skill applied: Configure Nested Resources with Shallow Nesting

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Resource routes generate 5-7 Route objects. The registration cost is proportional to the number of generated routes, ...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Unused Actions
- [ ] If `->only()` is not used, all 7 actions are routable. A controller method that doesn't exist throws an exception whe...

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
- [ ] `apiResource` used for API route files (not `resource`)
- [ ] `->only()` or `->except()` limits routes to intended actions
- [ ] Resource name is plural (e.g., `users`, not `user`)
- [ ] Custom actions defined outside the resource definition
- [ ] Controller has methods matching all generated routes
- [ ] `php artisan route:list` shows only the intended routes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using `Route::resource()` for JSON API Endpoints -- apply preferred alternative
    - [ ] API route files use `Route::apiResource()`, not `Route::resource()`
    - [ ] No `create` or `edit` routes in API route list
    - [ ] API documentation does not include form-serving endpoints
- [ ] Prevent: Deep Nesting Without Shallow -- apply preferred alternative
    - [ ] No nested resources beyond 2 levels without `->shallow()`
    - [ ] URLs are concise and readable
    - [ ] Controller methods only receive parameters they actually use
- [ ] Prevent: Using `resource()` for Non-CRUD Resources -- apply preferred alternative
    - [ ] Resource routes only include actions that are actually supported
    - [ ] Read-only resources use `->only(['index', 'show'])`
    - [ ] No empty or abort-returning controller methods for unused actions
- [ ] Prevent: Mixing Custom and Resource Routes Without Separation -- apply preferred alternative
    - [ ] Route file has clear sections: resources, then custom actions
    - [ ] Custom routes are visually separated from resource declarations
    - [ ] No custom routes are hidden within resource blocks
- [ ] Prevent: Resource Name Collision Across Groups -- apply preferred alternative
    - [ ] No duplicate route names across route groups
    - [ ] Same resource name in different groups has name prefix differentiation
    - [ ] `route()` calls generate correct URLs for each group context

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
- Register Resourceful Routes with Explicit Action Control
- Configure Nested Resources with Shallow Nesting
### Decision Trees (from 07)
- Route::resource() vs Explicit Route Definitions
- Route::apiResource() vs Route::resource() for APIs
- Nested Resources with Shallow Nesting vs Full Nesting
- Resource only()/except() vs Full 7-Route Resource
### Anti-Patterns (from 08)
- Using `Route::resource()` for JSON API Endpoints
- Deep Nesting Without Shallow
- Using `resource()` for Non-CRUD Resources
- Mixing Custom and Resource Routes Without Separation
- Resource Name Collision Across Groups
### Related Rules (from 06 skills)
- Use apiResource for API Route Files
- Use only() or except() to Limit Resource Actions
- Use Plural Resource Names
- Add Custom Actions Outside Resource Definitions
- Limit Nesting to Two Levels
### Related Skills (from 06 skills)
- Configure Nested Resources with Shallow Nesting
- Define Application Routes
- Implement Route Groups

