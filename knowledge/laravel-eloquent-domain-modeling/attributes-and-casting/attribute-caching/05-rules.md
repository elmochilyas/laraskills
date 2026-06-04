## Use shouldCache for Expensive or Frequently-Accessed Accessors
---
## Category
Performance
---
## Rule
Enable `shouldCache: true` on `Attribute::make()` when the accessor performs expensive computation, database queries, complex string formatting, or is accessed multiple times per request cycle.
---
## Reason
Accessors execute on every attribute read. Without caching, the same computation runs repeatedly in Blade views, API serialization, and validation pipelines, causing redundant CPU and database overhead.
---
## Bad Example
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => implode(', ', $this->relatedItems()->pluck('name')->toArray())
    );
}
```
---
## Good Example
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => implode(', ', $this->relatedItems()->pluck('name')->toArray()),
        shouldCache: true
    );
}
```
---
## Exceptions
Do not use `shouldCache` when the accessor should return different values on each read (random values, current timestamp) or when the value depends on mutable model state that changes between accesses.
---
## Consequences Of Violation
N+1 query patterns within a single request, excessive CPU usage from repeated formatting, slower response times, unnecessary database load.

---
## Do Not Cache Accessors Dependent on Mutable State
---
## Category
Reliability
---
## Rule
Do not enable `shouldCache` on accessors whose return value depends on non-attribute model state (relationships that may be lazy-loaded later, transient instance properties, or external state).
---
## Reason
The `shouldCache` cache is set on first access and never invalidated except when the underlying model attribute changes. If the accessor's dependencies change after first read, subsequent reads return stale values.
---
## Bad Example
```php
protected function relatedCount(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $this->relationLoaded('items') ? $this->items->count() : 0,
        shouldCache: true
    );
}
```
---
## Good Example
```php
protected function relatedCount(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $this->items()->count(),
        shouldCache: true
    );
}
```
---
## Exceptions
No common exceptions. If state mutates, use explicit methods instead of cached accessors.
---
## Consequences Of Violation
Stale data served across reads within a single request, subtle bugs that are hard to reproduce, incorrect computed values that change based on access order.

---
## Profile Before Adding shouldCache
---
## Category
Performance
---
## Rule
Measure the actual performance impact of an accessor before adding `shouldCache`. Do not add caching speculatively to accessors that perform trivial operations.
---
## Reason
`shouldCache` adds cache-lookup overhead, memory pressure from stored values, and prevents recomputation that might be desirable. For cheap accessors (simple typecasts, null coalesce), caching is slower than recomputing.
---
## Bad Example
```php
// Profiling not done; caching a trivial operation
protected function isActive(): Attribute
{
    return Attribute::make(
        get: fn ($value) => (bool) $value,
        shouldCache: true
    );
}
```
---
## Good Example
```php
// Simple cast — no caching needed
protected function isActive(): Attribute
{
    return Attribute::make(get: fn ($value) => (bool) $value);
}
```
---
## Exceptions
When the accessor is called thousands of times in loops or collections, caching even cheap operations may improve throughput — measure first, optimize second.
---
## Consequences Of Violation
Unnecessary memory usage for cached trivial values, premature optimization adding complexity without measurable benefit, harder to reason about cache invalidation.

---
## Migrate Legacy Accessors to Enable Caching
---
## Category
Maintainability
---
## Rule
Refactor legacy `get{Attribute}Attribute()` methods to `Attribute::make(get: ..., shouldCache: true)` when the accessor benefits from caching. Legacy accessor methods cannot use `shouldCache`.
---
## Reason
Legacy accessors lack the `shouldCache` parameter entirely. Keeping legacy syntax prevents adopting per-instance caching, forcing expensive recomputation on every read of that attribute.
---
## Bad Example
```php
public function getTotalLabelAttribute($value)
{
    return '$' . number_format($this->total_cents / 100, 2);
}
```
---
## Good Example
```php
protected function totalLabel(): Attribute
{
    return Attribute::make(
        get: fn ($value) => '$' . number_format($this->total_cents / 100, 2),
        shouldCache: true
    );
}
```
---
## Exceptions
During active development sprints where refactoring legacy code is out of scope; schedule migration as a dedicated technical debt task.
---
## Consequences Of Violation
Inability to use per-instance caching, inconsistent accessor patterns across the codebase, deprecated API usage, performance left on the table.

---
## Do Not Use shouldCache for Non-Deterministic Accessors
---
## Category
Reliability
---
## Rule
Never enable `shouldCache` on accessors that return non-deterministic values such as random numbers, current timestamps, or values based on external state that changes between reads.
---
## Reason
Caching a non-deterministic value returns the same result for all subsequent reads within the model instance's lifetime. This breaks expectations for accessors like `randomizedLabel()` or `currentTimeInZone()`.
---
## Bad Example
```php
protected function randomDiscount(): Attribute
{
    return Attribute::make(
        get: fn ($value) => rand(5, 20),
        shouldCache: true
    );
}
```
---
## Good Example
```php
// Use a regular method for non-deterministic values
public function getRandomDiscount(): int
{
    return rand(5, 20);
}
```
---
## Exceptions
No common exceptions. Non-deterministic accessors should never be cached.
---
## Consequences Of Violation
Identical "random" values returned on every access within a request, misleading behavior that violates the principle of least surprise, debugging confusion.
