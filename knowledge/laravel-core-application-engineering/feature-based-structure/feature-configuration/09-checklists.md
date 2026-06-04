# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Dependencies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Config file exists at `app/Features/{Feature}/config.php`
- [ ] `mergeConfigFrom()` called in `boot()`, not `register()`
- [ ] All secrets use `env()` â€” no hardcoded credentials
- [ ] Environment variables prefixed with feature name (e.g., `BILLING_STRIPE_KEY`)
- [ ] Config keys namespaced with feature name: `config('billing.stripe.key')`
- [ ] Required config validated at provider boot with descriptive exception
- [ ] `php artisan config:cache` works without errors
- [ ] Config documented in feature README with key, default, required, description

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Config file location: `app/Features/{Feature}/config.php`
- [ ] Architecture guideline: - Provider merging: `$this->mergeConfigFrom(__DIR__.'/../config.php', 'billing')`
- [ ] Architecture guideline: - Access: `config('billing.stripe.key')`
- [ ] Architecture guideline: - Feature flags: `config('billing.features.new_checkout')` for gradual rollouts
- [ ] Architecture guideline: - Environment-specific configs: `config/default.php` + `config/production.php` with array merging
- [ ] Architecture guideline: - Config publishing for package extraction: `$this->publishes([...], 'billing-config')`
- [ ] Decision: Per-Feature Config File vs Global config/services.php - ensure correct choice is made
- [ ] Decision: Feature-Prefixed Env Vars vs Shared Env Var Namespace - ensure correct choice is made
- [ ] Decision: Config Merging in Service Provider vs Direct Config Access - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create And Register Feature Configuration
- [ ] Skill applied: Validate Feature Configuration At Boot

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
- [ ] Config file exists at `app/Features/{Feature}/config.php`
- [ ] `mergeConfigFrom()` called in `boot()`, not `register()`
- [ ] All secrets use `env()` â€” no hardcoded credentials
- [ ] Environment variables prefixed with feature name (e.g., `BILLING_STRIPE_KEY`)
- [ ] Config keys namespaced with feature name: `config('billing.stripe.key')`
- [ ] Required config validated at provider boot with descriptive exception
- [ ] `php artisan config:cache` works without errors

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
- Create And Register Feature Configuration
- Validate Feature Configuration At Boot
### Decision Trees (from 07)
- Per-Feature Config File vs Global config/services.php
- Feature-Prefixed Env Vars vs Shared Env Var Namespace
- Config Merging in Service Provider vs Direct Config Access
### Related Rules (from 06 skills)
- Use `mergeConfigFrom()` In Provider Boot Only (05-rules.md)
- Namespace Env Vars With Feature Prefix (05-rules.md)
- Never Hardcode Secrets In Config Files (05-rules.md)
- Validate Critical Config At Provider Boot (05-rules.md)
- Always Run `config:cache` In Production (05-rules.md)
- Document All Feature Config Keys (05-rules.md)
- Namespace Config Keys With Feature Name (05-rules.md)
- Use Feature Flags In Config For Gradual Rollouts (05-rules.md)
### Related Skills (from 06 skills)
- Create Feature Service Provider
- Define Cross-Feature Communication Contracts
- Evaluate Organizational Structure (feature-vs-layer)

