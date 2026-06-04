# Lazy Loading Violations — Strict Mode Enforcement

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Lazy Loading Violations
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel provides strict mode methods that convert lazy-loaded relationship accesses from silent queries into explicit exceptions. `preventLazyLoading()` and `shouldBeStrict()` act as runtime assertions that enforce eager loading discipline during development and testing. This shifts N+1 detection from "monitoring for slow queries" to "failing fast with a clear stack trace."

---

## Core Concepts

- **`Model::preventLazyLoading()`:** When enabled, any access to an unloaded relationship via the dynamic property throws a `LazyLoadingViolationException`. Method calls (`$model->relation()`) are unaffected.
- **`shouldBeStrict()`:** Convenience method introduced in Laravel 10+ that enables `preventLazyLoading()`, `preventSilentlyDiscardingAttributes()`, and `preventAccessingMissingAttributes()` in a single call.
- **Custom violation handler:** Pass a callable to `preventLazyLoading(false, $callback)` to log violations instead of throwing, enabling soft enforcement in production or staging.
- **Trait-level enforcement:** The `HasRelationships` trait contains the lazy loading resolution logic. Violations are detected in `Model::getRelationshipFromMethod()`.
- **Scope:** Prevention is a global flag on the `Model` class — it applies to all models in the application. Enable it in service provider boot methods.

---

## Mental Models

### The Firewall Metaphor
Strict mode is a firewall between development and production. It blocks N+1 queries at the development door, preventing them from reaching production where they would degrade real user experience. Disabling it in production without the custom handler is like removing the firewall because traffic is light.

### The Unit Test Analogy
Think of `preventLazyLoading()` as a permanent, globally-scoped unit test assertion: "No lazy loading occurred during this request." Every request in development and CI becomes a test for N+1 violations.

---

## Internal Mechanics

- `Model::getRelationshipFromMethod()` is the chokepoint. When `$model->relation` is accessed and the relation is not loaded, Eloquent calls `$model->getRelationshipFromMethod($method)`, which queries the database.
- If `Model::$lazyLoadingViolation` is set to `true`, the method checks `Model::$lazyLoadingViolationHandler` before executing the query. If no custom handler is set, `LazyLoadingViolationException` is thrown.
- The custom handler receives the model instance and the relation name. It can log, increment a metric, queue a fix, or ignore specific relations.
- The flag is stored as a static property on the Model class — it affects all model instances globally.

---

## Patterns

- **Development-only strict mode:** Enable in `AppServiceProvider::boot()` with `$this->app->isLocal()` guard.
- **CI/CD enforcement:** Enable in test environment `phpunit.xml` bootstrap or `TestCase::setUp()`.
- **Custom handler for staging:** Log violations to a dedicated channel or increment a metric counter without throwing.
- **Selective ignoring:** The custom handler can skip known violations for third-party packages that haven't fixed their lazy loading.
- **`shouldBeStrict()` triple enforcement:** In development, enable all three strict modes at once.

---

## Architectural Decisions

- **Throw vs. log:** Throwing in development is aggressive but catches every violation. Logging in staging allows gradual remediation. Use both at different lifecycle stages.
- **Global vs. per-model:** The flag applies globally. For per-model control, use the custom violation handler that returns early for specific models/relations.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Catches N+1 at development time | Can break third-party packages that lazy-load | Wrap with `$this->app->isLocal()` guard |
| Clear stack trace pinpoints violation | Requires fixing all violations before tests pass | Use staging handler for gradual fixes |
| `shouldBeStrict()` bundles related protections | Enabling all three can be disruptive | Enable progressively per environment |
| Custom handler enables soft enforcement | Handler logic adds maintenance burden | Keep handlers simple — log and increment |

---

## Performance Considerations

- `preventLazyLoading()` adds negligible overhead — a single static property check before each lazy load. No measurable impact.
- The custom handler is invoked per violation. If handler does I/O (logging to file, incrementing Redis counter), aggregate violations can cause overhead.
- In production without enforcement, lazy loading is already slower than eager loading due to the N+1 query cost. Strict mode does not add to this — it merely surfaces it.

---

## Production Considerations

- **Never enable `preventLazyLoading()` with thrown exceptions in production.** A single lazy load in a hot code path would break the entire request.
- Use the custom handler in production/staging to log violations to a monitoring system without disrupting users.
- Monitor violation counts as a metric — a spike may indicate a code change that missed eager loading.
- Enable in CI tests to prevent deployment of code with lazy loading violations.

---

## Common Mistakes

- **Enabling in production without a custom handler:** Causes 500 errors on every lazy load. Use the custom handler or scope to non-production environments.
- **Not enabling in test suite:** The most common place to catch violations is automated tests. If tests don't enforce strict mode, violations ship to production.
- **Disabling globally for third-party packages:** Instead of `preventLazyLoading(false)`, configure the custom handler to ignore specific relations from packages.
- **Confusing lazy loading prevention with eager loading:** Strict mode prevents the *property access shortcut* (`$model->relation`) but method calls (`$model->relation()`) are still allowed and return a query builder, not results.

---

## Failure Modes

- **Exception loop:** If the custom violation handler itself triggers a lazy load, it recurses until stack overflow.
- **Package incompatibility:** A package update introduces a lazy load in its internal code. Strict mode breaks the application. Pin package versions and test upgrades.
- **False sense of security:** Strict mode only catches dynamic property access lazy loads. It does not catch lazy loads via `$model->relation()->get()` method chain. These must be caught via query counting.

---

## Ecosystem Usage

- **Laravel Jetstream / Fortify:** Both enable `preventLazyLoading()` in their service providers for development environments.
- **Spatie packages:** Several Spatie packages (media-library, permissions) document strict mode compatibility and recommend custom handlers.
- **Laravel Debugbar:** When used alongside strict mode, Debugbar provides visual confirmation of which violations were caught.

---

## Related Knowledge Units

### Prerequisites
- Relationship definition and lazy loading behavior
- Service provider registration

### Related Topics
- `detection` (query counting for method-chain lazy loads)
- `prevention-strategies` (eager loading patterns)
- `select-constraints` (reducing lazy-loaded data)

### Advanced Follow-up Topics
- Custom lazy loading violation monitoring dashboards
- Automated eager loading injection based on violation logs

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Model::getRelationshipFromMethod()` (Laravel 11, line ~3500) contains the violation check. `Illuminate\Database\Eloquent\Concerns\HasRelationships` provides the trait. `Model::preventLazyLoading()` sets the static `$lazyLoadingViolation` property in `Model.php` class.

### Key Insight
Strict mode catches only one type of lazy loading (dynamic property access). Method-chain lazy loads (`$model->relation()->where(...)->get()`) are intentional query builder invocations and are not violations. This means strict mode is necessary but not sufficient — combine with query count assertions for full coverage.

### Version-Specific Notes
- Laravel 7: `Model::preventLazyLoading()` introduced (Laravel 7.25+).
- Laravel 10: `Model::shouldBeStrict()` introduced, bundling three prevention modes.
- Laravel 11: Custom violation handler support with `preventLazyLoading(false, $callback)` signature stabilized.
