# Base Bindings and Core Aliases — Rules

## Rule Name
Never unset or remove core aliases from the container.
---
## Category
Reliability
---
## Rule
Do not call `$app->offsetUnset()`, `unset($app[$key])`, or any reflection-based removal of entries from the `$aliases` array.
---
## Reason
The container does not support alias removal. Removing a resolved alias leaves dangling references in `$this->resolved` and `$this->aliases`, creating an inconsistent state where the alias key exists as resolved but points to a non-existent binding. Facade resolution may then return stale or incorrect instances.
---
## Bad Example
```php
// Attempting to remove the 'auth' alias via reflection:
$reflection = new ReflectionProperty(Application::class, 'aliases');
$reflection->setAccessible(true);
$aliases = $reflection->getValue($app);
unset($aliases['auth']);
$reflection->setValue($app, $aliases);
```
---
## Good Example
```php
// Override behavior by rebinding the abstract, not removing the alias:
$app->singleton('auth', function ($app) {
    return new CustomAuthFactory;
});
```
---
## Exceptions
No common exceptions. Aliases are considered immutable once the constructor chain completes.
---
## Consequences Of Violation
Inconsistent container state — `$app->resolved('auth')` returns `true` but `$app->make('auth')` throws or returns an unexpected result. Memory leaks from unresolved reference chains.

---

## Rule Name
Register custom aliases at runtime with `$app->alias()`, never by modifying the static `$aliases` array.
---
## Category
Maintainability
---
## Rule
Use `$app->alias($abstract, $alias)` in service providers for runtime alias registration. Do not modify `Application::$aliases` directly via reflection or inheritance.
---
## Reason
The static `$aliases` property is shared across all Application instances in the same PHP process (including all Octane workers). Modifying it at runtime causes side effects in other workers. `$app->alias()` safely registers the alias on the current instance without global mutation.
---
## Bad Example
```php
// In a service provider:
Application::$aliases['stripe-client'] = StripeClient::class;
// Modifies the static array globally — affects all workers in Octane
```
---
## Good Example
```php
// In a service provider:
$app->alias(StripeClient::class, 'stripe-client');
// Safe — registers alias only on this Application instance
```
---
## Exceptions
Registering aliases in the Application constructor chain (framework internals) uses the static array intentionally for performance.
---
## Consequences Of Violation
In Octane, one worker's alias registration leaks to all other workers, causing alias collisions and unpredictable resolution behavior across requests.

---

## Rule Name
Always use `$app->bound()` to test resolvability, not alias existence.
---
## Category
Reliability
---
## Rule
Check `$app->bound('config')` when you need to know if a service can be resolved. Do not rely on `in_array('config', $app->getAliases())` or facade availability.
---
## Reason
An alias is a secondary name pointing to an abstract — it does not guarantee that the abstract has a binding. Core aliases like `'config'`, `'auth'`, and `'cache'` exist immediately after construction, but their bindings are registered later by bootstrappers. Alias existence ≠ resolvability.
---
## Bad Example
```php
// Assumes alias existence means resolvable:
if ($app->isAlias('config')) {
    $config = $app->make('config'); // BindingResolutionException before LoadConfiguration runs
}
```
---
## Good Example
```php
// Checks actual binding:
if ($app->bound('config')) {
    $config = $app->make('config');
} else {
    // Config not yet loaded — handle gracefully
}
```
---
## Exceptions
When writing code that always runs after all bootstrappers (e.g., controller constructors), `$app->bound()` check is redundant — but still safer.
---
## Consequences Of Violation
`BindingResolutionException` for valid-seeming alias lookups. Silent `null` returns if code uses `$app['config'] ?? []` syntax.

---

## Rule Name
Prefix custom facade aliases with a unique namespace to avoid core alias collisions.
---
## Category
Maintainability
---
## Rule
Use a unique, package-prefixed key for custom aliases (e.g., `'stripe-client'`), never single-word keys that may collide with Laravel core aliases.
---
## Reason
The core aliases array contains ~70 single-word entries (`'auth'`, `'cache'`, `'db'`, `'events'`, `'log'`, `'queue'`, etc.). Registering an alias with a colliding key silently shadows the existing alias — the last registration wins with no warning. Single-word collision risk grows with each Laravel release.
---
## Bad Example
```php
// Risk of collision with a future Laravel core alias:
$app->alias(MySearchService::class, 'search');
```
---
## Good Example
```php
// Unique prefix prevents collision:
$app->alias(MySearchService::class, 'acme-search');
```
---
## Exceptions
Aliases registered internally by the framework (in `registerCoreContainerAliases()`) are exempt from the prefix requirement as they own the namespace.
---
## Consequences Of Violation
Silent alias shadowing: your alias registration succeeds but may be overwritten by a future Laravel update that adds the same key, or your alias overwrites a core alias, breaking framework facade resolution.

---

## Rule Name
Never register a binding with the same abstract key as a core alias.
---
## Category
Reliability
---
## Rule
Avoid binding a concrete class or value to an abstract key that matches an existing core alias (e.g., `'app'`, `'events'`, `'log'`, `'router'`, `'config'`).
---
## Reason
When an alias and a binding share a key, the alias is shadowed. Container resolution goes to the binding directly, bypassing the alias's target. This breaks facade resolution (facades resolve through aliases) and any code that expects the alias to point to its original contract.
---
## Bad Example
```php
// Binding over the 'events' alias:
$app->bind('events', function () {
    return new CustomEventDispatcher;
});
// Now Facade::resolvedInstance('events') resolves the binding, not the alias
// Any code type-hinting EventDispatcherContract breaks
```
---
## Good Example
```php
// Extend the service by rebinding the contract, not the alias:
$app->extend(Illuminate\Contracts\Events\Dispatcher::class, function ($dispatcher, $app) {
    return new CustomEventDispatcher($dispatcher);
});
```
---
## Exceptions
Framework internals that intentionally replace core services (e.g., Octane replaces the event dispatcher) do so at the contract level, not the alias key level.
---
## Consequences Of Violation
Facade resolution returns unexpected implementations. Code that resolves by alias string vs by contract interface returns different instances. Hard-to-trace inconsistencies in service behavior.
