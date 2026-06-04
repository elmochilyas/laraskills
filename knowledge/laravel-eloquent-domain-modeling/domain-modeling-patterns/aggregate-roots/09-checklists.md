# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Aggregate Roots
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Expose Child Entities Only Through Aggregate Root Methods
- [ ] Enforce: Reference Other Aggregates Only by Their Root ID
- [ ] Enforce: Keep Aggregate Roots Small â€” Limit Child Entity Types
- [ ] Enforce: Enforce Invariants at Both Entry and Exit of Root Methods
- [ ] Enforce: Use `DB::transaction()` for All Aggregate Root Mutations
- [ ] Enforce: Never Return Child Collections for External Iteration
- [ ] Enforce: Name Aggregate Root Methods Using Ubiquitous Language
- [ ] Enforce: Validate Preconditions Before Calling `save()` on Children
- [ ] Performance: - Loading a large aggregate with all children is expensive â€” consider lazy ...
- [ ] Performance: - Smaller aggregates mean smaller transactions and less contention
- [ ] Performance: - Eventual consistency between aggregates improves write throughput

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - The root model has `HasMany`/`HasOne` relationships to child models
- [ ] Architecture guideline: - Root methods coordinate changes across children
- [ ] Architecture guideline: - `push()` recursively saves root + children but requires manual transaction wrapping
- [ ] Architecture guideline: - Access to children is guarded through root methods

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Expose Child Entities Only Through Aggregate Root Methods
- [ ] Apply rule: Reference Other Aggregates Only by Their Root ID
- [ ] Apply rule: Keep Aggregate Roots Small â€” Limit Child Entity Types
- [ ] Apply rule: Enforce Invariants at Both Entry and Exit of Root Methods
- [ ] Apply rule: Use `DB::transaction()` for All Aggregate Root Mutations
- [ ] Apply rule: Never Return Child Collections for External Iteration
- [ ] Apply rule: Name Aggregate Root Methods Using Ubiquitous Language
- [ ] Apply rule: Validate Preconditions Before Calling `save()` on Children

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Loading a large aggregate with all children is expensive â€” consider lazy loading children or paginating
- [ ] - Smaller aggregates mean smaller transactions and less contention
- [ ] - Eventual consistency between aggregates improves write throughput

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
- Expose Child Entities Only Through Aggregate Root Methods
- Reference Other Aggregates Only by Their Root ID
- Keep Aggregate Roots Small â€” Limit Child Entity Types
- Enforce Invariants at Both Entry and Exit of Root Methods
- Use `DB::transaction()` for All Aggregate Root Mutations
- Never Return Child Collections for External Iteration
- Name Aggregate Root Methods Using Ubiquitous Language
- Validate Preconditions Before Calling `save()` on Children

