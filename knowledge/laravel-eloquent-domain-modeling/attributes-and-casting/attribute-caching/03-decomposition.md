# Decomposition: Attribute Caching

## Boundary Analysis
Attribute caching covers only the instance-scoped memoization of accessor results via `shouldCache()` and `withoutObjectCaching()`. It includes the cache storage (`$accessors` array), hit/miss logic, invalidation on `setAttribute`, and object cloning. It does not cover persistent caching (Redis/file cache), query result caching, or view caching.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The feature is a single cross-cutting concern: cache the result of an accessor. The implementation is a single code path in `Model::mutateAttribute()` and cannot be subdivided.

## Dependency Graph
```
Attribute Caching
  ├── extends: Accessor Patterns (caching is a modifier on get closures)
  ├── depends on: Model $accessors array storage
  ├── related to: Mutator Patterns (setAttribute clears the cache)
  ├── overlaps: Performance Optimization (general concern)
  └── related to: Octane Architecture (memory in long-running processes)
```

## Follow-up Opportunities
- **TTL-based attribute caching:** Expiring cached accessor values after a time interval without requiring manual invalidation.
- **Cross-request attribute caching:** Caching accessor results in Redis/Memcached for truly expensive computations shared across requests.
- **Cache tagging for models:** Invalidating all cached attributes for a model when any attribute changes.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization