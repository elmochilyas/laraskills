# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.5 Constrained eager loading (with + where constraints on relationship)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Top N per parent applied
- [ ] Filtered counts applied
- [ ] Conditional constraints applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Forgetting to constrain list endpoints**: Loading 500 comments per post when only 3 are displayed. Massively over-fetches data. prevented
- [ ] Complex constraints causing slow queries**: Constraint uses `orWhere` or function wrapping that breaks index usage. The eager load query becomes slow. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Related data is filtered at query time, not in application code
- [ ] `limit()` and `orderBy()` work correctly within constrained loads
- [ ] Nested constrained relationships produce correct results

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Top N per parent applied
- [ ] Filtered counts applied
- [ ] Conditional constraints applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Start with the base query: `User::with(['posts' => function ($query) { ... }])->get()` completed
- [ ] Add WHERE constraints inside the closure: `$query->where('published', true)` completed
- [ ] Add ORDER BY: `$query->orderBy('created_at', 'desc')` completed
- [ ] Add LIMIT: `$query->limit(5)` — limits per parent completed
- [ ] For conditional constraints, use if/else inside the closure or pass parameters completed

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

- [ ] Forgetting to constrain list endpoints**: Loading 500 comments per post when only 3 are displayed. Massively over-fetches data. prevented
- [ ] Complex constraints causing slow queries**: Constraint uses `orWhere` or function wrapping that breaks index usage. The eager load query becomes slow. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Constraint closure filters the related data correctly
- [ ] `limit()` per parent works as expected
- [ ] Nested constrained loads don't cause unexpected empty results
- [ ] Constraints don't accidentally become global scopes
- [ ] Related data is filtered at query time, not in application code
- [ ] `limit()` and `orderBy()` work correctly within constrained loads
- [ ] Nested constrained relationships produce correct results
- [ ] Lazy load + filter pattern is not used where constrained with() suffices

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
- [ ] ### Assuming constraints apply globally prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Forgetting to constrain list endpoints**: Loading 500 comments per post when only 3 are displayed. Massively over-fetches data. prevented
- [ ] Complex constraints causing slow queries**: Constraint uses `orWhere` or function wrapping that breaks index usage. The eager load query becomes slow. prevented

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
