# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Technical vs Domain Grouping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Structure decision documented in README with rationale
- [ ] If feature-based: all controllers, models, services in feature directories
- [ ] If feature-based: Artisan stubs customized or module package installed
- [ ] If feature-based: shared kernel directory exists
- [ ] If feature-based: cross-feature communication rules documented
- [ ] If layer-based: criteria for revisiting decision documented
- [ ] If layer-based: no feature directories created inadvertently

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - PSR-4 autoloading handles both structures equally: `App\Features\Billing\Controllers\BillingCon...
- [ ] Architecture guideline: - Service providers in feature-based structure distribute registrations per feature; layer-based ...
- [ ] Architecture guideline: - Feature routes are loaded via `loadRoutesFrom()` in each feature's service provider
- [ ] Architecture guideline: - Route caching (`php artisan route:cache`) works identically for both structures
- [ ] Architecture guideline: - Artisan generators (`make:model`, `make:controller`) default to layer-based namespaces â€” cust...
- [ ] Architecture guideline: - Shared models like `User` that span multiple features stay in `app/Models/`
- [ ] Decision: Layer-Based vs Feature-Based Organizational Structure - ensure correct choice is made
- [ ] Decision: Team Convention vs Project-Driven Structure Choice - ensure correct choice is made
- [ ] Decision: Migration from Layer to Feature vs Staying with Layer - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Evaluate Organizational Structure For A New Project
- [ ] Skill applied: Migrate From Layer-Based To Feature-Based Structure

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
- [ ] Structure decision documented in README with rationale
- [ ] If feature-based: all controllers, models, services in feature directories
- [ ] If feature-based: Artisan stubs customized or module package installed
- [ ] If feature-based: shared kernel directory exists
- [ ] If feature-based: cross-feature communication rules documented
- [ ] If layer-based: criteria for revisiting decision documented
- [ ] If layer-based: no feature directories created inadvertently

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
- Evaluate Organizational Structure For A New Project
- Migrate From Layer-Based To Feature-Based Structure
### Decision Trees (from 07)
- Layer-Based vs Feature-Based Organizational Structure
- Team Convention vs Project-Driven Structure Choice
- Migration from Layer to Feature vs Staying with Layer
### Related Rules (from 06 skills)
- Make The Structure Decision Early (05-rules.md)
- Commit Fully To One Structure (05-rules.md)
- One Feature Per Business Domain (05-rules.md)
- Maintain A Shared Kernel For Cross-Cutting Code (05-rules.md)
- Customize Artisan Stubs For Feature Namespace Generation (05-rules.md)
- Document The Structural Decision (05-rules.md)
### Related Skills (from 06 skills)
- Create A New Feature Scaffold
- Migrate From Layer-Based To Feature-Based Structure
- Maintain Consistent Feature Directory Structure (module-organization)

