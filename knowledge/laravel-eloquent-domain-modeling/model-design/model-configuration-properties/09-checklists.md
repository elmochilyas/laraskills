# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Model Configuration Properties
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Set Only Properties That Differ from Defaults
- [ ] Enforce: Prefer `casts()` Method Over `$casts` Property
- [ ] Enforce: Avoid `$with` for Bulk Eager Loading
- [ ] Enforce: Keep `$appends` Lightweight
- [ ] Enforce: Define `$dateFormat` in the Base Model
- [ ] Enforce: Set `$connection` via Runtime Resolution
- [ ] Enforce: Use `$primaryKey`, `$incrementing`, and `$keyType` Together
- [ ] Enforce: Keep `$fillable` in Alphabetical Order
- [ ] Only properties that differ from defaults are declared
- [ ] Primary key overrides include all three: `$primaryKey`, `$incrementing`, `$keyType`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] `$fillable` is alphabetically ordered
- [ ] `$with` is not used (or is explicitly justified)
- [ ] `$appends` contains only cheap accessors (no database queries)
- [ ] `$connection` uses runtime resolution via config, not hard-coded strings
- [ ] Performance: - `$with` eagerly loads on every query â€” avoid unless the relation is unive...
- [ ] Performance: - `$appends` runs accessors on every serialization â€” be mindful of performance
- [ ] Performance: - `$dateFormat` affects all date serialization â€” set once in a base model

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Override properties that differ from conventions
- [ ] Architecture guideline: - Document why each override exists
- [ ] Architecture guideline: - Use `casts()` method over `$casts` property in new code

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Set Only Properties That Differ from Defaults
- [ ] Apply rule: Prefer `casts()` Method Over `$casts` Property
- [ ] Apply rule: Avoid `$with` for Bulk Eager Loading
- [ ] Apply rule: Keep `$appends` Lightweight
- [ ] Apply rule: Define `$dateFormat` in the Base Model
- [ ] Apply rule: Set `$connection` via Runtime Resolution
- [ ] Apply rule: Use `$primaryKey`, `$incrementing`, and `$keyType` Together
- [ ] Apply rule: Keep `$fillable` in Alphabetical Order
- [ ] Skill applied: Configure Non-Conventional Model Properties

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `$with` eagerly loads on every query â€” avoid unless the relation is universally needed
- [ ] - `$appends` runs accessors on every serialization â€” be mindful of performance
- [ ] - `$dateFormat` affects all date serialization â€” set once in a base model

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
- [ ] Only properties that differ from defaults are declared
- [ ] Primary key overrides include all three: `$primaryKey`, `$incrementing`, `$keyType`
- [ ] `casts()` method used over `$casts` property in new code
- [ ] `$fillable` is alphabetically ordered
- [ ] `$with` is not used (or is explicitly justified)
- [ ] `$appends` contains only cheap accessors (no database queries)
- [ ] `$connection` uses runtime resolution via config, not hard-coded strings

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
- Set Only Properties That Differ from Defaults
- Prefer `casts()` Method Over `$casts` Property
- Avoid `$with` for Bulk Eager Loading
- Keep `$appends` Lightweight
- Define `$dateFormat` in the Base Model
- Set `$connection` via Runtime Resolution
- Use `$primaryKey`, `$incrementing`, and `$keyType` Together
- Keep `$fillable` in Alphabetical Order
### Skills (from 06)
- Configure Non-Conventional Model Properties
### Related Rules (from 06 skills)
- Set Only Properties That Differ from Defaults
- Prefer `casts()` Method Over `$casts` Property
- Avoid `$with` for Bulk Eager Loading
- Keep `$appends` Lightweight
- Use `$primaryKey`, `$incrementing`, and `$keyType` Together
### Related Skills (from 06 skills)
- Base Model Class for Shared Configuration
- Model Conventions for Naming Standards
- Strict Mode Configuration for Error Detection

