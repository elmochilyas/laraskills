# Attribute Caching

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Attribute caching stores the result of an accessor in the model instance's `$accessors` array after the first access, so subsequent reads bypass the accessor closure and return the cached value directly. Enabled via `shouldCache()` on the `Attribute::make()` definition, this optimization is essential for expensive accessors (string formatting, value object construction, API calls) and for computed attributes accessed multiple times per request. It is a request-scoped memory cache, not a persistent cache.

## Core Concepts
- **shouldCache():** `Attribute::make(get: fn ($v) => heavyOp($v))->shouldCache(true)` — marks the accessor result for caching.
- **withoutObjectCaching():** `Attribute::make(get: ...)->shouldCache(true)->withoutObjectCaching()` — caches the value but clones objects on each access to prevent mutation leaks.
- **Instance-scoped persistence:** The cached value lives only in the model instance's `$accessors` array. Each model instance has its own cache.
- **No automatic invalidation:** Explicitly setting the attribute via `$model->attribute = $value` clears the cached accessor result for that attribute.
- **Cache miss trigger:** The first access to a cached attribute runs the accessor and stores the result. Subsequent accesses return the cached value.

## Mental Models
- **Memoization:** Attribute caching is the classic memoization pattern — compute once, reuse. The `$accessors` array is the memo table.
- **Lazy Initialization with Cache:** The accessor result is lazily computed on first read, then frozen for the lifetime of the model instance.
- **Request-Scoped Singleton:** Each cached accessor value behaves like a request-scoped singleton — there is exactly one instance of the computed value per model instance per request.

## Internal Mechanics
1. `Model::__get($key)` resolves the accessor via `Model::mutateAttribute($key, $value)`.
2. Inside `mutateAttribute`, if the `Attribute` object has `shouldCache = true`, the method checks `$this->$accessors[$key]` for an existing cached value.
3. On cache hit: returns `$this->$accessors[$key]` directly (or a clone if `withoutObjectCaching` is set).
4. On cache miss: calls the get closure, stores the result in `$this->$accessors[$key]`, and returns it.
5. The `$accessors` array is reset when the model is loaded from the database (fresh instance) or when `$model->setAttribute($key, $value)` is called for the cached attribute.
6. `withoutObjectCaching()` wraps the return in `clone` to prevent callers from mutating the shared cached object.

## Patterns
- **Idempotent Expensive Accessor:** `Attribute::make(get: fn ($v) => Json::decode($v))->shouldCache()` — decoding JSON every access is wasteful; cache it after first decode.
- **Immutable Value Object Caching:** `Attribute::make(get: fn ($v) => new Money($v))->shouldCache()->withoutObjectCaching()` — returns a clone each time to prevent callers from modifying the Money instance.
- **Conditional Cache Skip:** There is no built-in skip mechanism, but accessors can set `shouldCache(false)` dynamically by returning a different `Attribute` configuration based on model state.
- **Bulk Invalidation:** `$model->setRawAttributes([...])` resets the `$accessors` array. Use this when hydrating multiple attributes from an external source.

## Architectural Decisions
- **Decision:** Cache lives on the model instance, not globally or on the query level.
  - **Rationale:** Each model instance has potentially different attribute values. Instance-scoped caching ensures isolation between different records and prevents memory leaks across requests.
- **Decision:** Manual opt-in via shouldCache() rather than automatic caching.
  - **Rationale:** Caching adds memory overhead. The developer must explicitly evaluate whether the accessor is expensive enough to warrant caching. Automatic caching would waste memory on cheap accessors.
- **Decision:** withoutObjectCaching() uses clone, not a separate cache entry.
  - **Rationale:** Cloning on each access is cheap for most objects and prevents mutation bugs without complicating the cache storage strategy.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Sub-μs accessor reads after first call | Memory overhead per model instance for cached values | Profile memory in models with many cached attributes |
| Eliminates redundant computation | Stale cached value if model attributes change externally | resetAccessorCache() or re-read the model from DB |
| Object caching improves performance | Shared object references cause mutation bugs | Use withoutObjectCaching() for mutable objects |
| Transparent to consuming code | Debugging is harder — cached values may be stale | Add logging or disable caching in local development |

## Performance Considerations
- First accessor call is unchanged (~1-2µs). Subsequent cached reads are ~0.1µs array lookups.
- Memory overhead per cached attribute: one entry in `$accessors` array (~72 bytes + value size). For 10 cached attributes per model × 1000 models per request = ~10KB overhead (negligible).
- In Octane, model instances persist across requests. Attribute caching prevents re-execution of accessors within a single request, but models are garbage-collected between requests.
- Object cloning (`withoutObjectCaching`) adds ~0.5µs per access for simple objects, more for complex objects. Profile before using on hot paths.

## Production Considerations
- Only cache accessors that are measurably expensive or called multiple times. Premature caching wastes memory without benefit.
- Use `withoutObjectCaching` when the cached object is mutable and passed to external code (API resources, Blade views) that may modify it.
- For models with many cached attributes, monitor memory per request using Laravel's debugbar or xdebug.
- In testing, cached values persist across multiple assertions on the same model instance. Call `$model->resetAccessorCache()` between independent test cases.

## Common Mistakes
- **Caching accessors that return primitive values:** `shouldCache()` on an accessor returning `int|string` adds memory overhead for no performance gain — primitive reads are already sub-μs.
- **Mutating cached objects:** Without `withoutObjectCaching`, modifying the returned object mutates the cache. Subsequent callers receive the mutated object.
- **Forgetting to invalidate cache:** After manually modifying `$model->attributes`, the accessor cache still returns stale values. Always use `$model->setAttribute()` to trigger invalidation.
- **Caching non-idempotent accessors:** An accessor that returns `now()` or `rand()` should never be cached — the cached value is frozen at first access time.

## Failure Modes
- **Stale value after direct attributes manipulation:** `$model->attributes['name'] = 'new'` does not clear the accessor cache for `name`. The next `$model->name` returns the old cached value.
- **Object mutation leak:** Caller A mutates a cached Money object (e.g., `$model->price->add(500)`). Caller B reads `$model->price` and sees the mutated value. Mitigation: always use `withoutObjectCaching()` for mutable objects.
- **Memory leak in long-running process (Octane/Queue):** If a cached attribute holds a large object (e.g., a 10MB collection), and the model is retained in scope, memory grows unbounded. Use `withoutObjectCaching` or reset cache after use.

## Ecosystem Usage
- **Laravel Nova:** Nova fields that display cached attributes benefit from the performance improvement. No special Nova configuration needed.
- **Laravel API Resources:** `new UserResource($user)` calls `$user->toArray()`, which reads all attributes including cached accessors. Caching helps when the same model is serialized in multiple resource classes.
- **Laravel LiveWire:** LiveWire re-renders components on every update. Cached accessors avoid repeated computation on each render cycle for the same model instance.
- **Laravel Octane:** Attribute caching is safe in Octane because the `$accessors` array is per-instance and instances are garbage-collected between requests.

## Related Knowledge Units

### Prerequisites
- [Accessor Patterns](../accessor-patterns/02-knowledge-unit.md) — caching applies only to accessors defined via `Attribute::make()`.

### Related Topics
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — casting does not use accessor caching; cast results are computed fresh on each read.
- [Multi-Attribute Mutators](../multi-attribute-mutators/02-knowledge-unit.md) — denormalized columns written by multi-attribute mutators are good caching candidates for reads.

### Advanced Follow-up Topics
- [Octane Architecture](../../../laravel-execution-lifecycle/long-running-processes/octane-architecture-overview/02-knowledge-unit.md) — memory management considerations for cached attributes in long-running processes.
- [Model Serialization](../../serialization/model-serialization/02-knowledge-unit.md) — cached accessor values are serialized as part of model serialization.

## Research Notes
- The `$accessors` array is defined as `protected $accessors = []` in the `Model` class. It is populated in `Model::mutateAttribute()` when `shouldCache` is true.
- `withoutObjectCaching` was added in Laravel 10 to address shared-mutation bugs reported in Octane and LiveWire environments.
- Laravel does not provide a `cacheForget()` method for individual cached attributes. Use `$model->setAttribute($key, $model->getAttribute($key))` to reset the cache for a single attribute.
- Future direction: Laravel may add TTL-based attribute caching or integration with the application-level cache driver for cross-request accessor caching.
