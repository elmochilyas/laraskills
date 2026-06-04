# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Factory Definition
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Model uses `HasFactory` trait
- [ ] Factory has `definition()` method returning a plain array
- [ ] `fake()` provides realistic, variable values
- [ ] `fake()->unique()` applied to unique constraint columns
- [ ] Default values produce a valid model without overrides
- [ ] `$model` property omitted when convention resolves the class
- [ ] `definition()` has no side effects
- [ ] Performance: - `create()` triggers model events â€” use `make()` when persistence isn't ne...
- [ ] Performance: - Bulk creation with `->count(100)->create()` is efficient (single transaction)
- [ ] Performance: - For thousands of records, consider `raw()` + `DB::table()->insert()` to ski...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Factory at `database/factories/{Model}Factory.php`
- [ ] Architecture guideline: - Model has `use HasFactory` trait
- [ ] Architecture guideline: - `definition()` returns array with `fake()` and `fake()->unique()` for unique constraints

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create a Model Factory with HasFactory and definition()

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `create()` triggers model events â€” use `make()` when persistence isn't needed
- [ ] - Bulk creation with `->count(100)->create()` is efficient (single transaction)
- [ ] - For thousands of records, consider `raw()` + `DB::table()->insert()` to skip hydration

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
- [ ] Model uses `HasFactory` trait
- [ ] Factory has `definition()` method returning a plain array
- [ ] `fake()` provides realistic, variable values
- [ ] `fake()->unique()` applied to unique constraint columns
- [ ] Default values produce a valid model without overrides
- [ ] `$model` property omitted when convention resolves the class
- [ ] `definition()` has no side effects

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
- Create a Model Factory with HasFactory and definition()
### Related Rules (from 06 skills)
- Rule 1: Return Only an Attribute Array from definition()
- Rule 2: Use fake() for All Variable Attribute Values
- Rule 3: Use fake()->unique() for Unique Constraint Columns
- Rule 4: Always Add HasFactory Trait to the Model
- Rule 5: Set Sensible "Happy Path" Defaults in definition()
### Related Skills (from 06 skills)
- Factory States for Named State Variations
- Factory Callbacks for Post-Creation Logic
- Factory Sequences for Deterministic Data

