# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Vertical Slice Architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Route file exists at `app/Features/{Feature}/routes.php`
- [ ] `loadRoutesFrom()` called in `boot()` of service provider
- [ ] Routes use fully qualified class names for controllers (no route closures)
- [ ] Route prefix is unique: `prefix('/billing')`
- [ ] Route name prefix is unique: `name('billing.')`
- [ ] All URLs use `route('name')` helper â€” no hardcoded URLs
- [ ] `php artisan route:list` shows feature routes with correct URIs
- [ ] `php artisan route:cache` works without errors

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Route file at `app/Features/{Feature}/routes.php`
- [ ] Architecture guideline: - Route groups with middleware, prefix: `Route::middleware(['auth'])->prefix('/billing')`
- [ ] Architecture guideline: - API routes with `Route::apiResource()` for RESTful endpoints
- [ ] Architecture guideline: - Livewire routes use component class: `Route::get('/billing/invoices', InvoicesList::class)`
- [ ] Architecture guideline: - Route model binding in features via explicit binding or `Route::model()` in service provider
- [ ] Architecture guideline: - Named routes with feature prefix: `->name('billing.invoices.index')`
- [ ] Decision: Per-Feature Route File vs Single routes/web.php - ensure correct choice is made
- [ ] Decision: Route Prefixing per Feature vs Centralized Prefix Management - ensure correct choice is made
- [ ] Decision: Route Closure vs Controller in Feature Routes - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create And Register Feature Routes
- [ ] Skill applied: Implement Route Model Binding For Feature Models

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
- [ ] Route file exists at `app/Features/{Feature}/routes.php`
- [ ] `loadRoutesFrom()` called in `boot()` of service provider
- [ ] Routes use fully qualified class names for controllers (no route closures)
- [ ] Route prefix is unique: `prefix('/billing')`
- [ ] Route name prefix is unique: `name('billing.')`
- [ ] All URLs use `route('name')` helper â€” no hardcoded URLs
- [ ] `php artisan route:list` shows feature routes with correct URIs

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
- Create And Register Feature Routes
- Implement Route Model Binding For Feature Models
### Decision Trees (from 07)
- Per-Feature Route File vs Single routes/web.php
- Route Prefixing per Feature vs Centralized Prefix Management
- Route Closure vs Controller in Feature Routes
### Related Rules (from 06 skills)
- Never Use Route Closures In Feature Files (05-rules.md)
- Use Consistent Prefix And Name Conventions (05-rules.md)
- Always Use Named Routes For URLs (05-rules.md)
- Verify Feature Routes With `php artisan route:list` (05-rules.md)
- Run `php artisan route:cache` In Every Deployment (05-rules.md)
- Organize Multiple Route Files Per Feature Group (05-rules.md)
### Related Skills (from 06 skills)
- Create A New Feature Scaffold
- Create Feature Service Provider
- Implement Route Model Binding For Feature Models

