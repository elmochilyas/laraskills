# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Aggregate Boundaries
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: One Transaction Must Modify Only One Aggregate Instance
- [ ] Enforce: Reference Other Aggregates by Root ID, Not Object Reference
- [ ] Enforce: Use `DB::transaction()` to Wrap Aggregate Operations
- [ ] Enforce: Never Expose Internal Child Collections for Direct Modification
- [ ] Enforce: Keep Aggregate Boundaries Small
- [ ] Enforce: Validate Invariants Before and After Every Aggregate Mutation
- [ ] Enforce: Use `push()` for Atomic Root + Children Saves Only Within a Transaction
- [ ] Enforce: Do Not Cascade Persistence Across Aggregate Boundaries
- [ ] Performance: - Smaller aggregates mean smaller transactions and less locking
- [ ] Performance: - Loading a large aggregate with many children can be expensive â€” consider ...
- [ ] Performance: - Eventual consistency across aggregate boundaries improves write throughput

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Eloquent `HasMany` relationships define ownership within a potential aggregate boundary
- [ ] Architecture guideline: - `save()` on the parent does NOT automatically save children â€” use `push()` or `DB::transactio...
- [ ] Architecture guideline: - Wrap aggregate operations in `DB::transaction()` and manually manage related model persistence
- [ ] Architecture guideline: - Use `cascade` on foreign keys for referential integrity at the database level

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: One Transaction Must Modify Only One Aggregate Instance
- [ ] Apply rule: Reference Other Aggregates by Root ID, Not Object Reference
- [ ] Apply rule: Use `DB::transaction()` to Wrap Aggregate Operations
- [ ] Apply rule: Never Expose Internal Child Collections for Direct Modification
- [ ] Apply rule: Keep Aggregate Boundaries Small
- [ ] Apply rule: Validate Invariants Before and After Every Aggregate Mutation
- [ ] Apply rule: Use `push()` for Atomic Root + Children Saves Only Within a Transaction
- [ ] Apply rule: Do Not Cascade Persistence Across Aggregate Boundaries

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Smaller aggregates mean smaller transactions and less locking
- [ ] - Loading a large aggregate with many children can be expensive â€” consider lazy loading or pagination for children
- [ ] - Eventual consistency across aggregate boundaries improves write throughput

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Aggregate roots enforce access control to internal entities
- [ ] - The root is the enforcement point for all invariants â€” keep it consistent

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
- One Transaction Must Modify Only One Aggregate Instance
- Reference Other Aggregates by Root ID, Not Object Reference
- Use `DB::transaction()` to Wrap Aggregate Operations
- Never Expose Internal Child Collections for Direct Modification
- Keep Aggregate Boundaries Small
- Validate Invariants Before and After Every Aggregate Mutation
- Use `push()` for Atomic Root + Children Saves Only Within a Transaction
- Do Not Cascade Persistence Across Aggregate Boundaries

