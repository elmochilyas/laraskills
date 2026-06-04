# Binding Extending — Rules

## Register the Target Binding Before Calling extend()
---
## Category
Framework Usage
---
## Rule
Always ensure a binding exists for the abstract before calling `$app->extend()`.
---
## Reason
`extend()` requires a pre-existing binding. Calling it without a registered binding throws `BindingResolutionException` because there is no underlying definition to decorate.
---
## Bad Example
```php
// No binding registered for PaymentGateway
$this->app->extend(PaymentGateway::class, function ($gateway, $app) {
    return new LoggingPaymentGateway($gateway);
});
// Throws: BindingResolutionException
```
---
## Good Example
```php
$this->app->bind(PaymentGateway::class, StripeGateway::class);

$this->app->extend(PaymentGateway::class, function ($gateway, $app) {
    return new LoggingPaymentGateway($gateway);
});
```
---
## Exceptions
When extending an auto-resolved class after ensuring it has a self-binding via `$app->bind(Concrete::class)`.
---
## Consequences Of Violation
Reliability: runtime exception during provider boot. Deployments fail at application startup.

---

## Return a Decorator Instance, Not a Modification
---
## Category
Code Organization
---
## Rule
Always wrap the resolved instance in a decorator class when using `extend()`, returning a new object rather than mutating the original.
---
## Reason
Returning the original instance with modified properties is non-composable — subsequent extenders receive the mutated instance, making decoration order-dependent and preventing clean stacking. A decorator wrapping the original preserves composability and supports multiple independent extenders.
---
## Bad Example
```php
$this->app->extend(OrderProcessor::class, function ($processor, $app) {
    $processor->enableLogging(); // Mutates the original — non-composable
    return $processor;
});
```
---
## Good Example
```php
$this->app->extend(OrderProcessor::class, function ($processor, $app) {
    return new LoggingOrderProcessor(
        $processor,
        $app->make(LoggerInterface::class)
    );
});
// Multiple extenders can stack independently
```
---
## Exceptions
Environment-specific configuration (e.g., `enableQueryLog()` in debug mode) where no stacking is expected and the change is idempotent.
---
## Consequences Of Violation
Maintainability: extender ordering becomes brittle. Scalability: cannot add new extenders without risk of breaking existing ones.

---

## Avoid Making Inside extend() on the Same Abstract
---
## Category
Reliability
---
## Rule
Use the resolved instance parameter passed to the extender closure rather than calling `$app->make()` on the same abstract inside `extend()`.
---
## Reason
Calling `make()` on the same abstract from within an extender triggers re-resolution, creating a recursive resolution loop or returning an undecorated instance. The extender receives the freshly-resolved instance as its first parameter — use it directly.
---
## Bad Example
```php
$this->app->extend(CacheManager::class, function ($manager, $app) {
    $original = $app->make(CacheManager::class); // Re-resolution — infinite loop or undecorated instance
    return new TtlAwareCache($original);
});
```
---
## Good Example
```php
$this->app->extend(CacheManager::class, function ($manager, $app) {
    return new TtlAwareCache($manager); // Use the passed instance
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: infinite recursion, stack overflow, or silent return of undecorated instance.

---

## Order Extenders from Generic to Specific
---
## Category
Code Organization
---
## Rule
Register extenders with the most generic behavior first and most specific behavior last.
---
## Reason
Later extenders wrap earlier ones. The last extender runs closest to the consumer. If a monitoring extender wraps a caching extender, the monitoring layer sees cached results. Ordering from generic (logging, monitoring) to specific (business logic wrappers) produces intuitive call stacks.
---
## Bad Example
```php
// Specific before generic — metrics see raw calls, not retry-wrapped
$this->app->extend(ApiClient::class, RetryClient::class);    // Specific
$this->app->extend(ApiClient::class, MetricCollector::class); // Generic
```
---
## Good Example
```php
// Generic first, specific last — metrics wrap retries
$this->app->extend(ApiClient::class, MetricCollector::class); // Generic
$this->app->extend(ApiClient::class, RetryClient::class);     // Specific
```
---
## Exceptions
Framework-required ordering documented in the package's integration guide.
---
## Consequences Of Violation
Reliability: incorrect decoration semantics (e.g., monitoring records retry-caused duplicates as separate calls).

---

## Avoid Stateful Extender Closures
---
## Category
Reliability
---
## Rule
Do not capture mutable request-scoped state within extender closures.
---
## Reason
Extender closures execute during resolution, which for singletons and scoped bindings happens once per lifetime. A stateful closure capturing mutable request data produces non-deterministic decoration because the captured state is frozen at resolution time, not at request time.
---
## Bad Example
```php
$this->app->extend(SearchClient::class, function ($client, $app) {
    $tenantId = $app->make(TenantContext::class)->id(); // Captured at resolution
    return new TenantScopedClient($client, $tenantId); // Frozen tenant — wrong for subsequent requests
});
```
---
## Good Example
```php
$this->app->extend(SearchClient::class, function ($client, $app) {
    return new TenantScopedClient($client, $app->make(TenantContext::class));
    // TenantContext is resolved at decoration time, but for shared bindings,
    // better: inject TenantContext into TenantScopedClient directly
});
```
---
## Exceptions
Transient (`bind()`) services where the extender executes on every `make()` call.
---
## Consequences Of Violation
Reliability: non-deterministic behavior where decoration depends on resolution order. Security: potential data leakage between requests under Octane.

---

## Document extender() Ordering Dependencies Between Packages
---
## Category
Maintainability
---
## Rule
Document the expected extender registration order when a package registers extenders that interact with other extenders.
---
## Reason
Extender ordering is implicit — determined by service provider registration order. Without documentation, consuming developers cannot know whether package A's extender should run before or after package B's extender, leading to subtle decoration bugs.
---
## Bad Example
```php
// Package A's ServiceProvider
public function boot(): void {
    $this->app->extend(HttpClient::class, new CacheDecorator(...));
}

// Package B's ServiceProvider
public function boot(): void {
    $this->app->extend(HttpClient::class, new RetryDecorator(...));
}
// No documentation: which wraps which?
```
---
## Good Example
```php
/**
 * Package A — HttpClient Caching Decorator
 * 
 * Registers an extender for HttpClient that adds response caching.
 * Should register BEFORE retry/logging decorators so that cache
 * hits bypass retry logic. Register this provider before any
 * HttpClient decorator that should wrap caching.
 */
public function boot(): void {
    $this->app->extend(HttpClient::class, new CacheDecorator(...));
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Maintainability: integration bugs between packages that are difficult to diagnose. Reliability: unintended decoration chains causing incorrect behavior.

---

## Use extend() Instead of Overriding the Binding
---
## Category
Maintainability
---
## Rule
Prefer `extend()` over re-registering a binding with `bind()` or `singleton()` when adding cross-cutting behavior to an existing service.
---
## Reason
Re-registering a binding replaces the original definition entirely, discarding the original factory closure and preventing other packages from also extending it. Using `extend()` preserves the original binding and allows multiple independent decorators to stack.
---
## Bad Example
```php
// Overrides the entire binding — original factory lost
$this->app->bind(OrderProcessor::class, function ($app) {
    return new LoggingOrderProcessor(
        $app->make(StripeOrderProcessor::class)
    );
});
// Another package cannot also decorate OrderProcessor cleanly
```
---
## Good Example
```php
// Preserve original binding, stack decoration
$this->app->extend(OrderProcessor::class, function ($processor, $app) {
    return new LoggingOrderProcessor($processor);
});
```
---
## Exceptions
When the original binding definition must be fundamentally changed (different concrete class, different construction parameters) and decoration cannot achieve the change.
---
## Consequences Of Violation
Maintainability: package conflicts where multiple packages try to override the same binding. Reliability: unintentional loss of previously registered behavior.
