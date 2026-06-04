# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.26 Index alignment with WHERE + JOIN + ORDER BY patterns
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Composite for filter + sort applied
- [ ] Covering index with INCLUDE applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Indexing WHERE without ORDER BY**: The index narrows the search, but the database still sorts the result. Add the sort column to the index. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Index covers WHERE conditions, ORDER BY, and key SELECT columns
- [ ] No filesort in EXPLAIN for aligned queries
- [ ] JOIN columns indexed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Composite for filter + sort applied
- [ ] Covering index with INCLUDE applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Parse the query: identify WHERE columns, JOIN columns, ORDER BY columns, SELECT columns completed
- [ ] Design index to cover: equality conditions → range conditions → sort column completed
- [ ] Add covering columns (INCLUDE) for SELECT columns not in the index key completed
- [ ] Ensure FK columns used in JOINs are indexed completed
- [ ] Verify with EXPLAIN: "Index Only Scan" or "Using index" with no "Using filesort" completed

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

- [ ] Indexing WHERE without ORDER BY**: The index narrows the search, but the database still sorts the result. Add the sort column to the index. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Index covers WHERE + ORDER BY (no filesort)
- [ ] JOIN columns are indexed on the joined table
- [ ] SELECT columns covered by index or INCLUDE where practical
- [ ] EXPLAIN shows no "Using filesort" and no "Using where" for residual filtering
- [ ] Index covers WHERE conditions, ORDER BY, and key SELECT columns
- [ ] No filesort in EXPLAIN for aligned queries
- [ ] JOIN columns indexed
- [ ] Index allows index-only scan where practical

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
- [ ] ### Indexing WHERE without ORDER BY prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Indexing WHERE without ORDER BY**: The index narrows the search, but the database still sorts the result. Add the sort column to the index. prevented

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
