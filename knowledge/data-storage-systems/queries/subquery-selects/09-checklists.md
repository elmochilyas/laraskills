# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.8 Subquery selects (addSelect with subquery)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Last related record applied
- [ ] Computed flags applied
- [ ] Aggregate per parent applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Subquery returns multiple rows**: The subquery must return a scalar (one row, one column). If multiple rows match, the database errors. prevented
- [ ] Not limiting the subquery**: `LoginLog::select('created_at')->whereColumn(...)->orderByDesc('created_at')` without `->limit(1)` may return multiple rows. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Subquery selects return correct derived values
- [ ] Correlated subqueries reference the outer table properly
- [ ] Non-aggregate subqueries limit to 1 row

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Last related record applied
- [ ] Computed flags applied
- [ ] Aggregate per parent applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Build the subquery: `Post::select('title')->whereColumn('user_id', 'users.id')->latest()->limit(1)` completed
- [ ] Add it via addSelect: `User::addSelect(['latest_post_title' => $subquery])->get()` completed
- [ ] Access: `$user->latest_post_title` completed
- [ ] For complex subqueries, use `whereRaw` or `orderBy` with the subquery column completed
- [ ] For conditional subqueries, use when() on the query builder completed

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

- [ ] Subquery returns multiple rows**: The subquery must return a scalar (one row, one column). If multiple rows match, the database errors. prevented
- [ ] Not limiting the subquery**: `LoginLog::select('created_at')->whereColumn(...)->orderByDesc('created_at')` without `->limit(1)` may return multiple rows. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Subquery returns a scalar value (single row, single column)
- [ ] Column alias is unique and meaningful
- [ ] Subquery is correlated correctly via whereColumn
- [ ] Query executes without errors
- [ ] Result set includes the derived column
- [ ] Subquery selects return correct derived values
- [ ] Correlated subqueries reference the outer table properly
- [ ] Non-aggregate subqueries limit to 1 row
- [ ] Results include the alias column with correct data

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
- [ ] ### Subquery returns multiple rows prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Subquery returns multiple rows**: The subquery must return a scalar (one row, one column). If multiple rows match, the database errors. prevented
- [ ] Not limiting the subquery**: `LoginLog::select('created_at')->whereColumn(...)->orderByDesc('created_at')` without `->limit(1)` may return multiple rows. prevented

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
