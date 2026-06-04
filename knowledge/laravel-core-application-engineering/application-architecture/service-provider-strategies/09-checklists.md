# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Service Provider Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Keep register() Thin
- [ ] Verify: Use Method Injection in boot()
- [ ] Verify: Defer Expensive Providers
- [ ] Verify: Organize by Domain
- [ ] `register()` contains only binding calls â€” no `$this->app->make()` or facade calls
- [ ] All bindings use interfaces as the abstract where possible
- [ ] Stateless services use `singleton()` or `scoped()`
- [ ] Deferred providers have `$defer = true` and implement `provides()`
- [ ] Provider does not contain business logic, database queries, or API calls
- [ ] Method injection is used in `boot()` instead of manual `$this->app->make()`
- [ ] Environment-gated providers (debug toolbar, profiler) are wrapped in `if (! $this->app->environment('production'))`
- [ ] Performance: ### Provider Instantiation Cost
- [ ] Performance: 20 eager providers add 2-5ms to bootstrap time. Deferred providers avoid this...
- [ ] Performance: ### Manifest Lookup

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Provider Order
- [ ] Architecture guideline: 1. Core framework providers (cache, config, auth, session)
- [ ] Architecture guideline: 2. Third-party package providers
- [ ] Architecture guideline: 3. Application domain providers
- [ ] Architecture guideline: 4. Application bootstrap provider (AppServiceProvider)
- [ ] Architecture guideline: ### Deferred Provider Contract
- [ ] Architecture guideline: - Set `protected $defer = true`
- [ ] Architecture guideline: - Implement `provides()` returning all bound abstracts
- [ ] Architecture guideline: - Never resolve services in `register()` (deferred providers also follow the register/boot contract)
- [ ] Architecture guideline: ### Registration Gateway Pattern
- [ ] Architecture guideline: public function register()
- [ ] Architecture guideline: if ($this->app->environment('production')) {

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Keep register() Thin
- [ ] Best practice: Use Method Injection in boot()
- [ ] Best practice: Defer Expensive Providers
- [ ] Best practice: Organize by Domain
- [ ] Skill applied: Keep register() Thin with Container Bindings
- [ ] Skill applied: Organize Service Providers by Domain

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Provider Instantiation Cost
- [ ] 20 eager providers add 2-5ms to bootstrap time. Deferred providers avoid this entirely until first resolution.
- [ ] ### Manifest Lookup
- [ ] Deferred resolution adds a hash map lookup (O(1), <0.1ms). Negligible overhead.
- [ ] ### Boot Phase Cost
- [ ] The `boot()` phase iterates all loaded providers. Heavy `boot()` methods (model observation, route building) dominate...
- [ ] ### Optimize Command
- [ ] `php artisan optimize` compiles: deferred manifest, package discovery, facade aliases. Without it, deferred providers...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Environment Gating
- [ ] Debug/profiler providers should only register in non-production environments. Use `$this->app->environment('productio...
- [ ] ### Package Discovery Integrity
- [ ] If `bootstrap/cache/packages.php` is corrupted, package providers may not load. Verify with `php artisan package:disc...
- [ ] ### Provider Order Exploitation
- [ ] An attacker who can modify `config/app.php` provider order can change application behavior. Protect the config file w...

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
- [ ] `register()` contains only binding calls â€” no `$this->app->make()` or facade calls
- [ ] All bindings use interfaces as the abstract where possible
- [ ] Stateless services use `singleton()` or `scoped()`
- [ ] Deferred providers have `$defer = true` and implement `provides()`
- [ ] Provider does not contain business logic, database queries, or API calls
- [ ] Method injection is used in `boot()` instead of manual `$this->app->make()`
- [ ] Environment-gated providers (debug toolbar, profiler) are wrapped in `if (! $this->app->environment('production'))`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: God Provider -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Business Logic in Service Providers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Service Resolution in `register()` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Over-Deferring or Under-Deferring Providers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Keep register() Thin with Container Bindings
- Organize Service Providers by Domain
### Decision Trees (from 07)
- Provider Phase Placement (register vs boot)
- Eager vs Deferred Provider Loading
- Provider Organization (Monolithic vs Domain-Scoped)
### Anti-Patterns (from 08)
- God Provider
- Business Logic in Service Providers
- Service Resolution in `register()`
- Over-Deferring or Under-Deferring Providers
### Related Rules (from 06 skills)
- Keep register() Thin â€” Only Container Bindings (05-rules.md)
- Use Method Injection in boot() (05-rules.md)
- Defer Providers for Services Not Used on Every Request (05-rules.md)
- Implement provides() for Every Deferred Provider (05-rules.md)
- Organize Providers by Domain or Bounded Context (05-rules.md)
- Never Put Business Logic in Service Providers (05-rules.md)
- Gate Debug/Profiler Providers by Environment (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Bind and Resolve Services in Container
- Skill: Optimize Bootstrap Performance
- Skill: Organize Service Providers by Domain

