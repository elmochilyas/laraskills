# ku-05: Facade Aliases Registration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-05-facade-aliases-registration
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Facade aliases are registered by the `RegisterFacades` bootstrapper during the kernel bootstrap pipeline (step 4 of 6). This bootstrapper loads the `aliases` array from `config/app.php` and registers each alias via `class_alias()`, allowing facades to be used without explicit `use` imports. The timing of this registration is critical — facades are not available before `RegisterFacades` runs, and in console mode, this bootstrapper is omitted entirely.

## Core Concepts
- **RegisterFacades bootstrapper**: The 4th of 6 kernel bootstrappers. Runs after `HandleExceptions` and before `RegisterProviders`.
- **AliasLoader**: `Illuminate\Foundation\AliasLoader` manages lazy alias loading. It registers as the last autoloader via `spl_autoload_register()`.
- **class_alias()**: PHP's built-in function that creates a class alias. When the alias class name is used, the autoloader loads the real class.
- **Lazy loading**: Aliases are loaded lazily — the `class_alias()` call only defines the alias; the actual facade class file is loaded on first use.
- **Console exclusion**: `RegisterFacades` is NOT in the Console kernel's bootstrapper list. Console commands must import facades explicitly.
- **Alias registration in config/app.php**: The `aliases` array maps short names to facade class names.

## When To Use
- Registering custom facades in the `aliases` array for packages and application facades.
- Using `AliasLoader::getInstance()->alias('Foo', FooFacade::class)` for dynamic alias registration.
- When you need to use facades without `use` statements in any PHP file.
- For package facades that should be available globally.

## When NOT To Use
- In console commands where facades can be explicitly imported.
- Before the `RegisterFacades` bootstrapper has executed (e.g., in `register()` of a provider that runs before facades — though this is uncommon).
- For classes that should have explicit dependency declarations — prefer constructor injection over facade aliases for business logic.
- When alias collisions may occur — two packages registering the same alias name.

## Best Practices (WHY)
- **Import facades explicitly in production code**: While aliases reduce boilerplate, explicit imports (`use Illuminate\Support\Facades\Cache`) make dependencies clear and avoid alias collisions.
- **Place custom aliases at the end of the aliases array**: To avoid overriding framework aliases with custom ones accidentally.
- **Never register aliases in service provider `register()`**: Use `config/app.php` `aliases` array for static alias registration. Dynamic aliases via `AliasLoader` should be rare.
- **Use Real-Time Facades for custom services**: The `Facades\` prefix convention eliminates the need to register individual aliases for each service class.

## Architecture Guidelines
- The `aliases` array in `config/app.php` is the centralized registry for all facade aliases.
- Laravel's core aliases are registered in `Application::registerCoreContainerAliases()` — these map to core services.
- Custom aliases should follow the naming convention: short, descriptive, matching the service name.
- For large applications, keep the aliases array minimal — each alias adds autoloader overhead on first use.

## Performance
- Alias registration is a single `class_alias()` call per entry — negligible cost (~0.5-2µs per alias).
- First use of an alias triggers autoloader resolution — the facade class file is loaded and the container resolves the underlying service.
- Aliases that are never used on a request add zero cost (lazy loading).
- Console kernel skips alias registration entirely (5 bootstrappers vs 6), saving ~5-15ms on console boot.

## Security
- Alias collisions can cause one facade to silently mask another. PHP's `class_alias()` does not warn on redefinition.
- In shared hosting or multi-tenant apps, alias collisions between packages can lead to unexpected behavior or information disclosure.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Alias collision | Two packages register the same alias (e.g., both provide `Cache`) | Package authors choose common names | One alias silently overrides the other | Check alias uniqueness; use longer names |
| Console alias missing | Facade not available in artisan command | RegisterFacades bootstrapper not run in console | Class not found error | Import facade explicitly with `use` statement |
| Alias in register() | Calling `AliasLoader::alias()` in provider register() | Calling too early in lifecycle | Works but fragile — order-dependent | Use config/app.php aliases array |
| Stale alias after rename | Changed facade class but not updated aliases | Forgetting to update config | Old class not found on first alias use | Test alias resolution after changes |

## Anti-Patterns
- **Alias sprawl**: Registering aliases for every service class — defeats the purpose of explicit dependency injection.
- **Dynamic alias registration in boot()**: Registering aliases at boot time breaks the centralized alias management and makes aliases hard to discover.
- **Alias for non-facade classes**: Using `AliasLoader` to create aliases for classes that aren't facades — confuses the purpose of the alias system.

## Examples
```php
// config/app.php
'aliases' => [
    'App' => Illuminate\Support\Facades\App::class,
    'Artisan' => Illuminate\Support\Facades\Artisan::class,
    'Auth' => Illuminate\Support\Facades\Auth::class,
    // Custom aliases
    'Payment' => App\Facades\Payment::class,
    'Analytics' => App\Facades\Analytics::class,
],

// Dynamic alias (rare)
AliasLoader::getInstance()->alias('MyAlias', MyFacade::class);
```

## Related Topics
- Bootstrapper Sequence — where RegisterFacades fits in the 6-bootstrapper pipeline
- Console vs HTTP Boot — why facades are excluded from console boot
- Facade Architecture — how facade aliases resolve to container services
- Register Core Container Aliases — the `app()`, `container` aliases registered in Application constructor

## AI Agent Notes
- The `RegisterFacades` bootstrapper is at `Illuminate\Foundation\Bootstrap\RegisterFacades`.
- To add a console-only facade, register it in the console kernel's `bootstrappers` property or import explicitly.
- Alias resolution can be traced via `AliasLoader::$aliases` array.
- `Facade::clearResolvedInstance()` clears the cached facade root — important for Octane request isolation.

## Verification
- [ ] All aliases in `config/app.php` point to valid facade classes
- [ ] No alias collisions between packages or application code
- [ ] Console commands import facades explicitly or have `RegisterFacades` added to bootstrapper list
- [ ] Custom aliases are registered in `config/app.php`, not dynamically in providers
- [ ] Alias registration works after `php artisan config:cache`
