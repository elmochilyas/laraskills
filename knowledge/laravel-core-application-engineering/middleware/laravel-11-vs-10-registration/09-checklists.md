# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Laravel 11 vs 10 Middleware Registration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] No controller calls `$this->middleware()` in constructor â€” would cause fatal error
- [ ] Every controller with middleware implements `HasMiddleware`
- [ ] Static `middleware()` method returns array of `Middleware` objects
- [ ] `Middleware` class is imported: `use Illuminate\Routing\Controllers\Middleware`
- [ ] `except` and `only` parameters are preserved from the original constructor calls

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Laravel 10 registration:** `App\Http\Kernel extends HttpKernel`. Properties: `$middleware` (g...
- [ ] Architecture guideline: - **Laravel 11+ registration:** `bootstrap/app.php` â†’ `->withMiddleware(function (Middleware $m...
- [ ] Architecture guideline: - **Global middleware (Laravel 11+):** `$middleware->append(...)`, `$middleware->prepend(...)`, `...
- [ ] Architecture guideline: - **Aliases (Laravel 11+):** `$middleware->alias(['custom' => CustomMiddleware::class])`.
- [ ] Architecture guideline: - **Groups (Laravel 11+):** `$middleware->group('name', [...])` (full definition), `$middleware->...
- [ ] Architecture guideline: - **Priority (Laravel 11+):** `$middleware->priority([...])` (full replace). Laravel 12+: `prepen...
- [ ] Architecture guideline: - **Controller middleware (Laravel 11+):** Implement `HasMiddleware` â†’ define `public static fu...
- [ ] Architecture guideline: - **Package registration:** Use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in ...
- [ ] Decision: Laravel 10 Kernel.php vs Laravel 11 bootstrap/app.php Registration - ensure correct choice is made
- [ ] Decision: HasMiddleware Interface vs #[Middleware] Attribute for Controller Middleware - ensure correct choice is made
- [ ] Decision: Group Modification (append/prepend) vs Full Group Replacement - ensure correct choice is made
- [ ] Decision: Package Registration via Router vs Application Registration - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Migrate Controller Middleware from Constructor to HasMiddleware
- [ ] Skill applied: Register Middleware Using the Laravel 11+ Fluent API

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
- [ ] No controller calls `$this->middleware()` in constructor â€” would cause fatal error
- [ ] Every controller with middleware implements `HasMiddleware`
- [ ] Static `middleware()` method returns array of `Middleware` objects
- [ ] `Middleware` class is imported: `use Illuminate\Routing\Controllers\Middleware`
- [ ] `except` and `only` parameters are preserved from the original constructor calls

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Full Group Replacement Instead of Modification -- apply preferred alternative
    - [ ] Group modification (`append`, `prepend`) is used instead of full `group()` replacement
    - [ ] Session, CSRF, and cookie middleware are still present in web group
    - [ ] Login persists across requests
- [ ] Prevent: Using `$this->middleware()` in Laravel 11 -- apply preferred alternative
    - [ ] No controller uses `$this->middleware()` (Laravel 11+)
    - [ ] Controllers with middleware implement `HasMiddleware`
    - [ ] Static `middleware()` method is defined where needed
- [ ] Prevent: Trying to Access Middleware Config Object from Service Provider -- apply preferred alternative
    - [ ] Service providers use `$router->aliasMiddleware()` not `Middleware` object
    - [ ] Middleware registered in packages is functional
    - [ ] Both Laravel 10 and 11 are supported
- [ ] Prevent: Not Re-running `route:cache` After Middleware Changes -- apply preferred alternative
    - [ ] `route:cache` runs automatically on deployment
    - [ ] Middleware parameter changes take effect immediately after deployment
    - [ ] Rate limit numbers match configuration after deployment
- [ ] Prevent: Migrating Kernel.php During Laravel 10â†’11 Upgrade -- apply preferred alternative
    - [ ] Laravel 10â†’11 upgrade did not migrate middleware configuration
    - [ ] Kernel.php still works (it is backward compatible)
    - [ ] Middleware behavior is identical before and after upgrade

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
- Migrate Controller Middleware from Constructor to HasMiddleware
- Register Middleware Using the Laravel 11+ Fluent API
### Decision Trees (from 07)
- Laravel 10 Kernel.php vs Laravel 11 bootstrap/app.php Registration
- HasMiddleware Interface vs #[Middleware] Attribute for Controller Middleware
- Group Modification (append/prepend) vs Full Group Replacement
- Package Registration via Router vs Application Registration
### Anti-Patterns (from 08)
- Full Group Replacement Instead of Modification
- Using `$this->middleware()` in Laravel 11
- Trying to Access Middleware Config Object from Service Provider
- Not Re-running `route:cache` After Middleware Changes
- Migrating Kernel.php During Laravel 10â†’11 Upgrade
### Related Rules (from 06 skills)
- Use HasMiddleware or #[Middleware] for Controller Middleware in Laravel 11+ (laravel-11-vs-10-registration:5)
- Use Package-Registration Methods in Service Providers for Cross-Version Compatibility (laravel-11-vs-10-registration:5)
### Related Skills (from 06 skills)
- Register Middleware Using the Laravel 11+ Fluent API

