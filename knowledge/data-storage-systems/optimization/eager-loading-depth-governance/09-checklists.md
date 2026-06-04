# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.14 Eager loading depth governance (max nesting, selective loading)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Max 2 levels for list endpoints applied
- [ ] Narrow selects applied
- [ ] Scope-based relationship loading applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Blind `$model->load('allRelations')`**: Loading every relationship defined on the model regardless of what the endpoint needs. prevented
- [ ] N+1 within eager loaded relationships**: `with('comments.likes')` loads both comments and likes in 2 queries. But `$post->comments->each(fn($c) => $c->likers->count())` triggers N+1 on the likes relationship. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Eager loading depth governed per endpoint type
- [ ] Narrow column selection on all relationship loads
- [ ] Query count and data volume appropriate for view type

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Max 2 levels for list endpoints applied
- [ ] Narrow selects applied
- [ ] Scope-based relationship loading applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Review eager loading depth: `with('user.profile.company.address')` completed
- [ ] Limit depth: max 2 levels for list endpoints, deeper for detail completed
- [ ] Narrow selects: `with('comments:id,post_id,body')` completed
- [ ] Create separate scopes: `scopeWithListRelations()` and `scopeWithDetailRelations()` completed
- [ ] Use different API Resource classes per view type completed

---

# Performance Checklist

- [ ] Performance: EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table q...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Blind `$model->load('allRelations')`**: Loading every relationship defined on the model regardless of what the endpoint needs. prevented
- [ ] N+1 within eager loaded relationships**: `with('comments.likes')` loads both comments and likes in 2 queries. But `$post->comments->each(fn($c) => $c->likers->count())` triggers N+1 on the likes relationship. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] List endpoints load max 2 relationship levels
- [ ] Narrow column selection on eager loaded relationships
- [ ] Detail endpoints use separate, more complete loading
- [ ] No blind `$model->load('allRelations')` patterns
- [ ] Eager loading depth governed per endpoint type
- [ ] Narrow column selection on all relationship loads
- [ ] Query count and data volume appropriate for view type

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always EXPLAIN Before Optimizing prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Blind `$model->load('allRelations')`**: Loading every relationship defined on the model regardless of what the endpoint needs. prevented
- [ ] N+1 within eager loaded relationships**: `with('comments.likes')` loads both comments and likes in 2 queries. But `$post->comments->each(fn($c) => $c->likers->count())` triggers N+1 on the likes relationship. prevented

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
