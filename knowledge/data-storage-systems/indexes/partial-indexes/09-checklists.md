# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.11 Partial indexes (WHERE clause on index, PostgreSQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Filtered status queries applied
- [ ] Soft delete optimization applied
- [ ] Queue processing applied
- [ ] Archived data exclusion applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Query predicate doesn't match index predicate**: Index `WHERE status = 'active'` but query `WHERE status = 'active' AND plan = 'premium'`. PostgreSQL recognizes this as matching (the index predicate is implied by the query). However, `WHERE status IN ('active', 'pending')` does NOT match. prevented
- [ ] Partial index on volatile columns**: Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Partial index correctly matches the target query subset
- [ ] Significant size reduction vs full index
- [ ] EXPLAIN confirms partial index usage

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Filtered status queries applied
- [ ] Soft delete optimization applied
- [ ] Queue processing applied
- [ ] Archived data exclusion applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify the query pattern that filters by a specific condition completed
- [ ] Confirm the condition is stable (doesn't change rapidly) completed
- [ ] Create partial index: `DB::statement('CREATE INDEX ON orders (tenant_id, created_at) WHERE status = 'pending'')` completed
- [ ] Ensure queries match or imply the index predicate completed
- [ ] Verify with EXPLAIN completed

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

- [ ] Query predicate doesn't match index predicate**: Index `WHERE status = 'active'` but query `WHERE status = 'active' AND plan = 'premium'`. PostgreSQL recognizes this as matching (the index predicate is implied by the query). However, `WHERE status IN ('active', 'pending')` does NOT match. prevented
- [ ] Partial index on volatile columns**: Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Index predicate matches the query's WHERE clause (or is implied by it)
- [ ] Filter condition is stable (not volatile)
- [ ] Partial index significantly smaller than full index (20-50% of rows)
- [ ] MySQL is not the target database
- [ ] Partial index correctly matches the target query subset
- [ ] Significant size reduction vs full index
- [ ] EXPLAIN confirms partial index usage
- [ ] Filter condition is stable (not rapidly changing)

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
- [ ] ### Query predicate doesn't match index predicate prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Query predicate doesn't match index predicate**: Index `WHERE status = 'active'` but query `WHERE status = 'active' AND plan = 'premium'`. PostgreSQL recognizes this as matching (the index predicate is implied by the query). However, `WHERE status IN ('active', 'pending')` does NOT match. prevented
- [ ] Partial index on volatile columns**: Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit. prevented

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
