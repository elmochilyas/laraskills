# Lazy Loading Violations

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Lazy Loading Violations |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Laravel's strict mode methods convert lazy-loaded relationship accesses from silent queries into explicit exceptions. `preventLazyLoading()` and `shouldBeStrict()` act as runtime assertions that enforce eager loading discipline during development and testing. This shifts N+1 detection from "monitoring for slow queries" to "failing fast with a clear stack trace."

## Core Concepts

- **`Model::preventLazyLoading()`**: When enabled, accessing an unloaded relationship via dynamic property throws `LazyLoadingViolationException`. Method calls (`$model->relation()`) are unaffected.
- **`shouldBeStrict()`**: Introduced in Laravel 10+, bundles `preventLazyLoading()`, `preventSilentlyDiscardingAttributes()`, and `preventAccessingMissingAttributes()`.
- **Custom violation handler**: Pass a callable to `preventLazyLoading(false, $callback)` to log violations instead of throwing — enables soft enforcement.
- **Scope**: Prevention is a global flag on the `Model` class, applying to all models application-wide.

## When To Use

- Development environment — enable with throw behavior to catch violations early
- CI/CD test suite — enable to prevent deployment of code with lazy loading violations
- Staging environment — enable with custom logging handler to track violations without breaking pages
- Any codebase where N+1 regression prevention is important

## When NOT To Use

- Production with throw behavior — a single lazy load breaks the entire request
- Codebases with many third-party packages that use lazy loading (use custom handler to ignore specific relations)
- Single-model applications with no relationships (no lazy loading to prevent)

## Best Practices

- **Enable in development with throw, in staging with log**: Use `preventLazyLoading(true)` in local/development — catch violations immediately with a clear stack trace. Use `preventLazyLoading(false, $logHandler)` in staging — log violations to a monitoring system without disrupting testers. Never enable throw behavior in production.
- **Enable `shouldBeStrict()` in development and CI**: It bundles all three prevention modes — lazy loading, silent attribute discarding, and missing attribute access. This provides comprehensive data integrity enforcement with a single call. Disable individual modes if they break third-party package compatibility.
- **Configure a custom handler for package compatibility**: Third-party packages may lazy-load internally. Instead of disabling strict mode globally, configure the handler to ignore specific model/relation combinations. This keeps enforcement active for your application code while accommodating package behavior.
- **Combine with query count assertions for full coverage**: `preventLazyLoading()` only catches dynamic property access (`$model->relation`). Method-chain lazy loads (`$model->relation()->where(...)->get()`) are intentional query builder invocations and are not caught. Add `assertQueryCountLessThan()` tests to cover this gap.

## Architecture Guidelines

- Enable in `AppServiceProvider::boot()` with environment guards
- Use in `TestCase::setUp()` for global test enforcement
- Monitor violation counts in staging as a trend metric
- Pin third-party package versions and test upgrades for strict mode compatibility

## Performance Considerations

- `preventLazyLoading()` adds a single static property check before each lazy load — no measurable overhead
- Custom handler performing I/O (file logging, Redis increment) per violation can add overhead if violations are frequent
- Strict mode does not add performance cost beyond the check — the N+1 queries it prevents are far more costly

## Security Considerations

- `LazyLoadingViolationException` may expose model and relation names in stack traces — handle gracefully in API error responses
- Do not enable throw behavior in production — it causes denial of service for any code path with a lazy load

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Enabling throw in production | Copy-pasting dev config | 500 errors on every lazy load | Use custom handler in production |
| Not enabling in test suite | Overlooking TestCase setup | Violations ship to production | Enable in `TestCase::setUp()` |
| Disabling globally for packages | Frustration with violations | All enforcement lost | Configure handler to ignore specific relations |
| Confusing with method-chain lazy loads | Not understanding scope | Missed violations via `$model->relation()->get()` | Combine with query count assertions |

## Anti-Patterns

- **Production throw mode**: Enabling `preventLazyLoading()` with true in production. A single lazy load in a hot code path breaks the entire request for all users. Use the custom handler instead.
- **Global disable because of packages**: Calling `preventLazyLoading(false)` without a handler because a package triggers violations. This disables enforcement for your code too. Use the handler to selectively ignore known package violations.
- **Strict-mode-only enforcement**: Relying solely on `preventLazyLoading()` for N+1 prevention. It misses method-chain lazy loads and queries inside collections. Always combine with query count assertions.

## Examples

```php
// Development — throw on violation
public function boot(): void
{
    Model::preventLazyLoading(app()->isLocal());
}

// Staging — log violations
public function boot(): void
{
    if (app()->isLocal()) {
        Model::preventLazyLoading();
    }
    if (app()->isStaging()) {
        Model::preventLazyLoading(false, function ($model, $relation) {
            Log::warning("Lazy load: {$model->getTable()}.{$relation}");
        });
    }
}

// Full strict mode in development
public function boot(): void
{
    if (app()->isLocal()) {
        Model::shouldBeStrict();
    }
}

// Test suite enforcement
protected function setUp(): void
{
    parent::setUp();
    Model::preventLazyLoading();
}

// Custom handler ignoring specific package relations
Model::preventLazyLoading(false, function ($model, $relation) {
    $ignored = ['media' => SpatieMediaLibrary::class];
    if (($ignored[$relation] ?? null) === get_class($model)) {
        return; // Allow
    }
    throw new LazyLoadingViolationException($model, $relation);
});
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Relationship definition and lazy loading behavior |
| Prerequisite | Service provider registration |
| Closely Related | detection |
| Closely Related | prevention-strategies |
| Closely Related | select-constraints |

## AI Agent Notes

- Generate `Model::preventLazyLoading()` with `app()->isLocal()` guard in `AppServiceProvider`
- Generate custom handler when third-party packages may lazy-load
- Never generate `preventLazyLoading()` with throw behavior in production code
- Generate `shouldBeStrict()` for new project scaffolding in development

## Verification

- [ ] `preventLazyLoading()` is enabled in development with throw behavior
- [ ] Custom logging handler is configured for staging environments
- [ ] `TestCase::setUp()` enables `preventLazyLoading()` for test enforcement
- [ ] Third-party package violations are handled via custom handler, not global disable
- [ ] Query count assertions complement strict mode for full N+1 coverage
