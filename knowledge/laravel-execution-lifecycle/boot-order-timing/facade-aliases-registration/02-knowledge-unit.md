# Facade Aliases Registration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Facade aliases registration is the process by which Laravel registers short alias names for facade classes, enabling usage like `Cache::get()` without needing `use Illuminate\Support\Facades\Cache` import statements. This happens during the `RegisterFacades` bootstrapper step, which loads the `aliases` array from `config/app.php` and registers them via PHP's `class_alias()` through the `AliasLoader` system. The timing of this registration is critical — facades are unavailable before the `RegisterFacades` bootstrapper executes.

## Core Concepts
- **AliasLoader**: `Illuminate\Foundation\AliasLoader` — a custom autoloader that registers aliases lazily via `spl_autoload_register()`.
- **class_alias()**: PHP's built-in function that creates a class alias — `class_alias('Illuminate\Support\Facades\Cache', 'Cache')`.
- **config/app.php aliases array**: The configuration array that lists all facade aliases — key is the alias name, value is the facade class.
- **RegisterFacades bootstrapper**: The bootstrapper that initializes the alias system, typically the 4th bootstrapper to run.
- **Lazy alias loading**: Aliases are registered via autoloader rather than eagerly — the `class_alias()` call happens only when the alias class is first referenced.
- **Real-Time Facades**: Using `Facades\` prefix before any class name to create an on-the-fly facade without explicit alias registration.

## Mental Models
- **Nickname Registry**: Think of facades as having long formal names (`Illuminate\Support\Facades\Cache`) and short nicknames (`Cache`). The AliasLoader is the nickname registry — it maps nicknames to formal names.
- **Autoloader Hook Model**: The AliasLoader hooks into PHP's autoloading process. When PHP tries to load the class `Cache`, the AliasLoader intercepts, sees "Cache maps to Illuminate\Support\Facades\Cache," creates an alias, and lets the real autoloader load the facade class.
- **Phonebook Model**: The aliases array is a phonebook — you look up the short name (Cache) to find the full address (namespace + class). The AliasLoader is the directory assistance operator.

## Internal Mechanics
1. The `RegisterFacades` bootstrapper calls `Facade::clearResolvedInstances()` and `$app->withFacades()`.
2. `withFacades()` instantiates `AliasLoader` with the aliases array from `config('app.aliases')`.
3. `AliasLoader::register()` calls `spl_autoload_register([$this, 'load'], true, true)` — registering the `load()` method as an autoloader with the HIGHEST precedence (last parameter `true`).
4. When code references `Cache::get()`, PHP's autoloader chain runs. The AliasLoader's `load()` method fires first.
5. `load('Cache')` checks if 'Cache' exists in `$this->aliases`. If found, it calls `class_alias($facadeClass, 'Cache')` which creates the alias, and returns `true` to signal success.
6. The real autoloader then loads the actual facade class file (e.g., `Illuminate\Support\Facades\Cache`).
7. `Facade::getFacadeRoot()` resolves the underlying service from the container.

## Patterns
- **Hook Autoloader Pattern**: The AliasLoader plugs into PHP's autoloader chain to intercept class resolution and create aliases on-the-fly.
- **Lazy Initialization Pattern**: Aliases are not resolved eagerly — they're only activated when the alias class name is first referenced in code.
- **Precedence Autoloader Pattern**: The AliasLoader registers as the last autoloader (lowest priority) to avoid conflicting with Composer's PSR-4 autoloader — it only fires when other autoloaders have failed.

## Architectural Decisions
- **Why an autoloader hook instead of eager class_alias()?** Eagerly calling `class_alias()` for every alias on every request is wasteful — most aliases are never used on a given request. The autoloader hook ensures aliases are only created when referenced.
- **Why register as last autoloader?** The AliasLoader registers with `$prepend = false` (add to end of chain). This gives Composer's PSR-4 autoloader priority. The AliasLoader only fires when Composer cannot find the class — which is exactly when we need to try an alias.
- **Why an array in config/app.php?** The centralized aliases array makes all facades visible and configurable in one place. Users can see every available facade, add custom facades, or remove core facades they don't want.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Concise syntax without imports | Alias collisions possible | Two packages cannot register the same alias |
| Lazy loading — no cost for unused aliases | Autoloader hook adds ~0.001ms per alias on first use | Negligible overhead |
| Centralized alias registry | Aliases must be configured before bootstrap completes | Cannot add aliases dynamically at runtime |
| Full testability via Facade::fake() | Alias system is global state | Must clear resolved instances between tests |

## Performance Considerations
- The AliasLoader's `register()` method is called once per request (or once per worker under Octane).
- Each alias that is actually used pays ~0.001ms for the autoloader hook invocation.
- The `config('app.aliases')` array is typically small (50-100 entries) — negligible memory.
- Facade root resolution (`resolveFacadeInstance()`) happens once per facade per request — cached in a static array thereafter.
- Real-Time Facades use an additional autoloader hook — they intercept the `Facades\` namespace prefix before generating a facade class on the fly.

## Production Considerations
- Do not modify the aliases array at runtime — it must be configured before the `RegisterFacades` bootstrapper runs.
- If you add a custom facade, add it to `config/app.php` `aliases` and ensure the facade class is autoloadable.
- Alias collisions (two packages registering the same alias) are resolved by load order — the first alias registered wins in config/app.php, but the last autoloader registration wins in the chain.
- Under Octane, aliases are registered once per worker — they do not need per-request registration.

## Common Mistakes
- **Adding aliases in service provider boot()**: Aliases must be in `config/app.php` or registered via `$app->withFacades()` — runtime registration in boot() runs too late for autoloader integration.
- **Alias collision**: Two packages providing `Admin` facade — the last one registered wins, potentially silently.
- **Typo in alias target**: The alias value must be a valid facade class — a typo causes ClassNotFoundException at first use.
- **Removing core aliases**: Removing `Cache` or `DB` from aliases array breaks code that uses these facades without imports.

## Failure Modes
- **Alias not found**: First use of `Cache::get()` triggers autoloader → AliasLoader looks up 'Cache' in aliases → it's not there → returns false → PHP throws ClassNotFoundException.
- **class_alias() with non-existent class**: If the target facade class doesn't exist, `class_alias()` returns false silently — the alias is registered but points to nothing. Resolution fails when the facade root is accessed.
- **Real-Time Facade namespace collision**: A class named `Facades\App\Services\PaymentService` exists on disk and also matches the Real-Time Facade pattern — the on-disk class wins.

## Ecosystem Usage
- **Laravel core**: Provides 50+ built-in facade aliases covering Cache, DB, Log, Route, Event, Queue, Redis, etc.
- **Package authors**: Register custom aliases in their service provider's `boot()` method or via `config/app.php` in the package config publish.
- **Application developers**: Frequently add custom facades for application services, registered in `config/app.php` `aliases` array.

## Related Knowledge Units

### Prerequisites
- [Facade Architecture](../../dependency-injection/facade-architecture/02-knowledge-unit.md) — how the Facade base class resolves and proxies to the underlying service.

### Related Topics
- [Bootstrapper Sequence](../../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — where RegisterFacades runs in the bootstrap order.
- [Application Builder Configuration](../../application-bootstrap/application-builder-configuration/02-knowledge-unit.md) — how `withFacades()` configures the alias system.

### Advanced Follow-up Topics
- [Real-Time Facades](../../dependency-injection/facade-architecture/02-knowledge-unit.md) — on-the-fly facade generation without alias registration.
- [Service Container Aliases](../../service-container/container-aliases/02-knowledge-unit.md) — container aliases vs facade aliases.

## Research Notes
- The AliasLoader is at `Illuminate\Foundation\AliasLoader`. It implements `ArrayAccess` and `Countable` for alias array operations.
- The `withFacades()` call can be conditionally enabled — in Laravel 11+, facades are optional via the slim skeleton.
- `class_alias()` does NOT validate the target class exists — it only checks the alias name is valid.
- In Laravel 11+, the default aliases array was trimmed significantly — many facades that were once auto-aliased now require explicit import.
- Future direction: The framework may move toward import-based facade usage (explicit `use` statements) and away from the auto-aliasing pattern.
