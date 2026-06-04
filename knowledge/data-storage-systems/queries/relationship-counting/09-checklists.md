# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.7 Relationship counting (withCount, withMin, withMax, withSum, withAvg, withExists)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always use withCount instead of loading relationships for counts applied
- [ ] Use withSum for aggregation applied
- [ ] Filtered aggregates for dashboards applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Loading full relationship just for count**: `$post->comments` loads all Comment models, then `->count()` on the collection. Wastes memory on large comment sets. prevented
- [ ] Not constraining aggregates**: `withCount('comments')` counts ALL comments. If the endpoint only needs approved comments, use the closure form. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Related record counts are retrieved with withCount()
- [ ] Constrained counts filter related records correctly
- [ ] Sorting by count works as expected

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always use withCount instead of loading relationships for counts applied
- [ ] Use withSum for aggregation applied
- [ ] Filtered aggregates for dashboards applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Add `withCount('relationship')` to the query: `Post::withCount('comments')->get()` completed
- [ ] Access the count via `$post->comments_count` attribute completed
- [ ] For constrained counts: `Post::withCount(['comments' => fn($q) => $q->where('approved', true)])->get()` completed
- [ ] For multiple counts: `Post::withCount(['comments', 'likes'])->get()` completed
- [ ] For sorting by count: `Post::withCount('comments')->orderBy('comments_count', 'desc')->get()` completed

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

- [ ] Loading full relationship just for count**: `$post->comments` loads all Comment models, then `->count()` on the collection. Wastes memory on large comment sets. prevented
- [ ] Not constraining aggregates**: `withCount('comments')` counts ALL comments. If the endpoint only needs approved comments, use the closure form. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Count attribute accessed as `{relation}_count`
- [ ] Constrained counts filter correctly
- [ ] Sorting by count uses the generated attribute
- [ ] No N+1 count queries occur
- [ ] Related record counts are retrieved with withCount()
- [ ] Constrained counts filter related records correctly
- [ ] Sorting by count works as expected
- [ ] No N+1 count queries in application code

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
- [ ] ### Loading full relationship just for the count prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Loading full relationship just for count**: `$post->comments` loads all Comment models, then `->count()` on the collection. Wastes memory on large comment sets. prevented
- [ ] Not constraining aggregates**: `withCount('comments')` counts ALL comments. If the endpoint only needs approved comments, use the closure form. prevented

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
