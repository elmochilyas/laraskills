# Provider Properties Shortcuts

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Providers
- **Knowledge Unit:** Provider Properties Shortcuts
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
The `ServiceProvider` base class provides two declarative shortcuts — `$bindings` and `$singletons` properties — that let you register services with the container without writing any code in `register()`. A third shortcut, `mergeConfigFrom()`, simplifies merging package configuration with application defaults. These shortcuts reduce boilerplate but have specific behavioral characteristics and limitations that affect their appropriate use.

---

## Core Concepts
The `$bindings` property is an array of `interface => class` mappings. The `$singletons` property is identical but registers each binding as a singleton. When the provider is registered, `ServiceProvider` automatically iterates these properties and calls `$this->app->bind()` or `$this->app->singleton()` for each entry. This happens before `register()` is called, so `register()` can override any of these default bindings. The `mergeConfigFrom()` method, when called from `register()`, merges the package's default config file with the application's published config, ensuring that new config keys from package updates are available without overriding user customizations.

---

## Mental Models
Think of `$bindings` and `$singletons` as **declarative routing tables** vs the imperative route definitions in `register()`. They're analogous to Laravel's model casts — you declare what you want, and the framework handles the execution. This is a "configuration over code" pattern: less code to write, less code to test, fewer opportunities for bugs in `register()`.

---

## Internal Mechanics
In `Illuminate\Support\ServiceProvider`, the constructor does not process these properties. Instead, `ServiceProvider::register()` (the base implementation) calls `$this->registerBindings()`, which iterates `$bindings` and `$singletons` and calls the container accordingly. If a subclass overrides `register()` without calling `parent::register()`, the shortcuts are silently skipped. The `mergeConfigFrom()` method uses the application's config repository to merge the given file path with the existing config key, using `$app['config']->set()` after a recursive array merge.

---

## Patterns
- **Interface-to-implementation mapping**: `protected $bindings = [App\Contracts\PaymentGateway::class => App\Services\StripeGateway::class]`.
- **Singleton service registration**: `protected $singletons = [App\Services\Analytics::class => App\Services\Analytics::class]`.
- **Package config merge**: `$this->mergeConfigFrom(__DIR__.'/../config/analytics.php', 'analytics')` in a package provider.
- **Override in register()**: Declare defaults in properties, then override specific bindings in `register()` based on runtime conditions.

---

## Architectural Decisions
The declarative properties exist purely for developer ergonomics — they reduce the boilerplate of writing trivial `register()` methods. The decision to process them in the base `register()` (rather than before it) was deliberate: it allows subclasses to override defaults while still benefiting from the shorthand. The `mergeConfigFrom()` pattern exists to solve a specific package distribution problem: packages need default config, but users need to override it without losing new keys on package updates.

---

## Tradeoffs
- **Convenience vs. control**: Properties are easy but inflexible — no conditional logic, no factory closures. For complex bindings (contextual, tagged, with `when()->needs()->give()`), you must use the full `register()` method.
- **Hidden behavior**: Properties are processed by `parent::register()`. If you override `register()` without calling parent, the shortcuts silently don't work — a common source of bugs.
- **Documentation clarity**: Bindings in properties are less visible than code in `register()`. Developers reading the provider may miss them.

---

## Performance Considerations
Properties are processed once during `register()`, adding negligible overhead (array iteration + container method calls). The `mergeConfigFrom()` method merges arrays at registration time, which is slightly more expensive than a hard-coded config array but necessary for package compatibility. Neither pattern has meaningful performance implications — the performance concern is what the bindings do when resolved, not how they're registered.

---

## Production Considerations
When using `$bindings`/`$singletons` in packages, document them explicitly in the package README so users know which services are registered. For `mergeConfigFrom()`, always publish config to `config/` so users can customize. Note that `mergeConfigFrom()` runs on every request unless config is cached — with `php artisan config:cache`, the merge happens once and is serialized.

---

## Common Mistakes
- Overriding `register()` without calling `parent::register()` — `$bindings` and `$singletons` never take effect.
- Using `$bindings` and `$singletons` with concrete class names that don't exist — the error only surfaces when the service is resolved.
- Calling `mergeConfigFrom()` after the config has already been cached — the merge still happens but is redundant.
- Forgetting the `$singletons` property exists and manually calling `$this->app->singleton()` in `register()` — works, but misses the declarative convenience.

---

## Failure Modes
- **Silent shortcut failure**: If a provider overrides `register()` without calling parent, all property-based bindings silently disappear. The error manifests as "Target class does not exist" when the service is resolved.
- **Config merge conflict**: If two packages both merge config to the same key with different structures, the second merge overwrites parts of the first, leading to unexpected config values.
- **Property override in subclasses**: If a subclass re-declares `$bindings`, it replaces the parent's array entirely (not merged). Use constructor-based merging for inheritance scenarios.

---

## Ecosystem Usage
Many Laravel packages use `$bindings` and `$singletons` for straightforward interface bindings. For example, `spatie/laravel-permission` uses properties for its core services. Packages universally use `mergeConfigFrom()` to provide default configuration. First-party packages like `laravel/sanctum` use `mergeConfigFrom()` for their config defaults. The properties are especially common in packages that follow the "configuration over convention" approach.

---

## Related Knowledge Units
### Prerequisites
- provider-fundamentals (base ServiceProvider class)
- register-vs-boot-methods (parent::register() requirement for shortcuts)
- Service Container Bindings (what $bindings/$singletons populate)

### Related Topics
- Service Container Bindings (bind vs singleton distinction)
- Config Repository (mergeConfigFrom interaction with config repository)
- register-vs-boot-methods (how properties interact with register() override)

### Advanced Follow-up Topics
- Contextual binding in providers (when()/needs()/give() patterns)
- Package config publishing workflow
- Boot Order Timing (when property-based bindings are processed relative to register())

---

## Research Notes
### Source Analysis
`Illuminate\Support\ServiceProvider::register()` calls `registerBindings()`. `Illuminate\Support\ServiceProvider::registerBindings()` iterates `$bindings` and `$singletons`. `Illuminate\Support\ServiceProvider::mergeConfigFrom()` at `src/Illuminate/Support/ServiceProvider.php`.
### Key Insight
The declarative properties (`$bindings`, `$singletons`) are processed in `parent::register()`. If you override `register()` without calling parent, they silently do nothing. This is the most common bug with these shortcuts.
### Version-Specific Notes
These properties have existed since early Laravel 5.x. The `$singletons` property was added in Laravel 5.8. The behavior is consistent across all supported Laravel versions.
