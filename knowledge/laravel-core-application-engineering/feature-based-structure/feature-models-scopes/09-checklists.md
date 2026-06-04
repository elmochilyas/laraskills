# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Feature Flags
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Model namespace is `App\Features\{Feature}\Models\{Model}`
- [ ] `$table` property explicitly defined with feature prefix (e.g., `billing_invoices`)
- [ ] Migration co-located in feature's `Database/Migrations/` and loaded via provider
- [ ] Factory co-located with correct `$model` reference
- [ ] No direct cross-feature model imports (enforced by static analysis)
- [ ] Route model binding registered for the model
- [ ] Factory `$model` points to fully qualified feature model class

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Feature models use standard Eloquent table naming conventions
- [ ] Architecture guideline: - Custom table names defined explicitly: `protected $table = 'billing_invoices'`
- [ ] Architecture guideline: - Migrations loaded from `Features/{Feature}/Database/Migrations/` via service provider
- [ ] Architecture guideline: - Factories co-located with proper model reference: `protected $model = Invoice::class`
- [ ] Architecture guideline: - Route model binding works with feature models via fully qualified class names
- [ ] Architecture guideline: - Polymorphic relationships for models that can belong to multiple features
- [ ] Decision: Feature-Specific Model vs Shared app/Models/ Placement - ensure correct choice is made
- [ ] Decision: Trait-Based Relationship Extension vs Direct Relationship on Shared Model - ensure correct choice is made
- [ ] Decision: Feature-Specific Global Scope vs Query Scope vs Repository - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Add A Feature-Specific Model
- [ ] Skill applied: Extend Shared Models With Feature-Specific Relationships Via Traits

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
- [ ] Model namespace is `App\Features\{Feature}\Models\{Model}`
- [ ] `$table` property explicitly defined with feature prefix (e.g., `billing_invoices`)
- [ ] Migration co-located in feature's `Database/Migrations/` and loaded via provider
- [ ] Factory co-located with correct `$model` reference
- [ ] No direct cross-feature model imports (enforced by static analysis)
- [ ] Route model binding registered for the model
- [ ] Factory `$model` points to fully qualified feature model class

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
- Add A Feature-Specific Model
- Extend Shared Models With Feature-Specific Relationships Via Traits
### Decision Trees (from 07)
- Feature-Specific Model vs Shared app/Models/ Placement
- Trait-Based Relationship Extension vs Direct Relationship on Shared Model
- Feature-Specific Global Scope vs Query Scope vs Repository
### Related Rules (from 06 skills)
- Namespace Tells Ownership (05-rules.md)
- Keep Shared Models Slim (05-rules.md)
- Use Service-Level Queries For Complex Aggregations (05-rules.md)
- Register Feature Model Migrations (05-rules.md)
- Co-locate Factories With Feature Models (05-rules.md)
- Use Custom Table Names For Feature Models (05-rules.md)
- Define Clear Policy For Model Placement (05-rules.md)
### Related Skills (from 06 skills)
- Create A New Feature Scaffold
- Extend Shared Models With Feature-Specific Relationships Via Traits
- Create And Register Feature Configuration

