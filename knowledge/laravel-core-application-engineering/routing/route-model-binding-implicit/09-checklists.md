# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Model Binding (Implicit)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use Type-Hinted Parameters in Controllers
- [ ] Verify: Use Custom Column Binding for Non-ID Lookups
- [ ] Verify: Use withTrashed() Judiciously
- [ ] Route parameter name matches controller variable name (e.g., `{user}` matches `$user`)
- [ ] Controller parameter type-hints the model class (e.g., `User $user`)
- [ ] No manual `Model::findOrFail()` in the controller body for this parameter
- [ ] Parameter name mismatch would cause raw string injection â€” verified with `route:list`
- [ ] Soft-deleted binding uses `->withTrashed()` only when appropriate
- [ ] Scoped bindings enabled for nested routes (Laravel 8+ default)
- [ ] Performance: Each implicit binding executes a database query. For nested resources with mu...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Resolution Flow
- [ ] Architecture guideline: {user} in URI â†’ controller parameter User $user
- [ ] Architecture guideline: â†’ Framework calls User::resolveRouteBinding($value)
- [ ] Architecture guideline: â†’ Default: User::findOrFail($value)
- [ ] Architecture guideline: â†’ Returns User instance or throws ModelNotFoundException â†’ 404
- [ ] Architecture guideline: ### Custom Route Key
- [ ] Architecture guideline: Route::get('/users/{user:username}', [UserController::class, 'show']);
- [ ] Architecture guideline: // Resolves via User::where('username', $value)->firstOrFail()
- [ ] Architecture guideline: ### Model-Level Custom Key
- [ ] Architecture guideline: class User extends Model
- [ ] Architecture guideline: public function getRouteKeyName(): string
- [ ] Architecture guideline: // Now ALL {user} bindings use slug instead of id

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use Type-Hinted Parameters in Controllers
- [ ] Best practice: Use Custom Column Binding for Non-ID Lookups
- [ ] Best practice: Use withTrashed() Judiciously
- [ ] Skill applied: Implement Implicit Route Model Binding in Controllers

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Each implicit binding executes a database query. For nested resources with multiple bindings (e.g., `posts/{post}/com...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Unscoped Binding in Multi-Tenant Apps
- [ ] Implicit binding without scoping allows cross-tenant resource access. A user in tenant A can access tenant B's resour...
- [ ] ### Soft Delete Visibility
- [ ] Without `withTrashed()`, soft-deleted models return 404. This is usually correct â€” deleted resources should not be ...

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
- [ ] Route parameter name matches controller variable name (e.g., `{user}` matches `$user`)
- [ ] Controller parameter type-hints the model class (e.g., `User $user`)
- [ ] No manual `Model::findOrFail()` in the controller body for this parameter
- [ ] Parameter name mismatch would cause raw string injection â€” verified with `route:list`
- [ ] Soft-deleted binding uses `->withTrashed()` only when appropriate
- [ ] Scoped bindings enabled for nested routes (Laravel 8+ default)

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
- Implement Implicit Route Model Binding in Controllers
### Decision Trees (from 07)
- Implicit Binding vs Manual findOrFail in Controllers
- Custom Column Binding via Inline Syntax vs Model-Level getRouteKeyName
- Parameter Name Convention vs Custom Parameter Names
- withTrashed vs Default Soft Delete Exclusion
### Related Rules (from 06 skills)
- Use Type-Hinted Parameters Instead of Manual findOrFail
- Match Parameter Names Between Route and Controller
- Use Inline Syntax Over getRouteKeyName() for Single-Route Customization
- Use Scoped Bindings for Multi-Tenant Routes
- Use withTrashed() Judiciously
### Related Skills (from 06 skills)
- Implement Explicit Route Model Binding with Custom Resolution
- Configure Custom Route Keys with Inline Syntax
- Implement Scoped Bindings for Nested Routes

