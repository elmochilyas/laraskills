# Attribute Caching

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Attribute Caching |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Laravel's `Attribute::make()` supports caching computed values per model instance via the `shouldCache` parameter. When enabled, the accessor's get closure is called only once per model instance; subsequent reads return the cached value. This prevents redundant computation for expensive accessors (string formatting, relationship counting, JSON decoding) while keeping the accessor syntax clean.

## Core Concepts

- **shouldCache**: A boolean parameter on `Attribute::make()` that enables per-instance caching of the accessor's return value
- **Per-instance cache**: The cache is scoped to a single model instance — the same model loaded twice has separate caches
- **Cache invalidation**: The cache is cleared when the model attribute changes (via `setAttribute()`)
- **Transparent to callers**: Callers use `$model->attribute` regardless of caching; the caching is an implementation detail

## When To Use

- The accessor performs expensive computation (string manipulation, formatting, concatenation)
- The accessor is accessed multiple times (in Blade views, serialization, API resources)
- The accessor triggers database queries or API calls (though these should be avoided in accessors)

## When NOT To Use

- The accessor is cheap (simple typecast, null coalesce) — caching adds overhead without benefit
- The accessor should return different values on each access (random values, current time)
- The accessor has side effects (which it shouldn't in any case)

## Best Practices

- **Use shouldCache for any accessor called multiple times**: Blade views often access the same attribute in layout, content, and metadata sections. Caching prevents redundant computation across these calls.
- **Don't cache accessors that depend on mutable state**: If an accessor's value changes based on other attributes being modified after first access, caching will return a stale value. Ensure the accessor's dependencies are immutable during the model's lifetime.
- **Profile before caching**: Measure whether the accessor is actually a bottleneck before adding `shouldCache`. Premature caching adds complexity without measurable benefit.

## Architecture Guidelines

- `Attribute::make(get: fn ($value) => ..., shouldCache: true)` for cached accessors
- Cache is per instance — not shared across requests or between different loaded instances of the same model
- Legacy `get{Attribute}Attribute()` methods cannot use this caching mechanism

## Performance Considerations

- `shouldCache` eliminates redundant computation for frequently accessed computed attributes
- The cached value lives in memory for the model instance's lifetime — GC cleans up when the model is dereferenced
- For very large computed values, consider whether caching in memory is appropriate or if lazy loading from DB is better

## Examples

```php
class Order extends Model
{
    protected function summaryLine(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => sprintf(
                '%s x%d — %s',
                $this->product_name,
                $this->quantity,
                number_format($this->total_cents / 100, 2)
            ),
            shouldCache: true,
        );
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Accessor Patterns |
| Closely Related | Append Attributes |
| Closely Related | Computed Property Accessor |
| Advanced | Custom Casts |

## AI Agent Notes

- Add `shouldCache: true` to accessors that are accessed multiple times
- Cache is per-instance; don't use for values that change between reads
- Legacy accessors cannot use `shouldCache` — migrate to `Attribute::make()`

## Verification

- [ ] `shouldCache` is used for expensive or frequently-accessed accessors
- [ ] Cached accessor does not depend on mutable state that changes between reads
- [ ] Legacy accessors are migrated to `Attribute::make()` to enable caching
