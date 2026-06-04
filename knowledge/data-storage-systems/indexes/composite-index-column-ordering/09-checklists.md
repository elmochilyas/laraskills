# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.9 Composite index best practices: equality columns first, range columns after
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Standard pattern applied
- [ ] IN as equality applied
- [ ] Covering sort applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Range column in leading position**: Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup — it scans the entire date range and then filters by status. prevented
- [ ] ORDER BY column not in index**: Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort). prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Equality columns correctly positioned before range/sort columns
- [ ] ORDER BY satisfied by index order (no filesort)
- [ ] EXPLAIN confirms efficient index usage

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Standard pattern applied
- [ ] IN as equality applied
- [ ] Covering sort applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify equality columns: those used with `=`, `IS`, `IN` (IN is treated as multiple equalities) completed
- [ ] Identify range columns: those used with `>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'prefix%'` completed
- [ ] Identify sort columns: those in ORDER BY completed
- [ ] Create index: equality columns → range columns → sort column completed
- [ ] Verify with EXPLAIN: check for "Using index" without "Using filesort" completed

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

- [ ] Range column in leading position**: Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup — it scans the entire date range and then filters by status. prevented
- [ ] ORDER BY column not in index**: Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort). prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Equality columns precede range columns in the index
- [ ] ORDER BY column is last (after all equality and range columns)
- [ ] Range column doesn't block subsequent columns in WHERE (it does block equality after it)
- [ ] No "Using filesort" in EXPLAIN for sorted queries
- [ ] Equality columns correctly positioned before range/sort columns
- [ ] ORDER BY satisfied by index order (no filesort)
- [ ] EXPLAIN confirms efficient index usage
- [ ] Range column does not block subsequent equality lookups

---

# Maintainability Checklist

- [ ] Standard pattern applied
- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Range column in leading position prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Range column in leading position**: Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup — it scans the entire date range and then filters by status. prevented
- [ ] ORDER BY column not in index**: Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort). prevented

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
