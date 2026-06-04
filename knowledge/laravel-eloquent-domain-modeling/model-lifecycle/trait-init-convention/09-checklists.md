# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Initialize Trait Convention
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `initialize{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `public`
- [ ] Casts are set with `isset()` guard to avoid overwriting model-level definitions
- [ ] No database queries or I/O in the initialize method
- [ ] No relationship access in the initialize method
- [ ] No exceptions thrown for missing configuration
- [ ] Initialized values would not be better served by an accessor (computed on every access)
- [ ] Initialization logic is separated from boot logic (boot for static, initialize for per-instance)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `initialize{TraitName}` for per-instance setup
- [ ] Architecture guideline: - Keep initialize methods fast â€” no database queries
- [ ] Architecture guideline: - Check for existing values before overriding

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up initialize{TraitName}() for Per-Instance Defaults

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
- [ ] `initialize{TraitName}()` name matches the trait name exactly (case-sensitive)
- [ ] Method is declared as `public`
- [ ] Casts are set with `isset()` guard to avoid overwriting model-level definitions
- [ ] No database queries or I/O in the initialize method
- [ ] No relationship access in the initialize method
- [ ] No exceptions thrown for missing configuration
- [ ] Initialized values would not be better served by an accessor (computed on every access)

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
- Set Up initialize{TraitName}() for Per-Instance Defaults
### Related Rules (from 06 skills)
- Rule 1: Use `initialize{TraitName}()` for Per-Instance Defaults
- Rule 2: Check `isset()` Before Modifying Casts in `initialize{TraitName}()`
- Rule 3: Keep `initialize{TraitName}()` Methods Fast
- Rule 4: Do Not Access Relationships in `initialize{TraitName}()`
- Rule 5: Match `initialize{TraitName}()` Method Name Exactly to the Trait Name
- Rule 7: Do Not Throw Exceptions in `initialize{TraitName}()` for Configuration Errors
### Related Skills (from 06 skills)
- Trait Boot Convention for Static Lifecycle Hooks
- Trait Decomposition for Cross-Cutting Concerns
- Trait Boot Ordering for Composition

