# Decision Trees for 4-29 Query Caching Strategies

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-29 |
| Title | Query Caching Strategies |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Cache layer (app cache vs materialized view vs fragment cache)
- D2: Invalidation strategy (TTL vs tagged vs event-driven)
- D3: Cache stampede prevention

## Architecture-Level Decision Trees

### D1: Cache layer (app cache vs materialized view vs fragment cache)

**Decision Context**: Choose between Laravel cache, materialized views, and fragment caching.

**Criteria**:
- Staleness tolerance
- Refresh cost
- Query complexity

**Tree**:
```
Is the data relatively static (changes < 100x/day)?
├── Yes
│   └── Read frequency high?
│       ├── Yes → Cache::remember with TTL
│       └── No → No caching needed
└── No (frequently changing data)
    └── Is the query expensive (aggregation, multi-join)?
        ├── Yes → Materialized view (db-level, refresh on schedule)
        └── No → Query optimization (indexing) instead
```

**Rationale**: App caching works for read-heavy, static-ish data. Materialized views handle expensive aggregations. Fragment caching (rendered output) provides the highest hit value.

**Default**: `Cache::remember` for simple TTL-based caching; materialized views for complex aggregations; fragment caching for rendered views.

**Risks**: Caching Eloquent models with serialized relationships leads to stale relationship state.

**Related Rules/Skills**: 12-27 (materialized views PostgreSQL)

---

### D2: Invalidation strategy (TTL vs tagged vs event-driven)

**Decision Context**: Choose how to invalidate cached data when source data changes.

**Criteria**:
- Data freshness requirements
- Cache driver capabilities
- Model change tracking

**Tree**:
```
Does the cache driver support tags (Redis, Memcached)?
├── Yes
│   └── Invalidate on model events
│       Cache::tags(['posts'])->flush()
│       on Post::saved / Post::deleted
└── No (file, database driver)
    └── Short TTL (e.g., 60 seconds) or custom key-based invalidation
```

**Rationale**: Tagged cache allows group invalidation. Model event listeners flush relevant tags on mutation. Without tags, short TTLs or manual key management.

**Default**: Tagged cache with Redis for production; short TTLs with file cache for simple setups.

**Risks**: Without explicit invalidation, users see stale data until TTL expires.

**Related Rules/Skills**: Cache stampede prevention

---

### D3: Cache stampede prevention

**Decision Context**: Prevent multiple concurrent requests from rebuilding the same cache key simultaneously.

**Criteria**:
- Key popularity (concurrent access)
- Rebuild cost
- Cache driver capabilities

**Tree**:
```
Is the cache key accessed by many concurrent requests?
├── Yes (popular key, > 100 req/s)
│   └── Use stale-while-revalidate pattern
│       1. Serve stale cache immediately
│       2. Dispatch async job to refresh cache
│       3. Store new value before fallback TTL expires
└── No → Simple Cache::remember is sufficient
```

**Rationale**: Without prevention, N concurrent cache misses all execute the same expensive query simultaneously, causing database CPU spikes.

**Default**: Stale-while-revalidate for hot keys; simple remember for low-traffic keys.

**Risks**: Stale-while-revalidate may serve data up to 2x TTL old. Acceptable for most read-heavy workloads.

**Related Rules/Skills**: Cache stampede, cache::lock

---
