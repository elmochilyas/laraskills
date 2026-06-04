# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.11 Where clause types (where, orWhere, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replace whereDate with range applied
- [ ] Use whereIn for multiple values applied
- [ ] Use whereNull for optional filters applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead. prevented
- [ ] orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] All date filters on indexed columns use range queries
- [ ] OR conditions are properly grouped
- [ ] whereIn replaces multiple orWhere for same-column filters

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Replace whereDate with range applied
- [ ] Use whereIn for multiple values applied
- [ ] Use whereNull for optional filters applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Start with `where('col', 'val')` for simple equality — sargable, uses index completed
- [ ] Use `whereIn('col', [1,2,3])` for multiple equality values — sargable completed
- [ ] Use `whereBetween('col', [$a, $b])` for range conditions — sargable completed
- [ ] Use `whereNull('col')` for IS NULL checks — uses B-Tree index completed
- [ ] Replace `whereDate('col', $date)` with `whereBetween('col', [$date->startOfDay(), $date->endOfDay()])` — maintains sargability completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead. prevented
- [ ] orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] whereDate calls replaced with range queries for indexed columns
- [ ] OR conditions grouped with closures to prevent composite index breakage
- [ ] whereIn used instead of multiple orWhere calls for same column
- [ ] All date filters on indexed columns use range queries
- [ ] OR conditions are properly grouped
- [ ] whereIn replaces multiple orWhere for same-column filters
- [ ] EXPLAIN shows index usage on filtered columns

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### whereDate on indexed columns prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] whereDate on indexed column**: Creates a full table scan on a large table. Use range query instead. prevented
- [ ] orWhere without grouping**: `where('a', 1)->orWhere('b', 2)` — the OR may not use the composite index on (a, b). Group with a closure. prevented

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
