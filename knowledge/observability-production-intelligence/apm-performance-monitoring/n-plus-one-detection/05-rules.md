# Rules: N+1 Query Detection

## Rule NPD-01: Enable lazy loading guard in all non-production environments
**Condition:** In `AppServiceProvider::boot()` for development, staging, and CI environments.
**Action:** Call `Model::preventLazyLoading(! $this->app->isProduction())`. Do not disable it in any environment except production.
**Consequence:** Every lazy loading access throws a `LazyLoadingViolationException` immediately, catching N+1 during development.

## Rule NPD-02: Use selective eager loading with column restrictions
**Condition:** When eager loading relationships that are not needed in full.
**Action:** Use `Model::with('relation:id,foreign_key,display_field')` to load only required columns. Avoid loading all columns by default.
**Consequence:** Reduces memory consumption 50-80% for relationship data. Reduces data transfer between DB and PHP.

## Rule NPD-03: Eager load in controllers/repositories, not in views
**Condition:** When accessing relationship data in Blade views or API Resource serialization.
**Action:** Ensure all relationships are eager loaded before passing data to the view layer. Use `with()` in the controller or repository.
**Consequence:** Views remain presentation-only. Data access dependencies are explicit and testable.

## Rule NPD-04: Assert query count stability in tests
**Condition:** For every endpoint that returns list data with relationships.
**Action:** Add test assertions that verify query count does not exceed a defined threshold. Use `DB::enableQueryLog()` or Pest's query count assertions.
**Consequence:** N+1 regression is caught in CI before reaching production.

## Rule NPD-05: Use chunk() or lazy() for large result sets
**Condition:** When iterating over more than 1000 Eloquent models.
**Action:** Use `chunk()` or `lazy()` instead of loading all records with eager loaded relationships. Process records in batches.
**Consequence:** Memory usage stays bounded. PHP does not run out of memory on large datasets.

## Rule NPD-06: Check relationship loaded state before lazy access
**Condition:** When conditionally accessing a relationship in code that may or may not have eager loaded it.
**Action:** Use `$model->relation_loaded` to check if the relationship is already loaded. If not loaded and lazy loading is allowed, call `$model->load('relation')`.
**Consequence:** Prevents accidental lazy loading when the guard is disabled.

## Rule NPD-07: Enable lazy loading guard in CI environments
**Condition:** When running tests in CI pipeline.
**Action:** Set `APP_ENV` to `testing` or equivalent. Verify `preventLazyLoading()` activates in CI.
**Consequence:** CI pipeline catches N+1 patterns before code is merged.

## Rule NPD-08: Review query count after schema changes
**Condition:** After adding new relationships, indexes, or columns.
**Action:** Run existing query count tests. Review any increases in query count. If new N+1 patterns appear, add `with()` calls.
**Consequence:** Schema changes cannot silently introduce N+1 patterns.
