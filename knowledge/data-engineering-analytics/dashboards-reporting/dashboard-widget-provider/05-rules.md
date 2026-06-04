# Rules: Dashboard Widget Data Provider Pattern

## Rule DWP-01: One Provider Per Widget Type
Each distinct widget type MUST have exactly one provider class. Widget instances are parameterized, not duplicated providers.

## Rule DWP-02: No Query Logic in Templates
Eloquent queries and data transformations MUST NOT be in Blade, Livewire, or Inertia templates. All data retrieval belongs in provider classes.

## Rule DWP-03: Cache Provider Output
Provider output MUST be cached with an appropriate TTL. Providers that query more than 100K rows must have cache enabled by default.

## Rule DWP-04: Decouple Providers from HTTP
Providers MUST NOT read directly from `request()`. Filter values MUST be passed as a DTO or parameter object.

## Rule DWP-05: Providers Return Transformed Data
Providers MUST return chart-ready or display-ready data, not raw query results. Templates must not contain business logic.

## Rule DWP-06: Test Providers Independently
Providers MUST have independent unit tests (mocked query) and integration tests (test database). Provider tests must not depend on UI components.

## Rule DWP-07: Use Invokable Providers
Providers SHOULD be invokable classes receiving a filter DTO. This allows providers to be used as callables.

## Rule DWP-08: Parallelize Independent Providers
Dashboard pages with multiple providers MUST execute independent providers in parallel using `Concurrency::run()`.

## Rule DWP-09: Document Provider Freshness
Each provider MUST document its acceptable data freshness (TTL) and cache invalidation triggers.

## Rule DWP-10: Handle Provider Errors Gracefully
Provider failures MUST NOT crash the entire dashboard. Failed providers must return a "data unavailable" state for their widget.
