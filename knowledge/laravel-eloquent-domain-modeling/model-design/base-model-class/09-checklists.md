# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Base Model Class
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Define `$fillable` on Every Model
- [ ] Enforce: Place Sensitive Attributes in `$hidden`
- [ ] Enforce: Create a Project-Specific Base Model
- [ ] Enforce: Use `Model::withoutEvents` for Bulk Operations
- [ ] Enforce: Use `toBase()` for Read-Only Bulk Queries
- [ ] Enforce: Override `$table` When Convention Does Not Match
- [ ] Enforce: Use `casts()` Method Over `$casts` Property in New Code
- [ ] Enforce: Never Use Eloquent Model as a DTO
- [ ] Enforce: Always Use `create()` or `fill()` with User Input
- [ ] `BaseModel` is abstract and extends `Illuminate\Database\Eloquent\Model`
- [ ] All project models extend `BaseModel` instead of `Model` directly
- [ ] `$fillable` is defined on every model (never `$guarded = []`)
- [ ] Sensitive attributes are listed in `$hidden`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] No Eloquent model is used as a DTO
- [ ] Performance: - Model hydration adds overhead â€” for bulk data operations, consider `toBas...
- [ ] Performance: - `Model::withoutEvents()` for bulk operations that don't need event side eff...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - All models extend the base `Model` class
- [ ] Architecture guideline: - Define `$fillable` or `$guarded` on every model
- [ ] Architecture guideline: - Use `casts()` method (Laravel 11+) over `$casts` property for attribute typing

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Define `$fillable` on Every Model
- [ ] Apply rule: Place Sensitive Attributes in `$hidden`
- [ ] Apply rule: Create a Project-Specific Base Model
- [ ] Apply rule: Use `Model::withoutEvents` for Bulk Operations
- [ ] Apply rule: Use `toBase()` for Read-Only Bulk Queries
- [ ] Apply rule: Override `$table` When Convention Does Not Match
- [ ] Apply rule: Use `casts()` Method Over `$casts` Property in New Code
- [ ] Apply rule: Never Use Eloquent Model as a DTO
- [ ] Apply rule: Always Use `create()` or `fill()` with User Input
- [ ] Skill applied: Set Up a Project-Specific BaseModel

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Model hydration adds overhead â€” for bulk data operations, consider `toBase()` to skip model instantiation
- [ ] - `Model::withoutEvents()` for bulk operations that don't need event side effects

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Mass assignment protection is a security feature â€” never set `$guarded = []`
- [ ] - Sensitive attributes should be in `$hidden` to prevent accidental serialization

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
- [ ] `BaseModel` is abstract and extends `Illuminate\Database\Eloquent\Model`
- [ ] All project models extend `BaseModel` instead of `Model` directly
- [ ] `$fillable` is defined on every model (never `$guarded = []`)
- [ ] Sensitive attributes are listed in `$hidden`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] No Eloquent model is used as a DTO

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
- Always Define `$fillable` on Every Model
- Place Sensitive Attributes in `$hidden`
- Create a Project-Specific Base Model
- Use `Model::withoutEvents` for Bulk Operations
- Use `toBase()` for Read-Only Bulk Queries
- Override `$table` When Convention Does Not Match
- Use `casts()` Method Over `$casts` Property in New Code
- Never Use Eloquent Model as a DTO
- Always Use `create()` or `fill()` with User Input
### Skills (from 06)
- Set Up a Project-Specific BaseModel
### Related Rules (from 06 skills)
- Always Define `$fillable` on Every Model
- Place Sensitive Attributes in `$hidden`
- Create a Project-Specific Base Model
- Use `Model::withoutEvents` for Bulk Operations
- Never Use Eloquent Model as a DTO
### Related Skills (from 06 skills)
- Model Configuration Properties for Overrides
- Model Conventions for Naming Standards
- Strict Mode Configuration for Error Detection

