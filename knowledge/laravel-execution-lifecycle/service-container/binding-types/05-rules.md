# Binding Types — Rules

## Use scoped() for Any Service Holding Per-Request State
---
## Category
Reliability
---
## Rule
Use `$app->scoped()` for every service that holds state derived from the current HTTP request or job payload.
---
## Reason
Under Octane and queue workers, `singleton()` instances persist across requests, causing data leaks where user A's state (auth user, tenant context, locale) appears in user B's session. `scoped()` isolates state to a single scope boundary and is automatically flushed.
---
## Bad Example
```php
// Octane deployment — data leak vulnerability
$this->app->singleton(CurrentUser::class, function ($app) {
    return new CurrentUser($app->make(Auth::class)->user());
});
// User A's identity persists for User B's request
```
---
## Good Example
```php
$this->app->scoped(CurrentUser::class, function ($app) {
    return new CurrentUser($app->make(Auth::class)->user());
});
// Flushed at end of each request — fresh instance per request
```
---
## Exceptions
FPM-only deployments where each request is a separate process with no memory sharing (though still use `scoped()` for future Octane migration).
---
## Consequences Of Violation
Security: data leakage between users under Octane — the #1 production bug in Octane deployments.

---

## Default to bind() for Stateless Services
---
## Category
Performance
---
## Rule
Use `$app->bind()` as the default binding type for stateless, immutable services unless profiling shows allocation overhead.
---
## Reason
`bind()` (transient) produces a fresh instance per resolution, avoiding shared-state bugs and keeping memory pressure low. The allocation cost of most services (<1μs) is negligible. Only promote to `singleton()` or `scoped()` when profiling confirms construction cost is a bottleneck.
---
## Bad Example
```php
// Premature singleton for a lightweight value object
$this->app->singleton(Coordinates::class, function ($app) {
    return new Coordinates($app->make(GeoService::class)->getCenter());
});
// Unnecessary shared state for an immutable value
```
---
## Good Example
```php
$this->app->bind(Coordinates::class, function ($app) {
    return new Coordinates($app->make(GeoService::class)->getCenter());
});
// Fresh instance per consumer; no shared state risk
```
---
## Exceptions
Services whose construction is demonstrably expensive (>5ms) and are resolved multiple times per request.
---
## Consequences Of Violation
Reliability: inadvertent shared state in what should be independent instances. Performance: negligible positive impact, outweighed by correctness risk.

---

## Audit All singleton() Bindings Before Octane Deployment
---
## Category
Security
---
## Rule
Review every `singleton()` binding for mutable request-scoped state as part of the Octane deployment checklist.
---
## Reason
A single mutable singleton holding request-scoped data under Octane creates a data leak vulnerability. Each binding must be classified as either process-scoped (stateless, immutable) or request-scoped (needs `scoped()`).
---
## Bad Example
```php
// No audit — deploy and discover leaks in production
$this->app->singleton(LocaleManager::class, function ($app) {
    return new LocaleManager($app->make(Request::class)->getLocale());
});
// Under Octane, first request's locale persists for all subsequent requests
```
---
## Good Example
```php
// Audit checklist:
// ✅ CacheManager — stateless singleton (OK)
// ✅ Router — immutable after boot (OK)
// ❌ CurrentUser — request-scoped (convert to scoped())
// ❌ LocaleManager — request-scoped (convert to scoped())
// ❌ TenantContext — request-scoped (convert to scoped())
```
---
## Exceptions
No common exceptions — audit is mandatory before Octane deployment.
---
## Consequences Of Violation
Security: cross-user data leakage. Financial: potential GDPR/PII exposure. Reputation: users see other users' private data.

---

## Use instance() Only in Tests or Boot-Time Setup
---
## Category
Framework Usage
---
## Rule
Limit `$app->instance()` usage to test mocks and boot-time bootstrapping — never use it for production binding registration in service providers.
---
## Reason
`instance()` bypasses the full resolution pipeline: extenders do not apply, resolution callbacks do not fire, and the object cannot be decorated. It places a pre-constructed object directly into the instances cache, skipping all lifecycle hooks.
---
## Bad Example
```php
// Production service provider — bypasses all container lifecycle
public function register(): void {
    $this->app->instance(PaymentGateway::class, new StripeGateway('sk_test_...'));
}
// Cannot be extended or intercepted; secret in constructor
```
---
## Good Example
```php
public function register(): void {
    $this->app->singleton(PaymentGateway::class, function ($app) {
        return new StripeGateway(config('services.stripe.secret'));
    });
}
// Test override:
public function test(): void {
    $this->app->instance(PaymentGateway::class, new FakeGateway());
}
```
---
## Exceptions
Framework internals where the class cannot be constructed via normal resolution (e.g., `$app->instance('app', $this)` in `Application`).
---
## Consequences Of Violation
Maintainability: service cannot be decorated or intercepted. Testing: cannot use `extend()` for test configuration.

---

## Do Not Mix Binding Types in a Singleton's Dependency Graph
---
## Category
Reliability
---
## Rule
Ensure all transitive dependencies of a `singleton()` or `scoped()` binding are also shared (singleton or scoped), or use a factory to resolve them lazily.
---
## Reason
A singleton that depends on a transient service resolves the transient once and holds the same instance for the process lifetime. Subsequent requests receive the stale transient instance, not a fresh one. This creates a latent lifecycle mismatch that causes hard-to-reproduce bugs.
---
## Bad Example
```php
$this->app->singleton(ReportService::class, function ($app) {
    return new ReportService(
        $app->make(RequestTracker::class) // Transient — resolved once, held forever
    );
});
// RequestTracker becomes stale after the first request
```
---
## Good Example
```php
$this->app->singleton(ReportService::class, function ($app) {
    return new ReportService(
        $app->make(RequestTrackerFactory::class) // Inject a factory
    );
});

class ReportService {
    public function __construct(
        protected RequestTrackerFactory $trackerFactory
    ) {}

    public function process(): void {
        $tracker = $this->trackerFactory->make(); // Fresh per call
    }
}
```
---
## Exceptions
Immutable value objects that are truly stateless and never change after construction.
---
## Consequences Of Violation
Reliability: hard-to-debug stale state in singletons that manifests inconsistently across environments.

---

## Use Self-Binding Shorthand for Auto-Resolved Concrete Classes
---
## Category
Code Organization
---
## Rule
Use `$app->bind(MyClass::class)` (without second argument) when you need to register a concrete class for explicit binding but don't need a custom factory.
---
## Reason
Self-binding registers the class as a binding with the abstract name as the concrete, enabling the container to resolve it via the standard pipeline (with extenders and callbacks) rather than auto-resolution fallback. This makes the class a first-class binding without requiring a closure.
---
## Bad Example
```php
// Unnecessary closure for a class with no special construction
$this->app->bind(ReportGenerator::class, function ($app) {
    return new ReportGenerator();
});
```
---
## Good Example
```php
$this->app->bind(ReportGenerator::class);
// Or with shared:
$this->app->singleton(ReportGenerator::class);
```
---
## Exceptions
Classes requiring constructor parameters beyond simple dependency injection (primitives, configuration values).
---
## Consequences Of Violation
Maintainability: unnecessary closure boilerplate. Performance: negligible, but extra indirection in the binding registry.
