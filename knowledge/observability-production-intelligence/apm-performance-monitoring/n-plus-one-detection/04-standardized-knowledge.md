# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 03-apm-performance-monitoring
**Knowledge Unit:** n-plus-one-detection
**Difficulty:** Intermediate
**Category:** Query Performance
**Last Updated:** 2026-06-03

# Overview

N+1 queries — executing one query to fetch a parent record, then N queries for each child relationship — are the most common performance anti-pattern in Laravel applications. Detection happens at multiple layers: during development (Laravel's lazy loading guard, Telescope watcher), in CI (Scout APM's N+1 analyzer), and in production (Pulse slow query recorder, Laravel Debugbar).

Eliminating N+1 via eager loading (`with()`, `load()`) is typically the highest-ROI performance optimization available. A single N+1 pattern can transform a 10-query page into a 400-query page. Fixing it requires minimal code change and yields dramatic latency improvements.

Engineers should care because N+1 is the #1 performance issue in Laravel applications. It is subtle — the application works correctly, queries return the right data — but the performance degradation is invisible until load testing or production traffic reveals it.

# Core Concepts

**Lazy Loading:** Eloquent's default behavior — relationship data is fetched only when accessed via `$model->relation`. This is convenient but dangerously expensive in loops.

**Eager Loading:** Explicitly loading relationships via `Model::with('relation')` execute all queries in as few statements as possible. A single `with()` can eliminate hundreds of individual queries.

**Hydration:** The process of populating Eloquent model instances from database results. Eager loading hydrates all related models in bulk; lazy loading hydrates them one at a time.

**Query Count Threshold:** A performance budget expressed as maximum queries per request. Typically 10-20 queries per request is sustainable; N+1 patterns push this to 50-500+.

**PreventLazyLoading:** Laravel's guard that throws an exception when lazy loading is detected. Enabled in development: `Model::preventLazyLoading()`. Catches N+1 at development time.

**Telescope QueryWatcher:** Telescope's watcher that tracks all executed queries. Displays query count per request, enabling developers to identify N+1 patterns in development.

# When To Use

- **All Laravel applications** — N+1 detection should be part of the development workflow
- **API applications** serving list endpoints with relationships
- **Blade view rendering** with model relationship access in loops
- **Resource/API Resource serialization** accessing relationships during transformation

# When NOT To Use

- **Single-record operations** with no list iteration — N+1 is rare when fetching individual records
- **Known, intentionally lazy-loaded relationships** — some large datasets are intentionally lazy-loaded with chunking patterns

# Best Practices

**Enable lazy loading guard in all non-production environments.** `Model::preventLazyLoading()` in `AppServiceProvider::boot()` with `env('APP_ENV') !== 'production'` catch N+1 before deployment.

**Eager load in the controller/repository, not the view.** Loading in the view makes the dependency invisible to callers and couples view logic to data access.

**Use selective eager loading.** `Model::with('relation:id,name')` loads only the columns needed, reducing memory and transfer overhead.

**Set query count alerts in production.** Monitor query count per request via Pulse or APM. Alert if any endpoint exceeds configured threshold.

**Test query count stability.** Write tests that assert query count per endpoint doesn't regress. Use `assertQueryCountLessThan()` or equivalent.

# Architecture Guidelines

N+1 prevention operates at multiple layers:

1. **Development guard:** `preventLazyLoading()` throws before N+1 reaches testing
2. **CI detection:** Scout APM's N+1 analyzer reviews PRs for new N+1 patterns
3. **Staging validation:** Telescope Query Watcher during integration testing
4. **Production monitoring:** Pulse slow query recorder identifies N+1 candidates

The eager loading responsibility sits in the data access layer (controller, repository, query builder). Views and API resources should assume data is already loaded.

# Performance Considerations

- **N+1 impact:** Each lazy-loaded relationship in a loop of N=100 adds 100 queries. A single missing `with()` can increase query count from 5 to 505
- **Memory cost of eager loading:** Loading unnecessary relationships increases PHP memory. Use selective columns: `with('relation:id,name')`
- **Chunking alternative:** For very large datasets (>10000 records), use `chunk()` or `lazy()` instead of eager loading everything
- **Subquery joins:** For aggregation columns (count, sum), use `withCount()` and `withSum()` instead of loading all related records

# Security Considerations

- **Eager loaded visibility:** Eager loading does not respect authorization. Ensure loaded relationships are authorized before exposure via API resources
- **Cross-tenant data leaks:** Multi-tenant applications must ensure eager loaded relationships respect tenant scoping
- **Query binding exposure:** N+1 patterns from eager loading may expose different data than intended if global scopes are not preserved

# Common Mistakes

**Lazy loading in Blade loops.** The most common N+1 source: `@foreach($orders as $order) {{ $order->user->name }} @endforeach`. Each iteration executes a query for `user`.

**Lazy loading in serialization.** API Resource `toArray()` accessing `$this->relation` without checking if it's loaded. Always check `$this->relation_loaded` or load before serializing.

**Over-eager loading.** Loading `Model::with(['posts.comments.author', 'profile.settings'])` when only `posts` is needed. This loads thousands of extra records.

**Not using selective columns.** `Model::with('posts')` loads all post columns. When only `title` and `id` are needed, use `with('posts:id,title')`.

# Anti-Patterns

**Disabled guard globally:** Setting `Model::preventLazyLoading(false)` in production to suppress exceptions, hiding the N+1 problem instead of fixing it.

**Eager loading everything preemptively:** `Model::with(array_keys($model->getRelations()))` loading all possible relationships regardless of whether they are used. This wastes memory and query time.

**no Guard in CI:** Not enabling the lazy loading guard in CI environments, allowing N+1 patterns to pass tests and reach production.

**Post-serialization loading:** Loading relationships in API Resource `toArray()` via `$this->load()`. This executes extra queries during serialization, defeating the purpose of eager loading.

# Examples

**Lazy loading guard:**
```php
public function boot(): void
{
    Model::preventLazyLoading(! $this->app->isProduction());
}
```

**Eager loading with selective columns:**
```php
$orders = Order::with(['user:id,name', 'items:id,order_id,product_id,price'])
    ->latest()
    ->paginate(20);
```

**Query count assertion:**
```php
it('does not have N+1', function () {
    $this->withoutExceptionHandling();
    DB::enableQueryLog();
    $this->get('/orders');
    expect(DB::getQueryLog())->toHaveCountLessThan(15);
});
```

# Related Topics

**Prerequisites:**
- Eloquent ORM relationship types (hasMany, belongsTo, morphMany, etc.)

**Closely Related Topics:**
- APM Tool Integration & Comparison (Scout APM's N+1 detector)
- Laravel Telescope (QueryWatcher)

**Advanced Follow-Up Topics:**
- Laravel Pulse (slow query recorder for production N+1 detection)
- Performance Profiling & Bottleneck Detection

**Cross-Domain Connections:**
- Laravel Eloquent Domain Modeling — relationship design patterns

# AI Agent Notes

- `Model::preventLazyLoading()` is the single most effective N+1 prevention measure
- Enable it in all non-production environments
- Selective eager loading with column restriction reduces memory by 50-80%
- Query count assertions in tests prevent N+1 regression
- Scout APM is the only APM with dedicated N+1 detection
- Telescope QueryWatcher tracks per-request query count during development
- Lazy loading guard exceptions identify the exact file and line of lazy access
