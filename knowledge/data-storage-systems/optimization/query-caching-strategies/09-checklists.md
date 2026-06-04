# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.29 Query caching strategies (remember, tagged cache, materialized views)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tagged cache for model-based invalidation applied
- [ ] Stale-while-revalidate pattern applied
- [ ] Query result caching vs fragment caching applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Caching Eloquent models with relationships**: `Cache::remember('post', 3600, fn() => Post::with('comments')->first())` — when retrieved from cache, relationships are already loaded. If you later call `$post->comments()->where(...)`, you'll query the DB again because the relationship is already in memory. Cache the result, not the query. prevented
- [ ] Caching paginated results incorrectly**: Caching a paginator instance serializes the entire dataset, destroying pagination. Cache only the item collection and pass it to a manually constructed paginator. prevented
- [ ] No cache invalidation strategy**: Setting long TTLs without model event-based invalidation leads to stale data displayed for hours. Always pair TTL with explicit invalidation for mutable data. prevented
- [ ] ```php prevented
- [ ] // Wrong: no invalidation — stale until TTL expires prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Cache hit ratio above 80% for cached queries
- [ ] Response time significantly reduced for cached endpoints
- [ ] Proper invalidation prevents stale data

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Tagged cache for model-based invalidation applied
- [ ] Stale-while-revalidate pattern applied
- [ ] Query result caching vs fragment caching applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Identify read-heavy, write-light queries completed
- [ ] Measure current execution time and frequency completed
- [ ] Choose cache strategy: completed
- [ ] Implement invalidation on data changes (model events for tagged cache) completed
- [ ] Verify cache hit ratio and response time improvement completed

---

# Performance Checklist

- [ ] Performance: - Measure cache hit ratio. A ratio below 80% indicates either too-short TTLs or an access pattern not suited to caching.
- [ ] Performance: - Large cached collections consume memory. 10,000 Eloquent models at ~2KB each = ~20MB per cache key. Consider caching paginated or limited subsets...
- [ ] Performance: - Materialized view refresh time grows with data volume. A 10M-row aggregation might take 30 seconds to refresh. Use `CONCURRENTLY` to avoid blocki...
- [ ] Performance: - Serialization cost: Eloquent models are expensive to serialize/deserialize. Cache arrays or DTOs instead of full model instances for better perfo...
- [ ] Performance: // Faster: cache arrays instead of models

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Caching Eloquent models with relationships**: `Cache::remember('post', 3600, fn() => Post::with('comments')->first())` — when retrieved from cache, relationships are already loaded. If you later call `$post->comments()->where(...)`, you'll query the DB again because the relationship is already in memory. Cache the result, not the query. prevented
- [ ] Caching paginated results incorrectly**: Caching a paginator instance serializes the entire dataset, destroying pagination. Cache only the item collection and pass it to a manually constructed paginator. prevented
- [ ] No cache invalidation strategy**: Setting long TTLs without model event-based invalidation leads to stale data displayed for hours. Always pair TTL with explicit invalidation for mutable data. prevented
- [ ] ```php prevented
- [ ] // Wrong: no invalidation — stale until TTL expires prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cache strategy matches access pattern (TTL vs tags vs materialized view)
- [ ] Cache invalidation on data mutation (model events or manual flush)
- [ ] Cache hit ratio >80% for cached queries
- [ ] No cache stampede risk mitigated
- [ ] Arrays/DTOs cached instead of Eloquent models (better serialization)
- [ ] Cache hit ratio above 80% for cached queries
- [ ] Response time significantly reduced for cached endpoints
- [ ] Proper invalidation prevents stale data
- [ ] No cache stampede incidents

---

# Maintainability Checklist

- [ ] Stale-while-revalidate pattern applied
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
- [ ] Caching Eloquent models with relationships**: `Cache::remember('post', 3600, fn() => Post::with('comments')->first())` — when retrieved from cache, relationships are already loaded. If you later call `$post->comments()->where(...)`, you'll query the DB again because the relationship is already in memory. Cache the result, not the query. prevented
- [ ] Caching paginated results incorrectly**: Caching a paginator instance serializes the entire dataset, destroying pagination. Cache only the item collection and pass it to a manually constructed paginator. prevented
- [ ] No cache invalidation strategy**: Setting long TTLs without model event-based invalidation leads to stale data displayed for hours. Always pair TTL with explicit invalidation for mutable data. prevented
- [ ] ```php prevented
- [ ] // Wrong: no invalidation — stale until TTL expires prevented
- [ ] $posts = Cache::remember('posts', 3600, fn() => Post::all()); prevented
- [ ] // Right: invalidate on mutation prevented
- [ ] $posts = Cache::tags(['posts'])->remember('posts.all', 3600, fn() => Post::all()); prevented
- [ ] // In Post model boot: prevented
- [ ] static::saved(fn() => Cache::tags(['posts'])->flush()); prevented

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
