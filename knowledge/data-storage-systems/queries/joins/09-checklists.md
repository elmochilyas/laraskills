# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.13 Joins (inner, left, right, cross, joinSub)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Index join columns applied
- [ ] Reads vs writes separation applied
- [ ] joinSub for complex filtering applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Missing index on join column**: A join on an unindexed column causes a full table scan on the joined table for every row. prevented
- [ ] joinSub without alias**: `joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — forgetting the alias causes ambiguous column errors. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] JOIN queries use indexed FK columns
- [ ] Correct join type selected for the query semantics
- [ ] joinSub properly aliased and performing pre-filtering as intended

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Index join columns applied
- [ ] Reads vs writes separation applied
- [ ] joinSub for complex filtering applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Determine the correct join type: inner for strict matches, left for optional related data completed
- [ ] Ensure the join column (FK) is indexed on the joined table completed
- [ ] Write the join: `->join('orders', 'orders.user_id', '=', 'users.id')` completed
- [ ] For complex filtering, use `joinSub` to pre-filter the joined dataset completed
- [ ] Add table aliases for readability in complex queries completed

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

- [ ] Missing index on join column**: A join on an unindexed column causes a full table scan on the joined table for every row. prevented
- [ ] joinSub without alias**: `joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — forgetting the alias causes ambiguous column errors. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Join columns are indexed on the joined table
- [ ] LEFT JOIN used only when NULLs for non-matching rows are acceptable
- [ ] joinSub includes a table alias to prevent ambiguous column errors
- [ ] INNER JOIN preferred over LEFT JOIN when optional rows are not needed
- [ ] JOIN queries use indexed FK columns
- [ ] Correct join type selected for the query semantics
- [ ] joinSub properly aliased and performing pre-filtering as intended
- [ ] EXPLAIN shows index lookups (not full table scans) on joined tables

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
- [ ] ### Missing index on join column prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Missing index on join column**: A join on an unindexed column causes a full table scan on the joined table for every row. prevented
- [ ] joinSub without alias**: `joinSub($query, 'alias', 'alias.id', '=', 'table.col')` — forgetting the alias causes ambiguous column errors. prevented

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
