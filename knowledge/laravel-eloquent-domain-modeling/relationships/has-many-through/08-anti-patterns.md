# Anti-Patterns: HasManyThrough

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasManyThrough

## Anti-Patterns

### Wrong Argument Order
Passing the intermediate model as the first argument and the target as the second in `HasManyThrough`. The method signature is `hasManyThrough(Target, Intermediate, ...)` — target first, intermediate second.

**Problem:** Incorrect joins, wrong query results, silent data corruption.

**Solution:** Always pass the target model first, intermediate second: `$this->hasManyThrough(Post::class, User::class)`.

### Assuming Write Support
Calling `create()` or `save()` on a `HasManyThrough` relationship. Through relationships are read-only — attempting writes throws a `BadMethodCallException`.

**Problem:** Runtime exceptions, developer confusion.

**Solution:** Create target records through the specific intermediate instance: `$user->posts()->create($data)`.

### Hiding Meaningful Intermediates
Using `HasManyThrough` when the intermediate models themselves carry meaningful data needed in the result. The hierarchy is flattened — only the target collection is returned.

**Problem:** Lost domain data, multiple workaround queries, incomplete results.

**Solution:** Use nested eager loading `load('intermediate.targets')` when intermediate data is required.

### Missing Cascade on Foreign Keys
Creating the intermediate and target foreign keys without `ON DELETE CASCADE`. Deleting a parent or intermediate orphans the chain, leaving target records pointing to deleted intermediates.

**Problem:** Orphaned records, integrity violations, data bloat.

**Solution:** Add `->cascadeOnDelete()` on both `intermediate.parent_id` and `target.intermediate_id`.

### Missing Index on Both FKs
Creating the intermediate and target foreign keys without indexes. The join query traverses both FKs — without indexes, it performs full table scans.

**Problem:** Slow join queries, query timeout on large datasets.

**Solution:** Add `->index()` on both `intermediate.parent_id` and `target.intermediate_id`.

### HasManyThrough for HasOne Chain
Using `HasManyThrough` when the intermediate-to-target relationship is `HasOne` instead of `HasMany`. This produces incorrect SQL because the framework assumes multiple results.

**Problem:** Incorrect SQL, wrong results, query failures.

**Solution:** Use `HasOneThrough` when the intermediate-to-target relationship is `HasOne`.

### Over-Nesting
Using 3+ hop `HasManyThrough` chains that create complex, unoptimizable join SQL. Each hop adds a JOIN, making queries hard to debug and maintain.

**Problem:** Slow multi-join queries, difficulty optimizing with EXPLAIN, maintenance complexity.

**Solution:** Limit through chains to 2 hops. For deeper hierarchies, consider restructuring or multiple queries.
