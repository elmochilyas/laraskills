# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.24 Indexing foreign key columns (automatic via constrained)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always use constrained() applied
- [ ] Verify indexes in code review applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Manual FK without index**: The most common FK performance mistake. JOIN queries on the FK column perform full table scans. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] All FK columns are indexed
- [ ] constrained() is the default approach in migrations
- [ ] No redundant FK indexes where composite already covers

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always use constrained() applied
- [ ] Verify indexes in code review applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Use `$table->foreignId('user_id')->constrained()` — this creates FK + index automatically completed
- [ ] If using manual FK: `$table->foreign('user_id')->references('id')->on('users')` — also add `$table->index('user_id')` completed
- [ ] Check if FK column is already covered by a composite index completed
- [ ] Verify with EXPLAIN that JOINs on the FK use an index completed

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

- [ ] Manual FK without index**: The most common FK performance mistake. JOIN queries on the FK column perform full table scans. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] All FK columns have an index (either standalone or as part of a composite)
- [ ] constrained() is preferred over manual foreign() for simplicity
- [ ] No redundant standalone FK index if composite already covers it
- [ ] MySQL InnoDB auto-indexes FKs; PostgreSQL does not
- [ ] All FK columns are indexed
- [ ] constrained() is the default approach in migrations
- [ ] No redundant FK indexes where composite already covers
- [ ] EXPLAIN confirms index usage on FK JOIN columns

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
- [ ] ### Manual FK without index prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Manual FK without index**: The most common FK performance mistake. JOIN queries on the FK column perform full table scans. prevented

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
