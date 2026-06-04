# Provider Properties Shortcuts

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Properties Shortcuts |
| Difficulty | Foundation |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 5.x+ |
| Last Updated | 2026-06-02 |

## Overview
The `ServiceProvider` base class provides two declarative shortcuts — `$bindings` and `$singletons` properties — that register services with the container without writing any code in `register()`. The `mergeConfigFrom()` method simplifies merging package configuration with application defaults. The critical detail is that these shortcuts are processed by the base `register()` method — if a subclass overrides `register()` without calling `parent::register()`, the shortcuts silently do nothing.

## Core Concepts
- **`$bindings` Array** — Declarative interface-to-class mappings: `[Interface::class => Concrete::class]`.
- **`$singletons` Array** — Same as `$bindings` but registers as singletons.
- **`mergeConfigFrom()`** — Merges package config file with application's published config.
- **Parent register Dependency** — Shortcuts processed in `ServiceProvider::register()` — must call `parent::register()` or shortcuts are skipped.

## When To Use
- Simple interface-to-implementation bindings without factory logic.
- Registering a class as its own singleton: `protected $singletons = [MyService::class => MyService::class]`.
- Package config defaults via `mergeConfigFrom()`.

## When NOT To Use
- Complex bindings needing factory closures, contextual binding, or tagging.
- Bindings that require conditional logic based on configuration.
- When `register()` is already overridden and parent is not called.

## Best Practices
- **Always call `parent::register()` when overriding `register()`** — Otherwise `$bindings` and `$singletons` silently don't work.
- **Use `$singletons` for self-binding singletons** — Cleaner than `$this->app->singleton(MyService::class)`.
- **Use `mergeConfigFrom()` in package providers** — Ensures new config keys from updates are available without overriding user customizations.
- **Document `$bindings`/`$singletons` in package README** — These are less visible than code in `register()`.
- WHY: These shortcuts reduce boilerplate for trivial bindings, but their silent-failure mode (when parent::register() isn't called) makes them a common source of bugs.

## Architecture Guidelines
- Shortcuts processed in `registerBindings()` called from base `register()` before user's `register()` override.
- `mergeConfigFrom()` uses `array_merge` recursively — new keys from package updates are added without removing user overrides.
- Properties are not merged with parent class — subclass redeclaration replaces parent's array entirely.

## Performance Considerations
- Property iteration adds negligible overhead (array iteration + container method calls).
- `mergeConfigFrom()` runs on every request unless config is cached — with config cache, merge happens once during caching.
- No meaningful performance difference vs. writing the same bindings in `register()`.

## Security Considerations
- `mergeConfigFrom()` merges package config files — ensure package config doesn't override security-critical application config keys.
- Declarative bindings in properties are less visible — audit package `$bindings`/`$singletons` for security-relevant overrides.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Overriding `register()` without calling parent | Unaware of shortcut processing | `$bindings`/`$singletons` silently never register | Always call `parent::register()` when overriding |
| Using properties with non-existent class names | Typo or refactoring miss | Error surfaces only when service is resolved | Test all bindings in CI |
| `mergeConfigFrom()` after config already cached | Wrong method placement | Merge still happens but redundant after cache | Call in `register()` before config caching |
| Re-declaring `$bindings` in subclass expecting merge | Incorrect inheritance assumption | Parent's bindings replaced entirely | Use constructor to merge arrays manually |

## Anti-Patterns
- **Properties Without parent::register()** — Silent dead code that looks correct but does nothing.
- **Overusing Properties for Complex Bindings** — Factory closures, contextual binding, and tagging cannot use properties.
- **Config Merge After Cache** — Calling `mergeConfigFrom()` in `boot()` after config was cached.

## Examples

### Declarative bindings
```php
class PaymentServiceProvider extends ServiceProvider
{
    protected $bindings = [
        PaymentGateway::class => StripeGateway::class,
        InvoiceRenderer::class => PdfRenderer::class,
    ];

    protected $singletons = [
        PaymentLogger::class => PaymentLogger::class,
    ];

    public function register(): void
    {
        parent::register(); // Process $bindings and $singletons

        // Additional complex bindings that need factory logic
        $this->app->when(InvoiceController::class)
            ->needs(ReportFormatter::class)
            ->give(PdfReportFormatter::class);
    }
}
```

### Package config merge
```php
public function register(): void
{
    parent::register();
    $this->mergeConfigFrom(__DIR__.'/../config/analytics.php', 'analytics');
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Register vs Boot Methods
- **Closely Related:** Service Container (bind vs singleton)
- **Advanced:** Contextual Binding (when properties don't suffice)
- **Cross-Domain:** Package Development (config publishing workflow)

## AI Agent Notes
- When `$bindings`/`$singletons` don't seem to work, check if `register()` calls `parent::register()`.
- `mergeConfigFrom()` is the correct way for packages to provide default config — not `Config::set()`.
- No meaningful difference between `$singletons` property and calling `$this->app->singleton()` — use whichever is cleaner.

## Verification
- [ ] Can use `$bindings`/`$singletons` properties correctly
- [ ] Understand why `parent::register()` is required for shortcuts
- [ ] Can explain `mergeConfigFrom()` and when to use it
- [ ] Know the limitations of properties (no closures, context, tagging)
- [ ] Can debug silent shortcut failure (parent::register() not called)
