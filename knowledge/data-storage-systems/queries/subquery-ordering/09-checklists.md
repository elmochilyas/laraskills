# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.9 Subquery ordering (orderBy with subquery)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Sort by related aggregate applied
- [ ] Sort by latest related applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No index on the subquery**: The subquery `WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1` needs an index on `(user_id, created_at)`. Without it, the outer query is slow. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Query results are correctly sorted by derived values
- [ ] Subquery FK columns are indexed
- [ ] Correlated subqueries reference the outer table correctly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Sort by related aggregate applied
- [ ] Sort by latest related applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Build the subquery returning the sort key: `Post::select('title')->whereColumn('user_id', 'users.id')->latest()->limit(1)` completed
- [ ] Apply orderBy: `User::orderByDesc($subquery)->get()` completed
- [ ] For aggregate sorts: `User::orderByDesc(Comment::selectRaw('COUNT(*)')->whereColumn('user_id', 'users.id'))->get()` completed
- [ ] Verify index usage with EXPLAIN completed
- [ ] Limit the result set to avoid performance issues with large datasets completed

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

- [ ] No index on the subquery**: The subquery `WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1` needs an index on `(user_id, created_at)`. Without it, the outer query is slow. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Subquery in ORDER BY returns a scalar value
- [ ] Subquery is properly correlated with whereColumn
- [ ] Index exists on the subquery's WHERE column
- [ ] Sort direction is correct
- [ ] Performance is acceptable for expected result set size
- [ ] Query results are correctly sorted by derived values
- [ ] Subquery FK columns are indexed
- [ ] Correlated subqueries reference the outer table correctly
- [ ] Performance is acceptable for production workloads

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
- [ ] ### Missing index on subquery column prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No index on the subquery**: The subquery `WHERE user_id = users.id ORDER BY created_at DESC LIMIT 1` needs an index on `(user_id, created_at)`. Without it, the outer query is slow. prevented

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
