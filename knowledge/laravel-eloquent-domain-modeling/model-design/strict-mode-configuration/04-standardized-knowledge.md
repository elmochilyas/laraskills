# Strict Mode Configuration

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Strict Mode Configuration |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Eloquent defaults prioritize convenience over correctness — lazy loading is silently permitted, missing attributes return `null`, and non-fillable mass-assignment attributes are silently discarded. Laravel provides `preventLazyLoading`, `preventSilentlyDiscardingAttributes`, and `preventAccessingMissingAttributes`. The `shouldBeStrict()` convenience method enables all three. Strict mode catches data-integrity issues early.

## Core Concepts

- **preventLazyLoading**: Throws `LazyLoadingViolationException` when an unloaded relationship is accessed
- **preventSilentlyDiscardingAttributes**: Throws when mass-assigning attributes not in `$fillable`
- **preventAccessingMissingAttributes**: Throws when accessing attributes that don't exist on the model
- **shouldBeStrict()**: Enables all three protections at once

## When To Use

- All non-production environments (local, staging, testing)
- Production during initial deployment and monitoring phase (then consider disabling for performance)
- When onboarding new developers to prevent common mistakes

## When NOT To Use

- Production for legacy apps where silent discarding is expected behavior (migrate gradually)
- When the performance overhead of missing attribute checks is unacceptable (rare)

## Best Practices

- **Enable in `AppServiceProvider::boot()`**: Call `Model::shouldBeStrict()` early in the boot process for application-wide enforcement.
- **Disable lazy loading prevention in admin panels if needed**: Some admin panels (Nova, Filament) rely on lazy loading. Configure exceptions with a custom `LazyLoadingViolationException` handler.
- **Combine with tests**: Enable strict mode in test environment to catch violations in CI before they reach production.

## Architecture Guidelines

- Call in `AppServiceProvider::boot()` or `App\Providers\ModelStrictServiceProvider`
- Use `shouldBeStrict()` for non-production; individual controls for fine-tuned production
- Customize `LazyLoadingViolationException` handler to log instead of throw for admin contexts

## Performance Considerations

- `preventAccessingMissingAttributes` adds a minor check on every attribute access
- `preventLazyLoading` adds no runtime overhead — it only throws when a violation occurs
- The cost is negligible compared to the cost of the bugs these features catch

## Examples

```php
// In AppServiceProvider::boot()
Model::shouldBeStrict(! $this->app->isProduction());

// Custom lazy loading handler for admin panels
Model::preventLazyLoading(
    throw: fn () => request()->is('admin/*') ? false : true
);
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Lazy Loading Prevention |
| Closely Related | N+1 Detection |
| Closely Related | Mass Assignment Protection |

## AI Agent Notes

- Always enable `shouldBeStrict()` in non-production
- Customize lazy loading handler for admin panels
- Catches N+1, silent discarding, and missing attributes early

## Verification

- [ ] `Model::shouldBeStrict()` or individual protections enabled in AppServiceProvider
- [ ] Non-production environments have strict mode on
- [ ] Admin panel lazy loading is handled (log instead of throw if needed)
