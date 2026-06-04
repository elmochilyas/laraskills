# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Modular Monolith Basics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Feature directory named with singular PascalCase noun
- [ ] Service provider exists at `Providers/{FeatureName}ServiceProvider.php`
- [ ] `loadRoutesFrom(__DIR__.'/../routes.php')` in provider boot
- [ ] `loadViewsFrom(__DIR__.'/../views', 'feature_name')` if feature has views
- [ ] `loadMigrationsFrom(__DIR__.'/../Database/Migrations')` if feature has migrations
- [ ] Provider registered in `config/app.php` providers array
- [ ] Routes use unique prefix and name: `prefix('/billing')`, `name('billing.')`
- [ ] `parent::boot()` called in provider's `boot()` method
- [ ] No empty subdirectories
- [ ] `php artisan route:list` shows all feature routes

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Feature directories follow Laravel conventions internally (Controllers/, Models/, Services/)
- [ ] Architecture guideline: - Service provider registers feature: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
- [ ] Architecture guideline: - View namespacing: `$this->loadViewsFrom(__DIR__.'/../views', 'billing')` enables `billing::invo...
- [ ] Architecture guideline: - Migration loading: `$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations')`
- [ ] Architecture guideline: - Autoloading in `composer.json` stays as `"App\\": "app/"` â€” no changes needed
- [ ] Architecture guideline: - Feature namespace: `App\Features\{FeatureName}\{Layer}\{Class}`
- [ ] Decision: Feature-Based vs Layer-Based Structure Decision - ensure correct choice is made
- [ ] Decision: When to Introduce Feature Structure (Project Age / Model Count Threshold) - ensure correct choice is made
- [ ] Decision: Full Feature Directory vs Minimal Per-Feature Structure - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create A New Feature Scaffold
- [ ] Skill applied: Evaluate Organizational Structure For A Laravel Project

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
- [ ] Feature directory named with singular PascalCase noun
- [ ] Service provider exists at `Providers/{FeatureName}ServiceProvider.php`
- [ ] `loadRoutesFrom(__DIR__.'/../routes.php')` in provider boot
- [ ] `loadViewsFrom(__DIR__.'/../views', 'feature_name')` if feature has views
- [ ] `loadMigrationsFrom(__DIR__.'/../Database/Migrations')` if feature has migrations
- [ ] Provider registered in `config/app.php` providers array
- [ ] Routes use unique prefix and name: `prefix('/billing')`, `name('billing.')`

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
- Create A New Feature Scaffold
- Evaluate Organizational Structure For A Laravel Project
### Decision Trees (from 07)
- Feature-Based vs Layer-Based Structure Decision
- When to Introduce Feature Structure (Project Age / Model Count Threshold)
- Full Feature Directory vs Minimal Per-Feature Structure
### Related Rules (from 06 skills)
- Each Feature Is A Bounded Context (05-rules.md)
- Maintain Feature Granularity At 3-20 Files (05-rules.md)
- Use Service Provider Per Feature For Component Registration (05-rules.md)
- Do Not Mix Feature And Layer Structure (05-rules.md)
- Customize Artisan Stubs For Feature Namespaces (05-rules.md)
### Related Skills (from 06 skills)
- Create Feature Service Provider
- Create And Register Feature Configuration
- Evaluate Organizational Structure (feature-vs-layer)

