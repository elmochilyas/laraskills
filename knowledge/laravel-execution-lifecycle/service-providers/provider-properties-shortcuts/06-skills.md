# Skill: Use $bindings and $singletons Declarative Shortcuts

## Purpose

Register simple interface-to-implementation and class-to-class bindings using the declarative `$bindings` and `$singletons` properties on `ServiceProvider`, reducing boilerplate code in `register()`.

## When To Use

- Simple, direct interface-to-implementation mappings with no factory logic.
- Self-binding singletons: `protected $singletons = [MyService::class => MyService::class]`.
- Providers with a mix of simple bindings (properties) and complex bindings (in `register()`).
- Package providers registering defaults.

## When NOT To Use

- Bindings that need factory closures, contextual binding (`when->needs->give`), or tagging.
- Bindings that require conditional logic based on configuration or environment.
- When `register()` is already overridden and `parent::register()` will not be called.

## Prerequisites

- Understanding of `bind` vs `singleton` in the service container
- Provider Fundamentals (register method, two-phase model)

## Inputs

- Interface name (key)
- Concrete class name (value)
- Whether binding should be shared (singleton) or not

## Workflow

1. Declare the property on the provider class:
   ```php
   protected $bindings = [
       PaymentGateway::class => StripeGateway::class,
   ];

   protected $singletons = [
       PaymentLogger::class => PaymentLogger::class,
   ];
   ```
2. If overriding `register()`, call `parent::register()` at the top to process properties:
   ```php
   public function register(): void
   {
       parent::register();
       // Additional complex bindings
   }
   ```
3. Verify each binding exists: `$this->assertTrue($app->bound(PaymentGateway::class))`.
4. If a subclass extends this provider, manually merge arrays if parent bindings should be preserved.

## Validation Checklist

- [ ] `$bindings` array keys are interfaces/abstracts, values are concretes
- [ ] `$singletons` array follows the same pattern (self-binding or interface→concrete)
- [ ] `parent::register()` called if `register()` is overridden
- [ ] Each key listed in properties is actually registered — verified via `$app->bound()`
- [ ] No factory closures, contextual bindings, or tagging used in properties (these don't work)
- [ ] Subclass bindings are not lost — manually merged if parent bindings should be preserved

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Properties have no effect | `register()` overridden without `parent::register()` call |
| Parent bindings lost in subclass | Subclass redeclares `$bindings` replacing parent's array |
| Contextual binding doesn't work | Using `$bindings` for `when()->needs()->give()` patterns |
| "Class does not exist" error | Typo in class name string in property array |

## Decision Points

- **Property vs Code**: Simple key-value mapping with no factory logic → property. Any runtime logic, closures, or conditional binding → `register()` code.
- **$bindings vs $singletons**: Should every resolution return the same instance? → `$singletons`. New instance per resolution? → `$bindings`.

## Performance Considerations

- Property iteration adds negligible overhead — array iteration + container method calls.
- No meaningful performance difference vs writing the same bindings in `register()`.
- `mergeConfigFrom()` runs on every request unless config is cached.

## Security Considerations

- Declarative bindings in properties are less visible than code in `register()` — audit package properties for security-relevant overrides.
- Properties cannot express authorization or conditional security logic.

## Related Rules

- Rule 1: Always Call `parent::register()` When Overriding `register()`
- Rule 2: Use `$bindings` and `$singletons` Only for Simple Mappings Without Factory Logic
- Rule 3: Use `mergeConfigFrom()` for Package Config Defaults in `register()`
- Rule 4: Never Redeclare `$bindings` in a Subclass Expecting Array Merge

## Related Skills

- Create and Register a Service Provider
- Merge Package Configuration with mergeConfigFrom()

## Success Criteria

- Simple bindings are registered declaratively without `register()` code.
- `parent::register()` is called, properties take effect.
- Complex bindings remain in `register()` code — correct separation.
- Subclass bindings work as intended (parent bindings preserved when needed).
---

# Skill: Merge Package Configuration with mergeConfigFrom()

## Purpose

Provide default configuration values from a package's config file while allowing the application to override specific settings, using `mergeConfigFrom()` in the provider's `register()` method.

## When To Use

- Package development — providing default configuration for package users.
- Merging configuration from one config file into an existing config key.
- Ensuring new config keys from package updates are available without removing user customizations.

## When NOT To Use

- When config caching is not used and performance isn't a concern (still place in `register()` for correctness).
- When you need to override application config values (use the application's config file, not `mergeConfigFrom()`).
- When configuring the application itself (not a package).

## Prerequisites

- Understanding of Laravel configuration system and `config()` helper
- Register vs Boot method distinction

## Inputs

- Path to package config file
- Config key to merge into
- The provider class

## Workflow

1. Create the package config file (e.g., `config/analytics.php`):
   ```php
   return [
       'driver' => 'google',
       'tracking_id' => '',
       'enabled' => true,
   ];
   ```
2. In the provider's `register()` method, call `mergeConfigFrom()`:
   ```php
   public function register(): void
   {
       parent::register();
       $this->mergeConfigFrom(
           __DIR__.'/../config/analytics.php',
           'analytics'
       );
   }
   ```
3. Application can now override specific keys via published config:
   ```php
   // config/analytics.php (published)
   return [
       'tracking_id' => 'UA-12345-6', // Only override what you need
   ];
   ```
4. Verify merged config is accessible: `config('analytics.tracking_id')`.

## Validation Checklist

- [ ] `mergeConfigFrom()` called in `register()`, not `boot()`
- [ ] Config file path is correct (relative to provider file)
- [ ] Config key matches the one used to access values
- [ ] Application overrides take precedence over defaults
- [ ] New keys from package updates are available (recursive merge, not replace)
- [ ] Config caching works: `php artisan config:cache` completes without error

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Config values not available | `mergeConfigFrom()` called in `boot()` instead of `register()` |
| Application overrides lost | Config merge not working — check the merge is recursive, not array replace |
| New config keys missing after update | `mergeConfigFrom()` called correctly but config cache stale — rebuild |
| "File not found" error | Path to config file is wrong — use `__DIR__` relative to provider |

## Decision Points

- **register() vs boot()**: Always `register()` — config caching calls `register()` before `boot()`; merging in `boot()` means the merge may not persist with cached config.
- **mergeConfigFrom vs Config::set**: `mergeConfigFrom()` is recursive merge (preserves user overrides). `Config::set()` replaces entirely.

## Performance Considerations

- `mergeConfigFrom()` runs on every request without config cache — negligible cost (array merge).
- With `php artisan config:cache`, the merge happens once during caching — zero runtime cost.
- Always test with config caching since that's where placement matters most.

## Security Considerations

- Ensure package config doesn't override security-critical application config keys (e.g., `app.key`, `auth.providers`).
- Package config files should provide safe defaults — never include secrets.
- Published config files should be in `.gitignore` if they contain environment-specific secrets.

## Related Rules

- Rule 3: Use `mergeConfigFrom()` for Package Config Defaults in `register()`

## Related Skills

- Use $bindings and $singletons Declarative Shortcuts
- Create and Register a Service Provider

## Success Criteria

- Package configuration defaults are available via `config()` helper.
- Application overrides take precedence over package defaults.
- New configuration keys from package updates appear without removing user customizations.
- Config caching works correctly with the merged configuration.
