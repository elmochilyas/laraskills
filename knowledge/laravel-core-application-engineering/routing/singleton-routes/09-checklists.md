# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Singleton Routes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use creatable() When Appropriate
- [ ] Verify: Prefer Singleton Over Resource with only()
- [ ] `Route::singleton()` used instead of `Route::resource()->only()`
- [ ] URI does NOT include an ID parameter (`/profile` not `/profile/{profile}`)
- [ ] Controller methods do not expect an ID parameter
- [ ] `creatable()` added if the resource may not exist initially
- [ ] Nested singletons use dot notation for the parent
- [ ] `php artisan route:list` shows singleton actions (show, edit, update, destroy)
- [ ] Performance: Singleton routes generate 4-6 Route objects (vs 5-7 for resource). Negligible...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Singleton Definition
- [ ] Architecture guideline: Route::singleton('profile', ProfileController::class);
- [ ] Architecture guideline: // vs resource with only():
- [ ] Architecture guideline: Route::resource('profile', ProfileController::class)->only(['show', 'edit', 'update', 'destroy']);
- [ ] Architecture guideline: ### Nested Singleton
- [ ] Architecture guideline: Route::singleton('team.profile', ProfileController::class);
- [ ] Architecture guideline: // Generates: teams/{team}/profile
- [ ] Decision: Route::singleton() vs Route::resource()->only() for Singular Resources - ensure correct choice is made
- [ ] Decision: Creatable Singleton vs Read-Only Singleton - ensure correct choice is made
- [ ] Decision: Nested Singleton vs Top-Level Singleton - ensure correct choice is made
- [ ] Decision: Singleton Controller Method Convention vs Custom Methods - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use creatable() When Appropriate
- [ ] Best practice: Prefer Singleton Over Resource with only()
- [ ] Skill applied: Implement Singleton Routes for Singular Resources
- [ ] Skill applied: Configure Creatable Singleton Resources

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Singleton routes generate 4-6 Route objects (vs 5-7 for resource). Negligible performance difference. The benefit is ...
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
- [ ] `Route::singleton()` used instead of `Route::resource()->only()`
- [ ] URI does NOT include an ID parameter (`/profile` not `/profile/{profile}`)
- [ ] Controller methods do not expect an ID parameter
- [ ] `creatable()` added if the resource may not exist initially
- [ ] Nested singletons use dot notation for the parent
- [ ] `php artisan route:list` shows singleton actions (show, edit, update, destroy)

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
- Implement Singleton Routes for Singular Resources
- Configure Creatable Singleton Resources
### Decision Trees (from 07)
- Route::singleton() vs Route::resource()->only() for Singular Resources
- Creatable Singleton vs Read-Only Singleton
- Nested Singleton vs Top-Level Singleton
- Singleton Controller Method Convention vs Custom Methods
### Related Rules (from 06 skills)
- Prefer Singleton Over Resource with only()
- Use creatable() When the Resource May Not Exist
- Do Not Use Singleton for Non-Singular Resources
### Related Skills (from 06 skills)
- Configure Creatable Singleton Resources
- Register Resourceful Routes with Explicit Action Control
- Define Application Routes

