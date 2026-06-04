# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Trait Boot Convention
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `boot{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `protected static`
- [ ] Uses `static::` context for late static binding (not `self::` or `$this`)
- [ ] Contains no database queries or I/O operations
- [ ] No call to `parent::bootTraitName()`
- [ ] `initialize{TraitName}()` used for per-instance defaults (not `boot{TraitName}`)
- [ ] Trait is self-contained â€” no hidden dependencies on model code

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `boot{TraitName}` for static initialization (runs once per class)
- [ ] Architecture guideline: - `initialize{TraitName}` for instance initialization (runs per new model)
- [ ] Architecture guideline: - Both follow the same naming pattern based on the trait name

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up boot{TraitName}() for Automatic Event Registration

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
- [ ] `boot{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `protected static`
- [ ] Uses `static::` context for late static binding (not `self::` or `$this`)
- [ ] Contains no database queries or I/O operations
- [ ] No call to `parent::bootTraitName()`
- [ ] `initialize{TraitName}()` used for per-instance defaults (not `boot{TraitName}`)
- [ ] Trait is self-contained â€” no hidden dependencies on model code

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
- Set Up boot{TraitName}() for Automatic Event Registration
### Related Rules (from 06 skills)
- Rule 1: Always Use `boot{TraitName}()` for Static Lifecycle Setup
- Rule 2: Match `boot{TraitName}()` Method Name Exactly to the Trait Name
- Rule 3: Keep `boot{TraitName}()` Methods Lightweight
- Rule 5: Declare `boot{TraitName}()` as `protected static`
- Rule 6: Do Not Call `parent::bootTraitName()` Inside `boot{TraitName}()`
- Rule 7: Register Event Listeners Inside `boot{TraitName}()` Using the `static::` Context
### Related Skills (from 06 skills)
- Trait Init Convention for Instance Defaults
- Trait Decomposition for Cross-Cutting Concerns
- Trait Boot Ordering for Composition

