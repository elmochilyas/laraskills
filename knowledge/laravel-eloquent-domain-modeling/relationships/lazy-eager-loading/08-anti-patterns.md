# Anti-Patterns: Lazy Eager Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Lazy Eager Loading

## Anti-Patterns

### load() in a Loop
Calling `$model->load('relation')` inside a `foreach` loop. Each iteration triggers a separate database query, recreating the N+1 problem despite using `load()`.

**Problem:** N+1 recreated with `load()` — same query count as lazy loading, just using different syntax.

**Solution:** Call `load()` on the collection instead: `$users->load('posts')` executes one query for all models.

### Using load() When with() Would Suffice
Calling `load()` for relationships known at query definition time. `with()` is more efficient because it combines the relationship query with the parent query in a single round trip.

**Problem:** Extra round trip vs combining queries; unnecessary latency.

**Solution:** Use `with()` for relationships known at query time; reserve `load()` for post-retrieval discovery.

### Redundant Loads
Calling `load('relation')` on a model or collection that already has the relationship loaded. Each redundant call executes an unnecessary SQL query.

**Problem:** Unnecessary SQL queries for already-loaded relationships.

**Solution:** Use `loadMissing()` to load only relationships not already present.

### Serialization Before Load
Serializing a model (e.g., returning from API resource) before calling `load()`. The serialized response is generated before the relationship is available.

**Problem:** Missing relationship data in serialized output; inconsistent API responses.

**Solution:** Call `load()` or `loadMissing()` before serialization.

### Memory Explosion
Calling `load()` on a 10,000-model collection with large relationships. `load()` hydrates all related models into memory — for a collection of 10,000 parents each with 100 children, that's 1M models.

**Problem:** Memory exhaustion from hydrating millions of related models at once.

**Solution:** Use chunked loading for large collections, or constrain the relationship with `select()` and `limitBy()`.

### Deferred Loading at Wrong Time
Calling `load()` too early in the request lifecycle, before knowing if the relationship will be consumed. The relationship is loaded unnecessarily.

**Problem:** Wasted queries and memory for relationships that are not actually used.

**Solution:** Defer `load()` to the point just before consumption, or use conditional loading.
