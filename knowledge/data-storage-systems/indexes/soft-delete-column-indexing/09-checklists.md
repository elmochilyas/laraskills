# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.27 Soft delete column indexing impact (deleted_at as filter)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Composite with deleted_at applied
- [ ] Partial index for PostgreSQL applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Indexing deleted_at alone**: An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan. prevented
- [ ] Not considering soft delete in index design**: Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] All composite indexes on soft-deletable tables include deleted_at (or use partial index)
- [ ] No standalone deleted_at index
- [ ] EXPLAIN confirms soft-delete filter uses index without residual filtering

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Composite with deleted_at applied
- [ ] Partial index for PostgreSQL applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify all queries affected by the soft-delete global scope completed
- [ ] For composite indexes: add `deleted_at` as the last column completed
- [ ] For PostgreSQL: consider partial index `WHERE deleted_at IS NULL` for optimal performance completed
- [ ] Avoid standalone index on `deleted_at` alone (low selectivity) completed
- [ ] Verify with EXPLAIN that queries using soft-delete filter use the index completed

---

# Performance Checklist

- [ ] Performance: B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index ad...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Indexing deleted_at alone**: An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan. prevented
- [ ] Not considering soft delete in index design**: Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] deleted_at included in composite indexes for soft-deletable tables
- [ ] No standalone index on deleted_at alone
- [ ] PostgreSQL partial index considered for active-only queries
- [ ] Partial index predicate matches the global scope condition
- [ ] All composite indexes on soft-deletable tables include deleted_at (or use partial index)
- [ ] No standalone deleted_at index
- [ ] EXPLAIN confirms soft-delete filter uses index without residual filtering
- [ ] PostgreSQL partial indexes considered for active-only queries

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Indexing deleted_at alone prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Indexing deleted_at alone**: An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan. prevented
- [ ] Not considering soft delete in index design**: Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
