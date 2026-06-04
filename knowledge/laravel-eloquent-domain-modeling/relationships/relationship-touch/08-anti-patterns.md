# Anti-Patterns: Relationship Touch

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** relationship-touch

## Anti-Patterns

### Deep Touch Chains
Defining `$touches` across multiple levels of a hierarchy (Comment → Post → Category → User). Each child save triggers multiple UPDATE queries up the chain — 3 extra queries per Comment save.

**Problem:** N+1 UPDATE queries on every child save; query cascades that multiply with chain depth.

**Solution:** Keep `$touches` chains shallow (1–2 levels max). Consider asynchronous cache invalidation for deeper chains.

### Touch on Write-Heavy Relations
Using `$touches` on relationships with high write frequency. 1,000 child saves = 1,000 extra parent UPDATEs, plus 1,000 SELECTs to lazy-load the parent for each touch.

**Problem:** Massive query amplification — each child save generates 2 extra queries (SELECT + UPDATE) on the parent table.

**Solution:** Use `Model::withoutTouching()` around batch writes, or replace synchronous touches with scheduled cache invalidation.

### withoutTouching() Forgotten in Batch Ops
Running seeders, factories, or bulk imports without `Model::withoutTouching()`. Each created model triggers touch propagation, multiplying query count by thousands.

**Problem:** Thousands of unnecessary UPDATE queries during batch operations; extremely slow seeders and imports.

**Solution:** Wrap batch operations in `Model::withoutTouching(function () { ... })`.

### Circular Touches
Model A touches Model B, and Model B touches Model A. Saving either model triggers an infinite loop that continues until query timeout.

**Problem:** Infinite loop of UPDATE queries; request timeout; database connection exhaustion.

**Solution:** Audit `$touches` declarations to ensure no circular dependencies exist.

### Touches on HasMany or BelongsToMany
Listing a relationship in `$touches` that returns a collection. Touch only works on singular relationships (BelongsTo, HasOne).

**Problem:** Collection relationships in `$touches` silently have no effect — parent timestamps never update.

**Solution:** Only use `$touches` on singular relationships. For BelongsToMany pivot timestamps, use `->withTimestamps()`.

### Assuming Touch Fires Without updated_at
Using `$touches` or `touch()` on a parent model that doesn't have an `updated_at` column. The touch operation has no effect without the timestamp column.

**Problem:** Touch silently does nothing; parent timestamp never updates.

**Solution:** Ensure the parent model's table has an `updated_at` column (or add it via migration).
