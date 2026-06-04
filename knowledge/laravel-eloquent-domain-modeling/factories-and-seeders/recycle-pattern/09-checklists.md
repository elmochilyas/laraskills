# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Recycle Pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `recycle()` placed before `has()`, `for()`, or `hasAttached()` in the chain
- [ ] Single instance used for singleton reuse; collection for round-robin
- [ ] Recycled models have meaningful variation (states) when relevant
- [ ] `recycle()` is not used when each child needs a unique parent (HasOne)
- [ ] Circular dependency is resolved (if recycle is being used for that purpose)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `recycle()` at the top of the factory chain for graph-wide reuse
- [ ] Architecture guideline: - Single instance for singleton-like reuse; collection for distributed reuse
- [ ] Architecture guideline: - Combine with `has()`, `for()`, `hasAttached()` for complete graph control

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Shared Parent with recycle() for Batch Child Creation

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
- [ ] `recycle()` placed before `has()`, `for()`, or `hasAttached()` in the chain
- [ ] Single instance used for singleton reuse; collection for round-robin
- [ ] Recycled models have meaningful variation (states) when relevant
- [ ] `recycle()` is not used when each child needs a unique parent (HasOne)
- [ ] Circular dependency is resolved (if recycle is being used for that purpose)

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
- Set Up Shared Parent with recycle() for Batch Child Creation
### Related Rules (from 06 skills)
- Rule 1: Use recycle() When Many Children Share the Same Parent
- Rule 2: Pass a Collection for Round-Robin Distribution
- Rule 3: Use recycle() to Resolve Circular Dependencies
- Rule 4: Apply recycle() at the Top of the Factory Chain
- Rule 7: Use recycle() for Performance, Not as a Data Strategy Default
### Related Skills (from 06 skills)
- Circular Dependency Resolution with recycle()
- HasMany Factory Relationships with has()
- BelongsTo Factory Relationships with for()

