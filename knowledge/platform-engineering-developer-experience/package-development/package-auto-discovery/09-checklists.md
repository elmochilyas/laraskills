# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageAutoDiscovery
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `composer.json` includes `extra.laravel.providers` array with fully qualified provider class
- [ ] `extra.laravel.aliases` included for facade classes (if any)
- [ ] Provider class names use double backslashes and match actual filesystem/namespace
- [ ] Installation in fresh Laravel app auto-registers provider without manual config
- [ ] `php artisan optimize` produces correct `packages.php` cache
- [ ] Environment guards applied for development-only functionality
- [ ] No production-relevant logic in dev-only packages

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Standard Discovery Pattern:** `"extra": {"laravel": {"providers": ["Vendor\\Package\\PackageS...
- [ ] Architecture guideline: - **Conditional Auto-Discovery:** Use `suggest` and documentation for packages that may not be wa...
- [ ] Architecture guideline: - **Discovery Exemption Pattern:** For packages requiring controlled boot order: `"extra": {"lara...
- [ ] Architecture guideline: - **Development-Only Discovery:** Packages that are development-only should use auto-discovery by...
- [ ] Architecture guideline: - **Facade Registration:** Auto-discovered aliases are registered as class aliases that point to ...
- [ ] Architecture guideline: - **Provider Grouping:** Single provider per package for simplicity; multiple providers are possi...
- [ ] Decision: Auto-Discovery vs Manual Registration? - ensure correct choice is made
- [ ] Decision: Application-Level â€” Opt-Out Specific vs Global `*`? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Package Auto-Discovery for Laravel Packages
- [ ] Skill applied: Troubleshoot Package Auto-Discovery Issues

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
- [ ] `composer.json` includes `extra.laravel.providers` array with fully qualified provider class
- [ ] `extra.laravel.aliases` included for facade classes (if any)
- [ ] Provider class names use double backslashes and match actual filesystem/namespace
- [ ] Installation in fresh Laravel app auto-registers provider without manual config
- [ ] `php artisan optimize` produces correct `packages.php` cache
- [ ] Environment guards applied for development-only functionality
- [ ] No production-relevant logic in dev-only packages

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Disabling auto-discovery globally -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Manual registration for every package -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Relying on auto-discovery for boot order -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Dev-only packages without environment guards -- apply preferred alternative
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
- Configure Package Auto-Discovery for Laravel Packages
- Troubleshoot Package Auto-Discovery Issues
### Decision Trees (from 07)
- Auto-Discovery vs Manual Registration?
- Application-Level â€” Opt-Out Specific vs Global `*`?
### Anti-Patterns (from 08)
- Disabling auto-discovery globally
- Manual registration for every package
- Relying on auto-discovery for boot order
- Dev-only packages without environment guards
### Related Skills (from 06 skills)
- Implement Service Provider Registration (register vs boot)
- Set Up a Package Service Provider with Spatie Tools
- Publish a Laravel Package to Packagist

