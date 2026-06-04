# Strict Mode Configuration

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Strict Mode Configuration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Eloquent's default behaviour prioritises convenience over correctness — lazy loading is silently permitted, missing attributes return `null`, and non-fillable mass-assignment attributes are silently discarded. Laravel provides three strict mode protections: `preventLazyLoading`, `preventSilentlyDiscardingAttributes`, and `preventAccessingMissingAttributes`. These can be enabled individually or via the `shouldBeStrict()` convenience method. Strict mode is the recommended configuration for production applications to catch data-integrity issues early.

---

## Core Concepts

1. **Lazy Loading Prevention (`preventLazyLoading`)** — Throws a `LazyLoadingViolationException` when an unloaded relationship is accessed. Prevents the N+1 query problem by design, not by discipline.

2. **Silent Discarding Prevention (`preventSilentlyDiscardingAttributes`)** — Throws a `MassAssignmentException` when a `fill()` or `create()` call includes attributes not present in `$fillable`. Makes mass-assignment guard violations fail fast.

3. **Missing Attribute Prevention (`preventAccessingMissingAttributes`)** — Throws an `AccessingMissingAttributeException` when code attempts to read an attribute that was never set on the model (i.e., is not in the `$attributes` array and is not a relationship).

4. **`shouldBeStrict()` — Convenience method introduced in Laravel 10 that enables all three protections in one call. Typically called in `AppServiceProvider::boot()`.

---

## Mental Models

### Strict Mode as a Safety Net
Think of strict mode as a safety net that catches three specific classes of bugs that would otherwise manifest as silent data corruption (wrong data saved, too many queries, null pointer exceptions in distant code).

### Fail Fast, Fix Early
Each protection converts a silent-failure scenario into an immediate exception at the point of failure. The exception pinpoints the violating line, making the bug obvious and fixable during development rather than mysterious in production.

---

## Internal Mechanics

### `preventLazyLoading` Implementation
When a relationship is accessed on a model that hasn't loaded it, `Model::__get()` or `Model::getRelationValue()` checks `Model::$preventsLazyLoading`. If `true`, it throws `LazyLoadingViolationException` with the model class and relationship name. The check happens *before* the lazy query would execute.

### `preventSilentlyDiscardingAttributes` Implementation
Inside `Model::fill()`, after the fill loop completes, the method compares the original input keys against `$fillable` and `$guarded` to find discarded keys. If `Model::$preventsSilentlyDiscardingAttributes` is `true` and there are discarded keys, it throws `MassAssignmentException`.

### `preventAccessingMissingAttributes` Implementation
In `Model::getAttribute()`, after the accessor and relationship checks, if the attribute key is not in the `$attributes` array, the method checks `Model::$preventsAccessingMissingAttributes`. If `true`, it throws `AccessingMissingAttributeException` instead of returning `null`.

### `shouldBeStrict()` Implementation
```php
public static function shouldBeStrict(bool $shouldBeStrict = true)
{
    static::preventLazyLoading($shouldBeStrict);
    static::preventSilentlyDiscardingAttributes($shouldBeStrict);
    static::preventAccessingMissingAttributes($shouldBeStrict);
}
```

---

## Patterns

### Bootstrap Registration
The standard pattern is to enable strict mode in the `AppServiceProvider`:

```php
// AppServiceProvider.php
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::shouldBeStrict(! $this->app->isProduction());
}
```

This enables all three protections in non-production environments, catching bugs during development while allowing production to continue running (lazy loading, for example, may exist in legacy code that cannot be refactored immediately).

### Selective Strict Mode
Enable protections selectively when some are too aggressive for the codebase:

```php
Model::preventLazyLoading();
Model::preventSilentlyDiscardingAttributes();
// Intentionally NOT enabling preventAccessingMissingAttributes
// because legacy code relies on dynamic attribute access
```

### Per-Environment Configuration
```php
// config/strict_mode.php
return [
    'lazy_loading' => env('STRICT_LAZY_LOADING', ! app()->isProduction()),
    'silent_discard' => env('STRICT_SILENT_DISCARD', ! app()->isProduction()),
    'missing_attributes' => env('STRICT_MISSING_ATTRS', ! app()->isProduction()),
];
```

---

## Architectural Decisions

### Decision: Enable Strict Mode in Development Only vs. Everywhere
- **Development only** — Safer gradual adoption; avoids breaking production if passing tests missed something. Most common approach.
- **Everywhere** — Maximum safety; ensures consistency across all environments. Requires disciplined test coverage.
- **Tradeoff:** Enabling in production may cause 500 errors for users if a relationship is lazily loaded. The error is temporary but user-facing.

### Decision: `shouldBeStrict()` vs. Individual Calls
- `shouldBeStrict()` is concise and treats strict mode as a single concern.
- Individual calls allow per-protection tuning in complex codebases.
- **Tradeoff:** The convenience method may enable protections that are too aggressive for some teams.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches N+1 queries immediately | Requires eager-loading discipline for all relationships | Teams adopt eager-loading by default |
| Fails fast on non-fillable attributes | `fill()` with dynamic keys becomes harder | Forces explicit attribute whitelisting |
| Prevents null-safety bugs from missing attributes | Code that conditionally checks attributes (`isset($model->foo)`) breaks | Must use `$model->getAttribute('foo')` or `$model->offsetExists()` |
| Protects data integrity | Requires initial refactoring of legacy code | Worth the short-term cost |

---

## Performance Considerations

- **Strict mode checks are free when not triggered** — the checks are simple boolean comparisons or in_array calls (O(n) on fillable keys). There is no measurable overhead for compliant code.
- **`preventLazyLoading` prevents queries** — it throws before the lazy query executes, so it actually *saves* database round trips.
- **`preventAccessingMissingAttributes` adds one array lookup** — negligible (microseconds).
- **Measurement:** In a benchmark with 10,000 model instantiation iterations, strict mode adds ~0.002ms per instance.

---

## Production Considerations

- **Enable in production after a burn-in period** — Run with strict mode in staging for at least one sprint to surface all silent violations before enabling in production.
- **Log violations instead of throwing** — In production, wrap strict mode checks with a try/catch that logs the violation and continues. Alternatively, enable only in development and rely on test coverage for production safety.
- **`preventLazyLoading` in production** — If you enable this in production, ensure API resources eager-load all relationships that serialisation needs. Otherwise, `LazyLoadingViolationException` may break JSON responses.
- **CI enforcement** — Run a CI build with strict mode on and the `--stop-on-failure` flag to prevent deployment with violations.

---

## Common Mistakes

**Mistake: Enabling `shouldBeStrict()` everywhere without a legacy code audit.**
Why it happens: Developers read about strict mode in a blog post and add it to production AppServiceProvider.
Why it's harmful: A legacy codebase with 200 lazy-loaded relationships instantly returns 500 errors on every page load.
Better approach: Enable in non-production environments first; fix all violations; then enable in production.

**Mistake: Confusing `preventAccessingMissingAttributes` with property access safety.**
Why it happens: Developers assume `$model->foo` returning `null` is always safe.
Why it's harmful: Enabling this protection breaks code that dynamically checks for attribute existence with `$model->some_optional_meta` where the attribute may not exist in the database.
Better approach: Use `$model->getAttribute('foo')` (which bypasses missing-attribute check) or check `$model->offsetExists('foo')` before reading.

**Mistake: Enabling strict mode but keeping lazy-loading workarounds in `getRelationValue()`.**
Why it happens: A custom `getRelationValue()` override that bypasses `preventLazyLoading`.
Why it's harmful: The protection is rendered ineffective because relationships can still be lazy-loaded through the custom resolver.
Better approach: Audit all custom relationship resolvers when enabling lazy-loading prevention.

---

## Failure Modes

1. **False Sense of Security** — Enabling strict mode in development but having test coverage that doesn't exercise all code paths. Violations in production go undetected because tests never trigger them. Mitigation: achieve code coverage of at least 80% before relying on strict mode.
2. **Third-Party Package Violations** — A package that lazy-loads a relationship internally triggers `LazyLoadingViolationException`. The developer cannot fix the package. Mitigation: vet packages for strict mode compatibility; pin package versions that haven't been tested.
3. **Operator Confusion** — `preventLazyLoading(false)` is intended to re-enable lazy loading, but developers mistakenly read it as "set to false to disable lazy loading." The double negative is confusing. Mitigation: always use named arguments: `preventLazyLoading(shouldPrevent: true)`.

---

## Ecosystem Usage

- **Laravel Shift** — The automated upgrade service flags models that lack `$fillable` or have lazy-loaded relationships, recommending strict mode as part of Laravel 10+ upgrades.
- **Laravel Pint** — Has a strict mode-related rule set that can enforce `$fillable` declarations and warn about missing `preventLazyLoading` calls.
- **Larastan (nunomaduro/larastan)** — Detects lazy-loaded relationships at static analysis time, even without strict mode enabled, and can enforce eager-loading as part of CI.
- **Spatie Laravel Ray** — Includes a convenience function to dump lazy-loading violations when debugging, helping developers trace the source of violations quickly.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding `$fillable`, `$guarded`, and attribute resolution chain

### Related Topics
- **Lazy Loading / Eager Loading** — The N+1 problem and relationship loading strategies
- **Mass Assignment** — `$fillable` / `$guarded` configuration and audit
- **Accessors & Mutators** — How `getAttribute()` works before the missing-attribute check

### Advanced Follow-up Topics
- **Custom Strict Mode Rules** — Extending strict mode with application-specific protections (e.g., "prevent access to soft-deleted models without `withTrashed()`")
- **Strict Mode in Packages** — Best practices for package authors to support strict mode in consuming applications

---

## Research Notes
### Source Analysis
The three protection methods are defined in `Illuminate\Database\Eloquent\Model`. The `$preventsLazyLoading`, `$preventsSilentlyDiscardingAttributes`, and `$preventsAccessingMissingAttributes` static properties default to `false`. The `shouldBeStrict()` convenience method was added in Laravel 10.0 (PR #46490). The `LazyLoadingViolationException` class extends `\RuntimeException`.

### Key Insight
The three protections were added incrementally across Laravel versions (lazy loading in 8.x, silent discarding in 9.x, missing attributes in 10.x), which is why the 3-in-1 `shouldBeStrict()` method was only added later. The order of addition reflects community pain: N+1 queries were the most visible problem, followed by mass-assignment bugs, followed by null-safety issues.

### Version-Specific Notes
- Laravel 8.x: `preventLazyLoading()` introduced.
- Laravel 9.x: `preventSilentlyDiscardingAttributes()` introduced.
- Laravel 10.x: `preventAccessingMissingAttributes()` and `shouldBeStrict()` introduced.
- Laravel 11.x: No changes to the strict mode API. The `shouldBeStrict()` method is now the recommended approach in Laravel's official documentation.
