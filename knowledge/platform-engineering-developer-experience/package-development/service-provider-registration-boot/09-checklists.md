# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** ServiceProviderRegistrationBoot
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `register()` contains only bindings and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, commands
- [ ] No resolved services in `register()` (no `$this->app->make()`, `app()`)
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] `$defer = true` set for binding-only providers
- [ ] `provides()` returns all bindings for deferred providers
- [ ] Boot method injection used instead of constructor injection
- [ ] Heavy operations (DB, API, file I/O) deferred to lazy evaluation
- [ ] Conditional registration guards applied in `boot()` where needed

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **register-Only Providers:** For packages that only provide interface-to-class bindings: implem...
- [ ] Architecture guideline: - **Safe Boot Access:** In `boot()`, use method injection or `$this->app->make()` to access resol...
- [ ] Architecture guideline: - **Conditional Boot Registration:** Use `if ($this->app->runningInConsole())` or `if ($this->app...
- [ ] Architecture guideline: - **boot() Event Listeners:** Use `$this->app['events']->listen()` in `boot()` to register event ...
- [ ] Architecture guideline: - **Multiple Boot Method Pattern:** Define boot concerns in separate protected methods (`bootComm...
- [ ] Architecture guideline: - **Deferred Provider Resolution:** The `$defer` property and `provides()` method define which bi...
- [ ] Decision: Register vs Boot â€” Where Does This Go? - ensure correct choice is made
- [ ] Decision: Eager vs Deferred Provider? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Service Provider Registration (register vs boot)
- [ ] Skill applied: Write Deferred Service Providers for Laravel Packages

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
- [ ] `register()` contains only bindings and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, commands
- [ ] No resolved services in `register()` (no `$this->app->make()`, `app()`)
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] `$defer = true` set for binding-only providers
- [ ] `provides()` returns all bindings for deferred providers
- [ ] Boot method injection used instead of constructor injection

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Everything in boot() -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Constructor injection in providers -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Deferred providers with boot() logic -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: register() as initialization -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

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
- Implement Service Provider Registration (register vs boot)
- Write Deferred Service Providers for Laravel Packages
### Decision Trees (from 07)
- Register vs Boot â€” Where Does This Go?
- Eager vs Deferred Provider?
### Anti-Patterns (from 08)
- Everything in boot()
- Constructor injection in providers
- Deferred providers with boot() logic
- register() as initialization
### Related Skills (from 06 skills)
- Set Up a Package Service Provider with Spatie Tools
- Configure Package Auto-Discovery
- Write Deferred Service Providers for Laravel Packages

