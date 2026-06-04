# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageServiceProviderPatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `register()` contains only bindings and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, commands
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] Deferred providers set `$defer = true` and implement `provides()`
- [ ] Auto-discovery configured in composer.json
- [ ] Config merging in `register()`, not `boot()`
- [ ] No duplicate provider registration (auto-discovery + manual)
- [ ] Heavy operations deferred to lazy evaluation or event listeners

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Single Provider Pattern:** One provider per package; split only if functional separation is w...
- [ ] Architecture guideline: - **Register-Only Provides Boot Methods:** For packages that only bind classes into the container...
- [ ] Architecture guideline: - **Config Merging Pattern:** In `register()`: `$this->mergeConfigFrom(__DIR__.'/../config/packag...
- [ ] Architecture guideline: - **Event-Based Boot Pattern:** Use `$this->app['events']->listen()` in `boot()` to dispatch even...
- [ ] Architecture guideline: - **Singleton Binding Pattern:** `$this->app->singleton(Contract::class, Concrete::class)` in `re...
- [ ] Architecture guideline: - **Provider Base Class:** Extend Spatie's PackageServiceProvider for most packages; use Laravel'...
- [ ] Architecture guideline: - **Testing:** Test that providers register correctly: verify bindings are resolvable, deferred p...
- [ ] Decision: Eager vs Deferred Provider? - ensure correct choice is made
- [ ] Decision: Spatie Tools vs Manual Provider? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Design and Implement Laravel Package Service Providers

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
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] Deferred providers set `$defer = true` and implement `provides()`
- [ ] Auto-discovery configured in composer.json
- [ ] Config merging in `register()`, not `boot()`
- [ ] No duplicate provider registration (auto-discovery + manual)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Doing everything in boot() -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Giant provider classes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring deferred providers -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Runtime logic in register() -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Manual provider registration insistence -- apply preferred alternative
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
- Design and Implement Laravel Package Service Providers
### Decision Trees (from 07)
- Eager vs Deferred Provider?
- Spatie Tools vs Manual Provider?
### Anti-Patterns (from 08)
- Doing everything in boot()
- Giant provider classes
- Ignoring deferred providers
- Runtime logic in register()
- Manual provider registration insistence
### Related Skills (from 06 skills)
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery
- Set Up a Package Service Provider with Spatie Tools

