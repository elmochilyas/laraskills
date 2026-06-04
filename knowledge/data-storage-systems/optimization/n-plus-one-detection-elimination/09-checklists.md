# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.13 N+1 detection and elimination strategies
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Enable preventLazyLoading applied
- [ ] Query count middleware applied
- [ ] Test assertions applied
- [ ] Use withCount for aggregates applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] N+1 in API resources/accessors**: A resource accesses `$this->author->name` without eager loading. The N+1 is invisible from the controller. prevented
- [ ] Blind eager loading**: `Post::with('comments', 'tags', 'author')` everywhere, even when the view only needs the author. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] N+1 queries identified and eliminated
- [ ] Query count per request within acceptable threshold
- [ ] `preventLazyLoading` active in development/CI

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Enable preventLazyLoading applied
- [ ] Query count middleware applied
- [ ] Test assertions applied
- [ ] Use withCount for aggregates applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Enable `Model::preventLazyLoading()` in AppServiceProvider completed
- [ ] Run the request and watch for lazy loading exceptions completed
- [ ] Identify the relationship causing N+1 completed
- [ ] Add eager loading: `Model::with('relationship')` or `$model->load('relationship')` completed
- [ ] For hidden N+1s in API resources/accessors: eager load at the query level completed

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

- [ ] N+1 in API resources/accessors**: A resource accesses `$this->author->name` without eager loading. The N+1 is invisible from the controller. prevented
- [ ] Blind eager loading**: `Post::with('comments', 'tags', 'author')` everywhere, even when the view only needs the author. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] No relationship access inside loops without prior eager loading
- [ ] API resources and accessors don't trigger lazy loads
- [ ] Query count per request is proportional to endpoint complexity
- [ ] N+1 queries identified and eliminated
- [ ] Query count per request within acceptable threshold
- [ ] `preventLazyLoading` active in development/CI

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
- [ ] N+1 in API resources/accessors**: A resource accesses `$this->author->name` without eager loading. The N+1 is invisible from the controller. prevented
- [ ] Blind eager loading**: `Post::with('comments', 'tags', 'author')` everywhere, even when the view only needs the author. prevented

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
