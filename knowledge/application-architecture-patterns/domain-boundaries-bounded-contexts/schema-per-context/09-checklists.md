# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Database schema organization per bounded context
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Shared tables between contexts prevented
- [ ] Cross-context foreign keys prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Prefix all table names with the owning context identifier.** Use `billing_invoices`, `identity_users`, `catalog_products`. This makes context ownership visible at the database level without external documentation.
- [ ] Workflow step completed: **Store migrations in context-specific directories.** Place migrations in `app/Domains/{Context}/Database/Migrations/`. Context service providers auto-load their own migrations.
- [ ] Workflow step completed: **Govern prefix uniqueness.** Maintain a prefix registry ensuring each context uses a unique, non-overlapping prefix. Two contexts cannot use the same prefix.
- [ ] Workflow step completed: **Never create cross-context foreign keys.** Cross-context FKs create database-level coupling. Store cross-context references as plain integers without FK constraints.
- [ ] Workflow step completed: **Enforce context prefix ownership with automated checks.** Use PHPStan rules or custom linters to verify each table prefix maps to its owning context and no cross-context FKs exist.

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

- [ ] Failure addressed: Inconsistent prefixing.
- [ ] Failure addressed: No prefix at all.
- [ ] Failure addressed: Prefix conflicts.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All tables have context prefix
- [ ] Prefix naming convention is documented and enforced
- [ ] No cross-context foreign keys
- [ ] Migrations in context-specific directories
- [ ] No shared tables between contexts
- [ ] Prefix registry governs unique prefixes
- [ ] Automated checks enforce prefix ownership
- [ ] Context service providers register their connections

### Success Criteria
- [ ] All application tables have consistent context prefixes (e.g., `billing_`, `identity_`, `catalog_`).
- [ ] A prefix registry documents and enforces unique prefix assignments.
- [ ] No cross-context foreign key constraints exist in the database.
- [ ] Migrations are stored in context-specific directories and auto-loaded by context service providers.
- [ ] Automated CI checks enforce prefix conventions and prevent cross-context FKs.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Shared tables between contexts
- [ ] Anti-pattern prevented: Cross-context foreign keys

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Inconsistent prefixing.
- [ ] Failure scenario handled: No prefix at all.
- [ ] Failure scenario handled: Prefix conflicts.

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
