# Dashboard Widget Provider

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 08-dashboards-reporting
- **Knowledge Unit:** dashboard-widget-provider
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

The Dashboard Widget Data Provider pattern decouples widget rendering from data retrieval by defining dedicated provider classes that encapsulate query logic, caching, and formatting for individual dashboard widgets. This is the standard architectural pattern for Laravel dashboards — centralizing data retrieval in testable, cacheable provider classes that can be reused across dashboards and templates.

---

## Core Concepts

- **Widget as Component:** Self-contained UI component displaying a specific metric or visualization — three concerns: data retrieval (provider), presentation (Blade/Livewire/Inertia), configuration (widget metadata)
- **Provider Class:** Dedicated PHP class encapsulating all data retrieval logic for a single widget — handles querying, filtering, calculations, and formatting — typically invokable or has a `data()` method
- **Caching Layer:** Widget data is often expensive to compute — provider pattern naturally integrates caching — cache provider output with TTL appropriate for widget's freshness requirements
- **Filter Propagation:** Dashboard filters (date range, region, segment) must propagate to all widget providers consistently — shared filter DTO each provider reads
- **Data Transformations:** Providers may transform raw query results into chart-ready formats — extracting series arrays for ApexCharts, formatting numbers, computing percentages and growth rates

---

## Mental Models

- **Provider as Chef:** Each widget provider is a specialized chef in a restaurant kitchen. The chef knows exactly how to prepare their dish (widget data) — what ingredients to get (queries), how to cook them (calculations), and how to plate them (formatting). The waiter (template) just takes the finished plate to the customer.
- **Widget as Self-Service Kiosk:** Think of each widget as a self-service kiosk that provides a specific piece of information. The provider is the software inside the kiosk that knows how to fetch, compute, and display that information. When you change provider logic, you update all kiosks of that type automatically.

---

## Internal Mechanics

A provider class receives a filter DTO (containing date range, tenant ID, user role, etc.) and returns a formatted result. The provider executes queries against read models (analytics schema, ClickHouse, or cached data), performs any necessary calculations, and transforms the result into a chart-ready format (arrays for series, labels, values). The provider's output is cached using Laravel's cache system with a TTL matching the widget's acceptable staleness. Dashboard templates call providers and pass the formatted data to chart components.

---

## Patterns

- **One Provider Per Widget:** Each widget type has exactly one provider class — widget instances are parameterized uses of the same provider
- **Use Invokable Providers:** Define providers as invokable classes (`__invoke()`) receiving a filter DTO — makes providers callable like functions and simplifies testing
- **Cache Provider Output:** Cache provider return value with TTL equal to widget's acceptable staleness — use Laravel's cache tags for group invalidation

---

## Architectural Decisions

Use the provider pattern for all Laravel dashboard implementations — it scales from single-metric pages to complex multi-widget dashboards. Not needed for static dashboards where data never changes or for external BI tools (Grafana, Metabase) that have their own data layer. Pass filter values as a DTO parameter to keep providers decoupled from the HTTP layer.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized query logic per widget | Overhead for single-widget pages | Not justified for trivial single-metric pages |
| Testable in isolation | Must mock query results for unit tests | Integration tests with test database verify accuracy |
| Cacheable output | Cache invalidation complexity | Shorter TTL = fresher data, higher DB load |
| Reusable across dashboards | Provider interface design decisions | Well-designed interface enables broad reuse |

---

## Performance Considerations

Provider execution time is the primary determinant of dashboard load time. Cached providers return in < 5ms. Uncached aggregate queries may take 100ms-10s. Parallelize independent provider calls using `Concurrency::run()` or async HTTP if providers call external APIs. Cache invalidation strategy determines data freshness — shorter TTL = fresher data but higher database load.

---

## Production Considerations

Providers should not read `request()` directly — filter values passed as DTO enables usage in queue jobs, Artisan commands, and tests. Provider returns chart-ready data, not raw query results — templates should not contain business logic. Monitor provider execution time and cache hit rates. Set provider-specific timeouts for external API calls.

---

## Common Mistakes

- **Query Logic in Blade/Livewire:** Eloquent queries written directly in Blade files or Livewire components — same revenue query in three components, changing it requires updating three files. Better: extract all data queries to provider classes.
- **No Caching on Expensive Providers:** Provider queries 10M rows to compute monthly revenue — every dashboard page load re-executes, 5 second load time. Better: cache provider output for 5-15 minutes.
- **Providers Coupled to HTTP Request:** Provider reads `request()->input('date_from')` directly — cannot be used in queue jobs, commands, or tests without HTTP request. Better: pass filter values as DTO parameter.

---

## Failure Modes

- **Provider Returns Raw Query Results:** Provider returns Eloquent Collection — widget template contains business logic computing growth rates, formatting numbers. Mitigation: provider transforms data into chart-ready format, template only renders.
- **Cache Stampede:** Provider cache expires — multiple concurrent requests all try to regenerate simultaneously, all hitting the database. Mitigation: use cache lock or stampede protection (`Cache::lock()->get()`).
- **Cross-Widget Filter Inconsistency:** Date range filter applied differently across providers — revenue widget shows different date range than orders widget. Mitigation: use shared filter DTO across all providers.

---

## Ecosystem Usage

The widget provider pattern is used in Laravel dashboard packages and custom analytics dashboards. Providers use Eloquent, read models, or ClickHouse queries to fetch data. They integrate with Laravel's cache system and can be registered as services in the container. Livewire components and Inertia pages call providers to hydrate dashboard views.

---

## Related Knowledge Units

### Prerequisites
- Read Models — Data source for widget providers
- Eloquent Aggregates — Query patterns used in providers

### Related Topics
- Star Schema — Gold layer data structure queried by providers
- Caching Strategies — Cache TTL and invalidation for widget data

### Advanced Follow-up Topics
- Grafana/Metabase — External BI alternatives to in-app dashboards
- Reverb WebSocket — Real-time widget updates via broadcasting

---

## Research Notes

The Dashboard Widget Provider pattern is the standard architectural approach for Laravel dashboards because it centralizes data retrieval logic, making dashboards maintainable as they grow. The one-provider-per-widget rule keeps providers focused and testable. Cache integration is essential for production dashboards — without caching, even well-written providers cause excessive database load on busy dashboards.
