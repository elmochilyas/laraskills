# N+1 Query Detection

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 03-apm-performance-monitoring
- **Knowledge Unit:** n-plus-one-detection
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

N+1 queries — executing one query for parent records then N queries for each child relationship — are the most common performance anti-pattern in Laravel applications. Detection happens at multiple layers: development (lazy loading guard), CI (Scout APM analyzer), and production (Pulse slow query recorder). Eliminating N+1 via eager loading is typically the highest-ROI performance optimization available.

---

## Core Concepts

- **Lazy Loading:** Eloquent's default — relationship data fetched only when accessed via `$model->relation`, dangerously expensive in loops
- **Eager Loading:** Explicitly loading relationships via `Model::with('relation')` — executes all queries in minimal statements
- **Hydration:** Populating Eloquent model instances from results — eager loading hydrates in bulk, lazy loading one at a time
- **Query Count Threshold:** Performance budget of maximum queries per request (typically 10-20); N+1 pushes this to 50-500+
- **PreventLazyLoading:** Laravel's guard that throws an exception when lazy loading is detected — enabled in development via `Model::preventLazyLoading()`
- **Telescope QueryWatcher:** Tracks executed queries per request, enabling N+1 identification in development

---

## Mental Models

- **Restaurant Kitchen Model:** Lazy loading is like sending a chef to the store for each ingredient — one trip for salt, another for pepper. Eager loading is buying everything in one trip
- **Water Balloon Model:** A single N+1 is a small leak — the application works fine under low pressure. Under load testing or production traffic, the leak becomes a burst
- **Iceberg Model:** The visible problem is slow page load (10% above water). The hidden mass is 400 unnecessary queries (90% below water) that only appear under load

---

## Internal Mechanics

N+1 occurs when Eloquent lazy-loads a relationship inside a loop. For each parent record, Eloquent executes a separate query to fetch the related records. With N=100 parents and one relationship, this produces 101 queries instead of 2. `PreventLazyLoading()` intercepts the lazy load call and throws a `LazyLoadingViolationException` with the exact file and line number. Eager loading via `with()` transforms this into two queries using a `WHERE IN (...)`, with results hydrated in bulk.

---

## Patterns

- **Selective Eager Loading:** Use `Model::with('relation:id,name')` to load only needed columns. Benefit: reduces memory and transfer overhead by 50-80%. Tradeoff: must know which columns are needed upfront.
- **Query Count Assertions:** Write tests that assert query count per endpoint doesn't regress. Benefit: catches N+1 before deployment. Tradeoff: tests must account for normal query count fluctuations.
- **Subquery Joins:** Use `withCount()` and `withSum()` for aggregation columns instead of loading all related records. Benefit: single query for aggregate data. Tradeoff: limited to aggregate values, not full model access.

---

## Architectural Decisions

**Enable lazy loading guard in all non-production environments.** `Model::preventLazyLoading()` in `AppServiceProvider::boot()` with environment check catches N+1 before deployment. The exception identifies the exact file and line of lazy access.

**Eager load in the controller/repository, not the view.** Loading in the view makes the dependency invisible to callers and couples view logic to data access. The data access layer should return fully loaded models.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eager loading eliminates N+1 (500 queries → 2) | Loading unnecessary relationships increases memory | Use selective columns: `with('relation:id,name')` |
| `preventLazyLoading()` catches N+1 in development | Cannot use intentional lazy loading without explicit opt-in | Disable guard for known large datasets with chunking |
| Query count assertions prevent regression | Tests must be updated when query patterns change | Assertion thresholds need periodic review |

---

## Performance Considerations

Each lazy-loaded relationship in a loop of N=100 adds 100 queries. A single missing `with()` can increase query count from 5 to 505. Loading unnecessary relationships increases PHP memory — use selective columns. For very large datasets (>10,000 records), use `chunk()` or `lazy()` instead of eager loading everything. Use `withCount()` and `withSum()` for aggregation columns.

---

## Production Considerations

Eager loading does not respect authorization — ensure loaded relationships are authorized before exposure via API resources. Multi-tenant applications must ensure eager loaded relationships respect tenant scoping. N+1 patterns from eager loading may expose different data if global scopes are not preserved.

---

## Common Mistakes

**Lazy loading in Blade loops** — `@foreach($orders as $order) {{ $order->user->name }} @endforeach` executes a query per iteration.

**Lazy loading in serialization** — API Resource `toArray()` accessing `$this->relation` without checking if it's loaded. Load before serializing.

**Over-eager loading** — `Model::with(['posts.comments.author', 'profile.settings'])` when only `posts` is needed, loading thousands of extra records.

**Not using selective columns** — `Model::with('posts')` loads all columns when only `title` is needed.

---

## Failure Modes

**Disabled guard in production:** `Model::preventLazyLoading(false)` in production suppresses exceptions, hiding N+1 instead of fixing it. Detection: slow endpoints under load. Mitigation: enable guard in CI; monitor query count per endpoint.

**Eager loading without authorization checks:** Loaded relationships exposed to unauthorized users via API resources. Detection: data leak in API responses. Mitigation: filter relationships after loading based on user permissions.

**Chunking without eager loading:** Using `chunk()` with lazy-loaded relationships — each chunk still triggers N+1 for the chunked batch. Detection: query count grows with dataset size. Mitigation: eager load before chunking.

---

## Ecosystem Usage

Laravel provides `Model::preventLazyLoading()` as a first-party N+1 guard. Telescope's QueryWatcher tracks query count per request. Laravel Pulse records slow queries for production N+1 detection. Scout APM is the only APM with dedicated N+1 detection. Laravel Debugbar shows query count in the browser during development.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM relationship types (hasMany, belongsTo, morphMany)

### Related Topics
- APM Tool Integration & Comparison (Scout APM's N+1 detector)
- Laravel Telescope (QueryWatcher)

### Advanced Follow-up Topics
- Laravel Pulse (slow query recorder)
- Performance Profiling & Bottleneck Detection

---

## Research Notes

`Model::preventLazyLoading()` is the single most effective N+1 prevention measure. Enable it in all non-production environments. Selective eager loading with column restriction reduces memory by 50-80%. Query count assertions in tests prevent N+1 regression. Scout APM is the only APM with dedicated N+1 detection. Lazy loading guard exceptions identify the exact file and line of lazy access.
