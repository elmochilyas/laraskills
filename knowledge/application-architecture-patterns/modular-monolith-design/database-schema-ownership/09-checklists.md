# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Database schema ownership per module
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Schema ownership violation in migrations prevented
- [ ] Orphan tables prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Assign every table to exactly one owning module.** No table may be shared between modules or exist without a designated owner. Cross-cutting infrastructure tables (migrations, cache, sessions) are owned by the application.
- [ ] Workflow step completed: **Use prefix naming convention for module tables.** Prefix every module table with the module name (`billing_invoices`, `catalog_products`). This enables visual identification and automated enforcement.
- [ ] Workflow step completed: **Never create cross-module foreign keys.** Store referenced IDs as plain integers/strings without `constrained()` foreign key constraints. Referential integrity is managed by application code.
- [ ] Workflow step completed: **Document table ownership in a table registry.** Maintain a registry listing every table, its owning module, and contact information. Keep it versioned in the repository.
- [ ] Workflow step completed: **Run migrations in dependency order.** Declare migration priority in `module.json`. Ensure Module A's migrations run before Module B's when B depends on A.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Shared tables.
- [ ] Failure addressed: Cross-module foreign keys.
- [ ] Failure addressed: Migration ordering issues.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Every table has a clear owning module
- [ ] Table naming prefix convention is documented and enforced
- [ ] No cross-module foreign keys exist in the database
- [ ] Module migrations run in documented dependency order
- [ ] Database-level permissions (or equivalent) restrict per-module table access
- [ ] Table registry is maintained and versioned
- [ ] Orphan tables from removed modules are cleaned up

### Success Criteria
- [ ] Every database table has a documented owning module with prefix naming.
- [ ] No cross-module foreign keys exist.
- [ ] Database permissions restrict per-module table access.
- [ ] Migration ordering prevents deployment failures.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Schema ownership violation in migrations
- [ ] Anti-pattern prevented: Orphan tables

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Shared tables.
- [ ] Failure scenario handled: Cross-module foreign keys.
- [ ] Failure scenario handled: Migration ordering issues.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
