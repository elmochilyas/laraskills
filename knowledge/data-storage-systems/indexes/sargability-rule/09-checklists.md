# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.28 Sargability rule: functions on indexed columns break index usage
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replace WHERE DATE(col) = ? with range applied
- [ ] Replace LOWER(col) with case-insensitive collation applied
- [ ] Replace YEAR(col) with range applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] whereDate in Laravel**: `Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`. prevented
- [ ] LIKE with leading wildcard**: `LIKE '%search'` — cannot use B-Tree index because the starting character is unknown. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] No function wraps on indexed WHERE columns
- [ ] Date filters use range queries
- [ ] LIKE uses prefix only (no leading wildcard)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replace WHERE DATE(col) = ? with range applied
- [ ] Replace LOWER(col) with case-insensitive collation applied
- [ ] Replace YEAR(col) with range applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify function wraps: `DATE(col)`, `YEAR(col)`, `LOWER(col)`, `CAST(col AS ...)` completed
- [ ] Rewrite range queries: replace `WHERE DATE(created_at) = ?` with `WHERE created_at >= ? AND created_at < ?` completed
- [ ] Use collation for case-insensitive: replace `LOWER(email) = ?` with case-insensitive column collation completed
- [ ] Use functional indexes when rewriting is impossible completed
- [ ] Verify with EXPLAIN — no full table scan for sargable queries completed

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

- [ ] whereDate in Laravel**: `Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`. prevented
- [ ] LIKE with leading wildcard**: `LIKE '%search'` — cannot use B-Tree index because the starting character is unknown. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No function wraps on indexed columns in WHERE conditions
- [ ] LIKE patterns use prefix wildcards only (LIKE 'prefix%'), not leading wildcards
- [ ] Date filters use range queries instead of DATE()/YEAR()/MONTH()
- [ ] EXPLAIN confirms index usage for rewritten queries
- [ ] No function wraps on indexed WHERE columns
- [ ] Date filters use range queries
- [ ] LIKE uses prefix only (no leading wildcard)
- [ ] EXPLAIN confirms index usage without full table scan

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
- [ ] ### whereDate in Laravel prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] whereDate in Laravel**: `Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`. prevented
- [ ] LIKE with leading wildcard**: `LIKE '%search'` — cannot use B-Tree index because the starting character is unknown. prevented

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
