# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Bootstrapping Lifecycle
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Keep register() Clean
- [ ] Verify: Defer Provider Instantiation
- [ ] Verify: Run Artisan Optimize on Deploy
- [ ] Verify: Never Resolve Services in register()
- [ ] `config:cache` produces `bootstrap/cache/config.php` without errors
- [ ] `route:cache` produces `bootstrap/cache/routes-v7.php` without errors
- [ ] `event:cache` produces `bootstrap/cache/events.php` without errors
- [ ] `php artisan optimize` completes without errors
- [ ] `composer dump-autoload -o` generates classmap for all namespaces
- [ ] Deferred service providers all implement `provides()` returning their bound abstracts
- [ ] Deferred providers are not used on >80% of requests (profile to verify)
- [ ] Application behaves identically before and after caching in production
- [ ] Deployment script includes cache commands in correct order
- [ ] Performance: ### Config Caching
- [ ] Performance: Reduces `LoadConfiguration` from reading 20+ files to a single file include. ...
- [ ] Performance: ### Deferred Provider Manifest

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Layer Placement
- [ ] Architecture guideline: public/index.php â†’ bootstrap/app.php â†’ Kernel::handle()
- [ ] Architecture guideline: Bootstrap (6 steps: env, config, errors, facades, register, boot)
- [ ] Architecture guideline: Middleware Pipeline (global â†’ route groups â†’ route)
- [ ] Architecture guideline: Router â†’ Controller â†’ Response
- [ ] Architecture guideline: Terminate (cleanup callbacks)
- [ ] Architecture guideline: ### Boundary Rules
- [ ] Architecture guideline: - Bootstrap steps are sequential and deterministic â€” no step can re-enter a previous step
- [ ] Architecture guideline: - The middleware pipeline is concentric â€” each layer can short-circuit
- [ ] Architecture guideline: - `terminate()` runs after the response is sent â€” no new responses can be generated
- [ ] Architecture guideline: ### Deployment Sequence
- [ ] Architecture guideline: Every deployment should run: `php artisan config:cache` â†’ `php artisan route:cache` â†’ `php ar...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Keep register() Clean
- [ ] Best practice: Defer Provider Instantiation
- [ ] Best practice: Run Artisan Optimize on Deploy
- [ ] Best practice: Never Resolve Services in register()
- [ ] Skill applied: Optimize Bootstrap Performance
- [ ] Skill applied: Debug Bootstrap Issues

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Config Caching
- [ ] Reduces `LoadConfiguration` from reading 20+ files to a single file include. Saves 5-15ms. Enable in production.
- [ ] ### Deferred Provider Manifest
- [ ] The manifest (`bootstrap/cache/services.php`) maps service abstracts to their provider classes. Without it, all defer...
- [ ] ### Bootstrapper Impact (most to least)
- [ ] 1. `BootProviders` â€” provider boot logic dominates
- [ ] 2. `RegisterProviders` â€” class loading and instantiation
- [ ] 3. `LoadConfiguration` â€” mitigated by config cache
- [ ] 4. `RegisterFacades` â€” class_alias calls

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Environment Exposure
- [ ] If `APP_ENV` is set to a non-production value, debug mode may be enabled, exposing stack traces and configuration. Pr...
- [ ] ### Bootstrap File Integrity
- [ ] `bootstrap/app.php` is the single file that creates the Application instance. If compromised, an attacker can interce...

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
- [ ] `config:cache` produces `bootstrap/cache/config.php` without errors
- [ ] `route:cache` produces `bootstrap/cache/routes-v7.php` without errors
- [ ] `event:cache` produces `bootstrap/cache/events.php` without errors
- [ ] `php artisan optimize` completes without errors
- [ ] `composer dump-autoload -o` generates classmap for all namespaces
- [ ] Deferred service providers all implement `provides()` returning their bound abstracts
- [ ] Deferred providers are not used on >80% of requests (profile to verify)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Service Resolution in `register()` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Business Logic in Custom Bootstrappers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Assuming Service Provider Boot Order -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Forgetting Cache in Production -- apply preferred alternative
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
- Optimize Bootstrap Performance
- Debug Bootstrap Issues
### Decision Trees (from 07)
- Provider Registration vs Boot Phase Placement
- Deferred vs Eager Service Provider Loading
- Custom Bootstrapper vs Service Provider for Initialization
### Anti-Patterns (from 08)
- Service Resolution in `register()`
- Business Logic in Custom Bootstrappers
- Assuming Service Provider Boot Order
- Forgetting Cache in Production
### Related Rules (from 06 skills)
- Run php artisan optimize in Every Production Deployment (05-rules.md)
- Defer Providers for Services Not Used on Every Request (05-rules.md)
- Always Run config:cache in Production (05-rules.md)
- Validate Environment Variables at Bootstrap (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Debug Bootstrap Issues
- Skill: Implement Deferred Service Providers
- Skill: Configure Deployment Pipeline

