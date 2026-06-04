# Skill: Create A Feature Service Provider

## Purpose

Build a Laravel service provider for a single feature that registers its routes, views, migrations, and container bindings — making the feature self-contained and toggleable.

## When To Use

- Creating a new feature that needs route, view, or migration registration
- Extracting registrations from a bloated `AppServiceProvider` into per-feature providers
- Adding a feature that publishes its own configuration

## When NOT To Use

- Features with zero routes, views, or migrations (no boot logic needed)
- Single-feature applications where `AppServiceProvider` is sufficient
- Features that consist only of simple service classes discovered by autoloading

## Prerequisites

- Feature directory exists at `app/Features/{Feature}/`
- Feature needs at least one of: routes, views, migrations, or container bindings
- Provider should be registered in `config/app.php` or auto-discovered

## Inputs

- Feature name (e.g., `Billing`)
- List of registrations needed: routes, views, migrations, bindings

## Workflow

1. Create `app/Features/{Feature}/Providers/{Feature}ServiceProvider.php` extending `ServiceProvider`
2. In `register()`, add only container bindings: `$this->app->bind(Interface::class, Implementation::class)`
3. In `boot()`, call `parent::boot()` as the first line
4. Add route loading: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
5. Add view loading: `$this->loadViewsFrom(__DIR__.'/../views', 'feature_name')` (if applicable)
6. Add migration loading: `$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations')` (if applicable)
7. Add config merging: `$this->mergeConfigFrom(__DIR__.'/../config.php', 'feature_name')` (if applicable)
8. Register the provider in `config/app.php` providers array
9. Verify with `php artisan route:list` and `php artisan tinker` to test bindings

## Validation Checklist

- [ ] Provider extends `ServiceProvider` (or deferred base)
- [ ] `register()` contains only container bindings — no framework interactions
- [ ] `boot()` calls `parent::boot()` first
- [ ] All paths use `__DIR__.'/../'` relative notation — no hardcoded paths
- [ ] `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()` in `boot()`
- [ ] Provider registered in `config/app.php` providers array
- [ ] `php artisan route:list` shows feature routes (if any)
- [ ] No business logic in provider — only registration

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Logic in `register()` | Misunderstanding lifecycle | Use `boot()` for framework interactions |
| Missing `parent::boot()` | Omission | Always call `parent::boot()` |
| Hardcoded paths | Using `app_path()` | Use `__DIR__.'/../'` |
| Provider not registered | Forgetting `config/app.php` | Verify with `route:list` |
| Circular provider dependency | A provider's boot depends on B | Order providers explicitly |

## Decision Points

- **Deferred vs Eager**: Use deferred (`$defer = true`) for providers that only register bindings. Use eager if the provider loads routes, views, or migrations.
- **Single provider vs Multiple**: One provider per feature is standard. Split only if the feature has truly independent sub-components with separate lifecycle needs.

## Performance Considerations

Each feature provider adds ~1-5ms to boot time. For 10 features, ~10-50ms. Deferred providers eliminate this cost if they only register bindings. Route and event caching further reduce overhead.

## Security Considerations

Service providers do not introduce security concerns. They register routes subject to the same middleware and auth. No special security considerations beyond standard provider practices.

## Related Rules

- Keep `register()` For Container Bindings Only (05-rules.md)
- Use Relative Paths In Provider Methods (05-rules.md)
- Never Put Business Logic In Service Providers (05-rules.md)
- Do Not Create One Giant Application Provider (05-rules.md)
- Always Call `parent::boot()` In Provider Overrides (05-rules.md)
- Order Providers Explicitly For Dependencies (05-rules.md)
- Defer Rarely-Used Feature Providers (05-rules.md)
- Cache Routes And Events In Production (05-rules.md)
- Document Provider Responsibilities In Feature README (05-rules.md)

## Related Skills

- Create A New Feature Scaffold
- Create And Register Feature Configuration
- Wire Cross-Feature Dependencies In Service Providers
- Create And Register Feature Routes

## Success Criteria

- Feature's routes, views, and migrations are registered and functional
- Container bindings resolve through the service container
- Feature can be disabled by removing its provider from `config/app.php`
- `php artisan route:list` shows feature routes
- `php artisan optimize` works without errors

---

# Skill: Convert A Standard Provider To A Deferred Provider

## Purpose

Reduce boot time overhead by converting a feature service provider that only registers container bindings into a deferred provider that is loaded only when its bindings are resolved.

## When To Use

- Feature service provider contains only `register()` bindings (no `boot()` logic)
- Feature is infrequently used (e.g., reporting, exports)
- Boot time optimization is needed for 10+ feature providers
- Feature has no routes, views, or migrations to load

## When NOT To Use

- Provider loads routes, views, or migrations in `boot()` (deferred providers don't boot)
- Feature is used on every request
- Provider has boot-time config validation

## Prerequisites

- Existing feature service provider with `register()` bindings
- Provider has no `boot()` logic or all boot logic can be eliminated
- List of abstract names the provider registers (for `provides()` method)

## Inputs

- Existing provider class
- Array of binding abstract names

## Workflow

1. Open the feature's service provider
2. Add `protected $defer = true;` to the class
3. Implement `public function provides(): array` returning all binding abstract names
4. Move any `boot()` logic (config validation, etc.) to the constructor of the service class or to a lazy initialization
5. Remove the `boot()` method if it is now empty
6. Verify resolution still works: `app(AbstractName::class)` returns the correct instance
7. Verify provider is not loaded on boot: monitor boot time before and after

## Validation Checklist

- [ ] `$defer = true` set on the provider
- [ ] `provides()` returns all binding abstract names
- [ ] No `boot()` method (or boot method removed)
- [ ] All bindings still resolve correctly through the container
- [ ] Provider is not loaded on requests that don't use its bindings
- [ ] Config validation moved to service constructor or lazy init

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Missing `provides()` | Forgetting to implement | Laravel throws error on missing method |
| Boot logic lost | Moving from `boot()` without migrating | Move to service constructor |
| Binding not in `provides()` | Overlooking a binding | List all `$this->app->bind()` calls |
| Deferred + routes | Provider has both routes and defer | Cannot defer if routes are loaded |

## Decision Points

- **Defer or not**: Defer if the feature is used in <50% of requests. Keep eager if feature is used on most requests.
- **Remove boot**: Config validation must move to the service's constructor. If validation is essential, consider keeping the provider eager.

## Performance Considerations

Deferred providers save ~1-5ms per provider per request. For 10 deferred providers, saving 10-50ms on requests that don't use those features.

## Security Considerations

Deferred providers execute their `register()` method when a binding is first resolved. Ensure no privileged operations happen during deferred registration that could be triggered by unauthenticated requests.

## Related Rules

- Defer Rarely-Used Feature Providers (05-rules.md)
- Keep `register()` For Container Bindings Only (05-rules.md)
- Never Put Business Logic In Service Providers (05-rules.md)

## Related Skills

- Create Feature Service Provider
- Wire Cross-Feature Dependencies In Service Providers

## Success Criteria

- Provider is not instantiated on boot (confirm via logging or profiling)
- Bindings still resolve when accessed
- No boot-time overhead for requests that don't use the feature
- `provides()` correctly lists all bindings
