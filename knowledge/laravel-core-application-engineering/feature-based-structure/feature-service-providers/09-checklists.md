# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Auto-Discovery
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Provider extends `ServiceProvider` (or deferred base)
- [ ] `register()` contains only container bindings â€” no framework interactions
- [ ] `boot()` calls `parent::boot()` first
- [ ] All paths use `__DIR__.'/../'` relative notation â€” no hardcoded paths
- [ ] `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()` in `boot()`
- [ ] Provider registered in `config/app.php` providers array
- [ ] `php artisan route:list` shows feature routes (if any)
- [ ] No business logic in provider â€” only registration

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Provider registration: `App\Features\Billing\Providers\BillingServiceProvider::class` in `confi...
- [ ] Architecture guideline: - Boot method loads routes, views, migrations: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
- [ ] Architecture guideline: - Register method binds interfaces: `$this->app->bind(Interface::class, Implementation::class)`
- [ ] Architecture guideline: - Deferred providers implement `provides()` returning binding class names
- [ ] Architecture guideline: - Feature-specific commands registered in boot if `$this->app->runningInConsole()`
- [ ] Architecture guideline: - Feature config published via `$this->publishes()` with a tag
- [ ] Decision: Per-Feature Service Provider vs Single AppServiceProvider - ensure correct choice is made
- [ ] Decision: register() vs boot() â€” What Goes Where - ensure correct choice is made
- [ ] Decision: Deferred Provider vs Eager Provider for Feature Bindings - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create A Feature Service Provider
- [ ] Skill applied: Convert A Standard Provider To A Deferred Provider

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
- [ ] Provider extends `ServiceProvider` (or deferred base)
- [ ] `register()` contains only container bindings â€” no framework interactions
- [ ] `boot()` calls `parent::boot()` first
- [ ] All paths use `__DIR__.'/../'` relative notation â€” no hardcoded paths
- [ ] `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()` in `boot()`
- [ ] Provider registered in `config/app.php` providers array
- [ ] `php artisan route:list` shows feature routes (if any)

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
- Create A Feature Service Provider
- Convert A Standard Provider To A Deferred Provider
### Decision Trees (from 07)
- Per-Feature Service Provider vs Single AppServiceProvider
- register() vs boot() â€” What Goes Where
- Deferred Provider vs Eager Provider for Feature Bindings
### Related Rules (from 06 skills)
- Keep `register()` For Container Bindings Only (05-rules.md)
- Use Relative Paths In Provider Methods (05-rules.md)
- Never Put Business Logic In Service Providers (05-rules.md)
- Do Not Create One Giant Application Provider (05-rules.md)
- Always Call `parent::boot()` In Provider Overrides (05-rules.md)
- Order Providers Explicitly For Dependencies (05-rules.md)
- Defer Rarely-Used Feature Providers (05-rules.md)
- Cache Routes And Events In Production (05-rules.md)
- Document Provider Responsibilities In Feature README (05-rules.md)
### Related Skills (from 06 skills)
- Create A New Feature Scaffold
- Create And Register Feature Configuration
- Wire Cross-Feature Dependencies In Service Providers
- Create And Register Feature Routes

