# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Observer Pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Observer class follows `{Model}{Concern}Observer` naming convention
- [ ] Observer is in `App\Observers` namespace
- [ ] Methods type-hint the specific model class
- [ ] Methods are under 5 lines (single operation)
- [ ] Dependencies are injected via constructor
- [ ] Observer is registered with `#[ObservedBy]` attribute
- [ ] Multiple observers are stacked with separate `#[ObservedBy]` attributes
- [ ] No business logic in observer methods
- [ ] Performance: - Each observer method adds a method call per event â€” negligible overhead
- [ ] Performance: - Expensive operations in observers (API calls, email) should be queued
- [ ] Performance: - Use `saveQuietly()` for bulk operations to skip observer execution

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Observers in `App\Observers\*`
- [ ] Architecture guideline: - Registered via `#[ObservedBy]` attribute on the model
- [ ] Architecture guideline: - One observer per infrastructure concern
- [ ] Architecture guideline: - Observers should not call other observers or create circular dependencies

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Single-Concern Observer with #[ObservedBy]

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Each observer method adds a method call per event â€” negligible overhead
- [ ] - Expensive operations in observers (API calls, email) should be queued
- [ ] - Use `saveQuietly()` for bulk operations to skip observer execution

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
- [ ] Observer class follows `{Model}{Concern}Observer` naming convention
- [ ] Observer is in `App\Observers` namespace
- [ ] Methods type-hint the specific model class
- [ ] Methods are under 5 lines (single operation)
- [ ] Dependencies are injected via constructor
- [ ] Observer is registered with `#[ObservedBy]` attribute
- [ ] Multiple observers are stacked with separate `#[ObservedBy]` attributes

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
- Create Single-Concern Observer with #[ObservedBy]
### Related Rules (from 06 skills)
- Rule 1: Register Observers With the `#[ObservedBy]` Attribute
- Rule 2: Keep Observer Classes Focused on a Single Infrastructure Concern
- Rule 3: Place Observers in the `App\Observers` Namespace
- Rule 4: Do Not Put Business Logic in Observers â€” Use Domain Events Instead
- Rule 6: Do Not Call Other Models' Observer Methods Directly
- Rule 7: Type-Hint the Specific Model Class in Observer Methods
### Related Skills (from 06 skills)
- Observer Registration with #[ObservedBy]
- Observer Anti-Patterns for Design
- Attribute Registration for PHP 8 Attributes

