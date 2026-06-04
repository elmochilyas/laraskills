# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Strict Mode Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Enable `Model::shouldBeStrict()` in Non-Production Environments
- [ ] Enforce: Use Individual Controls for Fine-Grained Production Configuration
- [ ] Enforce: Use Custom Handler for Admin Panel Lazy Loading
- [ ] Enforce: Enable Strict Mode in Test Environment
- [ ] Enforce: Never Deploy Without `preventSilentlyDiscardingAttributes`
- [ ] Enforce: Combine `preventAccessingMissingAttributes` with Strict Typing
- [ ] Enforce: Log Instead of Silently Allow Lazy Loading in Production
- [ ] Enforce: Create a Dedicated Service Provider for Strict Mode
- [ ] Enforce: Enable Strict Mode in CI Pipeline
- [ ] `Model::shouldBeStrict()` enabled in `local`, `testing`, and `staging`
- [ ] `preventSilentlyDiscardingAttributes()` enabled in every environment
- [ ] Production lazy loading configured with custom handler (log instead of throw for admin)
- [ ] Test environment has strict mode enabled and CI pipeline enforces it
- [ ] Admin panel lazy loading is handled gracefully (logged, not thrown)
- [ ] Strict mode is in a dedicated service provider (not `AppServiceProvider`)
- [ ] Performance: - `preventAccessingMissingAttributes` adds a minor check on every attribute a...
- [ ] Performance: - `preventLazyLoading` adds no runtime overhead â€” it only throws when a vio...
- [ ] Performance: - The cost is negligible compared to the cost of the bugs these features catch

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Call in `AppServiceProvider::boot()` or `App\Providers\ModelStrictServiceProvider`
- [ ] Architecture guideline: - Use `shouldBeStrict()` for non-production; individual controls for fine-tuned production
- [ ] Architecture guideline: - Customize `LazyLoadingViolationException` handler to log instead of throw for admin contexts

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Enable `Model::shouldBeStrict()` in Non-Production Environments
- [ ] Apply rule: Use Individual Controls for Fine-Grained Production Configuration
- [ ] Apply rule: Use Custom Handler for Admin Panel Lazy Loading
- [ ] Apply rule: Enable Strict Mode in Test Environment
- [ ] Apply rule: Never Deploy Without `preventSilentlyDiscardingAttributes`
- [ ] Apply rule: Combine `preventAccessingMissingAttributes` with Strict Typing
- [ ] Apply rule: Log Instead of Silently Allow Lazy Loading in Production
- [ ] Apply rule: Create a Dedicated Service Provider for Strict Mode
- [ ] Apply rule: Enable Strict Mode in CI Pipeline
- [ ] Skill applied: Enable Eloquent Strict Mode Across Environments

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `preventAccessingMissingAttributes` adds a minor check on every attribute access
- [ ] - `preventLazyLoading` adds no runtime overhead â€” it only throws when a violation occurs
- [ ] - The cost is negligible compared to the cost of the bugs these features catch

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
- [ ] `Model::shouldBeStrict()` enabled in `local`, `testing`, and `staging`
- [ ] `preventSilentlyDiscardingAttributes()` enabled in every environment
- [ ] Production lazy loading configured with custom handler (log instead of throw for admin)
- [ ] Test environment has strict mode enabled and CI pipeline enforces it
- [ ] Admin panel lazy loading is handled gracefully (logged, not thrown)
- [ ] Strict mode is in a dedicated service provider (not `AppServiceProvider`)

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
### Rules (from 05)
- Enable `Model::shouldBeStrict()` in Non-Production Environments
- Use Individual Controls for Fine-Grained Production Configuration
- Use Custom Handler for Admin Panel Lazy Loading
- Enable Strict Mode in Test Environment
- Never Deploy Without `preventSilentlyDiscardingAttributes`
- Combine `preventAccessingMissingAttributes` with Strict Typing
- Log Instead of Silently Allow Lazy Loading in Production
- Create a Dedicated Service Provider for Strict Mode
- Enable Strict Mode in CI Pipeline
### Skills (from 06)
- Enable Eloquent Strict Mode Across Environments
### Related Rules (from 06 skills)
- Enable `Model::shouldBeStrict()` in Non-Production Environments
- Use Individual Controls for Fine-Grained Production Configuration
- Enable Strict Mode in Test Environment
- Never Deploy Without `preventSilentlyDiscardingAttributes`
- Create a Dedicated Service Provider for Strict Mode
### Related Skills (from 06 skills)
- Base Model Class Configuration
- Event Control / Quiet Operations for Bulk Suppression
- Model Configuration Properties for Overrides

