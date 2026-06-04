# Container Aliases — Rules

## Register Alias in the Same Provider as the Target Binding
---
## Category
Code Organization
---
## Rule
Always register an alias in the same service provider that registers the target binding.
---
## Reason
Separating alias registration from binding registration creates a temporal dependency window: if the alias provider runs before the binding provider, `make('alias')` throws `BindingResolutionException` even though the binding is registered. Co-locating them ensures atomic availability.
---
## Bad Example
```php
// ProviderA — Registers binding
class BindingProvider extends ServiceProvider {
    public function register(): void {
        $this->app->singleton(PaymentManager::class);
    }
}

// ProviderB — Registers alias (may run before or after ProviderA)
class AliasProvider extends ServiceProvider {
    public function register(): void {
        $this->app->alias(PaymentManager::class, 'payments');
    }
}
```
---
## Good Example
```php
class PaymentServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->singleton(PaymentManager::class);
        $this->app->alias(PaymentManager::class, 'payments');
    }
}
```
---
## Exceptions
Package aliases that must override core aliases — registered in a separate `AliasServiceProvider` with documented ordering.
---
## Consequences Of Violation
Reliability: intermittent `BindingResolutionException` depending on provider registration order.

---

## Avoid Creating Circular Alias Chains
---
## Category
Reliability
---
## Rule
Ensure alias chains form a directed acyclic graph (DAG) — every alias must ultimately resolve to a non-alias binding.
---
## Reason
Circular aliases (A → B → A) cause infinite recursion in `getAlias()`, resulting in a PHP stack overflow (`Maximum function nesting level`) rather than a container exception. The container does not detect circular aliases — the crash appears as a PHP error, not a container exception.
---
## Bad Example
```php
$this->app->alias('cache', 'cache.store');
$this->app->alias('cache.store', 'cache'); // Circular: cache → cache.store → cache
// make('cache') causes: PHP Fatal error: Maximum function nesting level
```
---
## Good Example
```php
$this->app->singleton(CacheManager::class);
$this->app->alias(CacheManager::class, 'cache');
$this->app->alias(CacheManager::class, 'cache.store');
// Both aliases resolve to CacheManager — no cycle
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: PHP stack overflow with confusing error message unrelated to container aliases. Debugging: difficult to trace the cause without alias chain inspection.

---

## Use Canonical Name for bound() and forgetInstance() Checks
---
## Category
Reliability
---
## Rule
Use the canonical abstract name (not an alias) when calling `$app->bound()` or `$app->forgetInstance()`.
---
## Reason
`bound()` returns `true` for aliases (aliases are stored as pseudo-bindings in the same array), but `forgetInstance('alias')` may not clear the instance stored under the canonical name. Operations that depend on the true binding identity should use the resolved canonical abstract.
---
## Bad Example
```php
$this->app->alias(CacheManager::class, 'cache');

if ($this->app->bound('cache')) { // True — but it's an alias, not a binding
    $this->app->forgetInstance('cache'); // May not clear CacheManager's instance
}
```
---
## Good Example
```php
$this->app->alias(CacheManager::class, 'cache');
$canonical = $this->app->getAlias('cache'); // Returns CacheManager::class

$this->app->forgetInstance($canonical); // Clears the correct instance
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: `forgetInstance()` silently fails to clear instances, causing stale cached objects to persist.

---

## Prefer Interface Type-Hints Over Aliases for Dependency Injection
---
## Category
Code Organization
---
## Rule
Type-hint the contract interface or class FQCN in constructors and use aliases only for Facade access and convenience accessors.
---
## Reason
Aliases obscure which service is actually being resolved at the injection point. A constructor type-hinting `'cache'` string is opaque — it could resolve to anything. Type-hinting `CacheManager::class` is explicit and supports static analysis, IDE navigation, and refactoring tools.
---
## Bad Example
```php
class ReportService {
    public function __construct(
        protected string $cacheKey // Not a service
    ) {}

    public function generate(): void {
        $cache = app('cache'); // Opague string alias — which class?
        $cache->get($this->cacheKey);
    }
}
```
---
## Good Example
```php
class ReportService {
    public function __construct(
        protected CacheManager $cache // Explicit type — IDE navigable
    ) {}

    public function generate(): void {
        $this->cache->get('report.cache');
    }
}
// Alias 'cache' still works for Facades and helpers
```
---
## Exceptions
Facade accessor methods and array-access usage in legacy code where type-hints cannot be added.
---
## Consequences Of Violation
Maintainability: dependencies hidden behind string aliases, invisible to static analysis and refactoring tools.

---

## Test All Aliases Resolve Correctly in CI
---
## Category
Testing
---
## Rule
Write a CI test that resolves every registered alias and verifies the resolved instance type.
---
## Reason
Aliases are pointers to bindings. A dangling alias (alias without a target binding) only throws at resolution time, not registration time. A CI test that resolves all aliases catches dangling aliases and incorrect alias chains before deployment.
---
## Bad Example
```php
// Alias registered but binding removed in refactor — unnoticed until runtime
$this->app->alias(RemovedService::class, 'old-service');
// make('old-service') throws BindingResolutionException
```
---
## Good Example
```php
class AliasTest extends TestCase {
    public function test_all_aliases_resolve(): void {
        $container = $this->app;
        $reflection = new ReflectionClass($container);
        $abstractAliases = $reflection->getProperty('abstractAliases');
        $abstractAliases->setAccessible(true);

        foreach ($abstractAliases->getValue($container) as $abstract => $aliases) {
            $instance = $container->make($abstract);
            foreach ($aliases as $alias) {
                $aliasInstance = $container->make($alias);
                $this->assertSame($instance, $aliasInstance,
                    "Alias [$alias] resolves to a different instance than [$abstract]"
                );
            }
        }
    }
}
```
---
## Exceptions
Aliases pointing to abstracts that require contextual parameters — skip or mock context.
---
## Consequences Of Violation
Reliability: dangling aliases undetected until the specific alias is used in production.

---

## Avoid Overriding Core Aliases Without Documentation
---
## Category
Maintainability
---
## Rule
Document and audit any override of a core Laravel alias (e.g., 'db', 'cache', 'config') — verify no packages depend on the original mapping.
---
## Reason
Core aliases (registered in `registerCoreContainerAliases()`) map ~40 short keys to framework service FQCNs. Overriding a core alias changes resolution for every component and third-party package that resolves through that alias. Substituting `'db'` to resolve to a custom class breaks packages expecting the original `DatabaseManager`.
---
## Bad Example
```php
// Overrides core alias without documentation
public function register(): void {
    $this->app->alias(CustomDatabaseManager::class, 'db');
    // All packages using app('db') now get CustomDatabaseManager
}
```
---
## Good Example
```php
/**
 * Core Alias Override: 'db'
 * 
 * Overrides the default 'db' alias to resolve CustomDatabaseManager.
 * Impact: All resolve('db') and app('db') calls return the custom class.
 * Verified compatible packages: PackageA, PackageB.
 * Incompatible: PackageC — requires workaround via Container::bind() override.
 */
public function register(): void {
    $this->app->alias(CustomDatabaseManager::class, 'db');
}
```
---
## Exceptions
No common exceptions in application code — only acceptable in framework-level customization with full audit.
---
## Consequences Of Violation
Maintainability: unexplained breakage in third-party packages. Reliability: unexpected behavior changes across the application.
