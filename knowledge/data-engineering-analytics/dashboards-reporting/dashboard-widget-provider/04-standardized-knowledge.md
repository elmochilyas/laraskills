# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 08-dashboards-reporting
**Knowledge Unit:** dashboard-widget-provider
**Difficulty:** Foundation
**Category:** Dashboard Architecture
**Last Updated:** 2026-06-03

---

# Overview

The Dashboard Widget Data Provider pattern decouples widget rendering from data retrieval by defining dedicated provider classes that encapsulate query logic, caching, and formatting for individual dashboard widgets. This is the standard architectural pattern for Laravel dashboards: each widget has a single responsibility (showing a metric, chart, or table) and a corresponding provider that knows how to fetch and transform its data. The pattern enables testable, cacheable, and reusable widget components across dashboards.

Engineers must care because dashboard code is notoriously difficult to maintain. Without the provider pattern, widget data queries are duplicated across Blade templates, Livewire components, and API endpoints. A change to a metric's query logic requires updating multiple files. The provider pattern centralizes data retrieval, making dashboards maintainable as they grow.

---

# Core Concepts

## Widget as Component

A dashboard widget is a self-contained UI component that displays a specific metric or visualization. Each widget has three concerns: data retrieval (provider), presentation (Blade/Livewire/Inertia), and configuration (widget metadata).

## Provider Class

A dedicated PHP class that encapsulates all data retrieval logic for a single widget. The provider handles querying the database, applying filters, performing calculations, and formatting results. Providers are typically invokable classes or classes with a `data()` method.

## Caching Layer

Widget data is often expensive to compute (aggregate queries over large tables). The provider pattern naturally integrates caching: cache the provider's output with a TTL appropriate for the widget's freshness requirements.

## Filter Propagation

Dashboard filters (date range, region, segment) must propagate to all widget providers consistently. The provider pattern uses a shared filter DTO or request object that each provider reads.

## Data Transformations

Providers may transform raw query results into chart-ready formats: extracting series arrays for ApexCharts, formatting numbers for display, computing percentages and growth rates.

---

# When To Use

- All Laravel dashboard implementations
- Multi-page dashboards with shared widgets
- Dashboards requiring filter synchronization across widgets
- Widgets with expensive data queries that benefit from caching

---

# When NOT To Use

- Single-metric dashboard pages (the abstraction overhead is not justified)
- Static dashboards where data never changes
- External BI tools (Grafana, Metabase) — these have their own data layer

---

# Best Practices

## One Provider Per Widget

Each widget type has exactly one provider class. Widget instances (e.g., "Revenue Chart for Q1" and "Revenue Chart for Q2") are parameterized instances of the same provider.

## Use Invokable Providers

Define providers as invokable classes (`__invoke()`) receiving a filter DTO. This makes providers callable like functions and simplifies testing.

## Cache Provider Output

Cache the provider's return value with a TTL equal to the widget's acceptable staleness. Use Laravel's cache tags for group invalidation.

## Test Providers Independently

Unit test providers with mocked query results. Integration test providers against a test database with known data. Provider tests should not depend on the UI component.

---

# Performance Considerations

- Provider execution time is the primary determinant of dashboard load time.
- Cached providers return in < 5ms. Uncached aggregate queries may take 100ms-10s.
- Parallelize independent provider calls using `Concurrency::run()` or async HTTP if providers call external APIs.
- Cache invalidation strategy determines data freshness. Shorter TTL = fresher data but higher database load.

---

# Common Mistakes

## Mistake: Query Logic in Blade/Livewire

Eloquent queries are written directly in Blade files or Livewire components. The same revenue query appears in three different components. Changing the query requires updating three files.

**Better approach:** Extract all data queries to provider classes. Blade/Livewire only call the provider and render results.

## Mistake: No Caching on Expensive Providers

A provider queries 10M rows to compute a monthly revenue total. Every dashboard page load re-executes the query. Dashboard load time is 5 seconds.

**Better approach:** Cache the provider output for 5-15 minutes. Invalidate the cache when new data is imported.

## Mistake: Providers Coupled to HTTP Request

The provider reads `request()->input('date_from')` directly. The provider cannot be used in queue jobs, Artisan commands, or tests without an HTTP request.

**Better approach:** Pass filter values as a DTO parameter. The provider is decoupled from the HTTP layer.

## Mistake: Provider Returns Raw Query Results

The provider returns an Eloquent Collection. The widget template contains business logic: computing growth rates, formatting numbers, filtering series.

**Better approach:** The provider transforms data into chart-ready format. The widget template only renders pre-formatted data.
