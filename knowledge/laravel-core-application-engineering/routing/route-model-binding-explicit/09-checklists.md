# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Model Binding (Explicit)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Keep Bindings Simple
- [ ] Verify: Use Route::bind() Over Route::model()
- [ ] Verify: Register in a Dedicated Provider
- [ ] Binding registered in a dedicated service provider (not `AppServiceProvider`)
- [ ] `Route::bind()` used with explicit closure (not `Route::model()`)
- [ ] Closure performs only resolution logic â€” no authorization, logging, or side effects
- [ ] Expensive resolution wrapped in `Cache::remember()`
- [ ] Authorization is handled in controller or middleware, not in binding
- [ ] Binding works correctly for valid values
- [ ] Missing models return 404 or custom behavior
- [ ] Performance: Explicit bindings can introduce performance overhead if the closure performs ...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Explicit Binding Registration
- [ ] Architecture guideline: // In a service provider's boot()
- [ ] Architecture guideline: Route::bind('user', function (string $value) {
- [ ] Architecture guideline: return Cache::remember("user.{$value}", 3600, function () use ($value) {
- [ ] Architecture guideline: return User::where('slug', $value)->firstOrFail();
- [ ] Architecture guideline: ### Model-Level Custom Resolution
- [ ] Architecture guideline: class User extends Model
- [ ] Architecture guideline: public function resolveRouteBinding($value, $field = null): ?Model
- [ ] Architecture guideline: return $this->where('slug', $value)->firstOrFail();
- [ ] Decision: Route::model() vs Route::bind() for Explicit Registration - ensure correct choice is made
- [ ] Decision: Explicit Binding in Service Provider vs Inline in Route File - ensure correct choice is made
- [ ] Decision: Binding with Caching vs Uncached Resolution - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Keep Bindings Simple
- [ ] Best practice: Use Route::bind() Over Route::model()
- [ ] Best practice: Register in a Dedicated Provider
- [ ] Skill applied: Implement Explicit Route Model Binding with Custom Resolution
- [ ] Skill applied: Register Cached Model Resolution via Explicit Binding

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Explicit bindings can introduce performance overhead if the closure performs expensive operations (external API calls...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Binding Authorization
- [ ] Binding closures run before middleware. Authorization checks in bindings may bypass middleware-based protections. If ...
- [ ] ### Cache Poisoning
- [ ] If binding uses caching, ensure cache keys are unique per user context. Otherwise, user A's resolved model may be ser...

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
- [ ] Binding registered in a dedicated service provider (not `AppServiceProvider`)
- [ ] `Route::bind()` used with explicit closure (not `Route::model()`)
- [ ] Closure performs only resolution logic â€” no authorization, logging, or side effects
- [ ] Expensive resolution wrapped in `Cache::remember()`
- [ ] Authorization is handled in controller or middleware, not in binding
- [ ] Binding works correctly for valid values
- [ ] Missing models return 404 or custom behavior

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
- Implement Explicit Route Model Binding with Custom Resolution
- Register Cached Model Resolution via Explicit Binding
### Decision Trees (from 07)
- Route::model() vs Route::bind() for Explicit Registration
- Explicit Binding in Service Provider vs Inline in Route File
- Binding with Caching vs Uncached Resolution
- Custom resolveRouteBinding on Model vs Route::bind() in Provider
### Related Rules (from 06 skills)
- Register Explicit Bindings in a Dedicated Service Provider
- Use Route::bind() Over Route::model()
- Ban Business Logic and Authorization From Binding Closures
- Cache Expensive Binding Resolution
### Related Skills (from 06 skills)
- Register Cached Model Resolution via Explicit Binding
- Implement Implicit Route Model Binding
- Configure Custom Route Keys with Inline Syntax

