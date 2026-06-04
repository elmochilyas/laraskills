# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.10 Query builder methods (select, where, join, groupBy, having, orderBy, limit, offset)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Explicit select() applied
- [ ] where with array applied
- [ ] Raw expressions applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Default SELECT ***: Transfers all columns including large text fields. Specify only needed columns. prevented
- [ ] LIMIT without ORDER BY**: Result order is unpredictable. Always specify ORDER BY for paginated queries. prevented
- [ ] GROUP BY without aggregate**: MySQL ONLY_FULL_GROUP_BY mode rejects non-aggregated, non-grouped columns in SELECT. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Queries use explicit columns instead of SELECT *
- [ ] Paginated queries have ORDER BY
- [ ] JOIN columns are indexed for performance

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Explicit select() applied
- [ ] where with array applied
- [ ] Raw expressions applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Start with `DB::table('users')` to target the table completed
- [ ] Explicitly specify columns: `->select('id', 'name', 'email')` — never default `SELECT *` completed
- [ ] Add conditions: `->where('status', 'active')->where('plan', 'premium')` completed
- [ ] Add joins: `->join('orders', 'users.id', '=', 'orders.user_id')` completed
- [ ] Add grouping and having: `->groupBy('plan')->having('count', '>', 5)` completed

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

- [ ] Default SELECT ***: Transfers all columns including large text fields. Specify only needed columns. prevented
- [ ] LIMIT without ORDER BY**: Result order is unpredictable. Always specify ORDER BY for paginated queries. prevented
- [ ] GROUP BY without aggregate**: MySQL ONLY_FULL_GROUP_BY mode rejects non-aggregated, non-grouped columns in SELECT. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Explicit select() specifies columns instead of SELECT *
- [ ] LIMIT has a corresponding ORDER BY for predictable results
- [ ] GROUP BY columns appear in SELECT if not aggregated
- [ ] JOIN columns are indexed
- [ ] Query uses parameter binding for user-influenced values
- [ ] Queries use explicit columns instead of SELECT *
- [ ] Paginated queries have ORDER BY
- [ ] JOIN columns are indexed for performance
- [ ] GROUP BY queries satisfy ONLY_FULL_GROUP_BY mode
- [ ] User input is parameterized to prevent SQL injection

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
- [ ] ### Default SELECT * prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Default SELECT ***: Transfers all columns including large text fields. Specify only needed columns. prevented
- [ ] LIMIT without ORDER BY**: Result order is unpredictable. Always specify ORDER BY for paginated queries. prevented
- [ ] GROUP BY without aggregate**: MySQL ONLY_FULL_GROUP_BY mode rejects non-aggregated, non-grouped columns in SELECT. prevented

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
