## Default To Transient Binding For All Business Services
---
## Architecture
---
## Rule
Default to transient binding for all business services. Do not explicitly bind — let the container resolve a new instance per request.
---
## Reason
The performance cost of transient resolution is negligible (~1-5μs). The safety benefit of avoiding state leaks, especially under Octane, is significant.
---
## Bad Example
```php
// ServiceProvider.php
public function register(): void
{
    $this->app->singleton(UserService::class); // Singleton for convenience
    $this->app->singleton(OrderService::class); // No performance reason
    $this->app->singleton(PaymentService::class); // Not audited for state
}
```
---
## Good Example
```php
// ServiceProvider.php — no explicit binding for business services
// Container resolves new instance per request (transient) by default

// Only explicitly bind when variation is needed:
$this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
```
---
## Exceptions
Provably stateless infrastructure services where instantiation has measurable overhead and statelessness has been audited.
---
## Consequences Of Violation
State leaks across requests under Octane, undetected mutable state on singletons, intermittent production bugs.

## Audit Singleton Services For Statelessness
---
## Reliability
---
## Rule
Before binding any service as a singleton, audit it for mutable properties, captured request context, static state, and request-scoped dependencies.
---
## Reason
Stateful singletons under Octane are a top-3 source of production bugs. A service that appears stateless may have hidden mutable state that leaks between requests.
---
## Bad Example
```php
class UserService
{
    private ?User $currentUser = null; // Mutable property — not audited

    public function setCurrentUser(User $user): void
    {
        $this->currentUser = $user;
    }

    public function getCurrentUser(): ?User
    {
        return $this->currentUser;
    }
}

// Bound as singleton without audit:
$this->app->singleton(UserService::class);
// Request A sets currentUser to Admin. Request B gets Admin instead of Guest.
```
---
## Good Example
```php
class UserService
{
    // No mutable properties — all request data passed as method arguments
    public function getProfile(User $user): array
    {
        return $user->toArray();
    }
}

// After auditing for statelessness, can be safely bound as singleton
$this->app->singleton(UserService::class);
```
---
## Exceptions
No common exceptions. If you cannot prove statelessness, do not bind as singleton.
---
## Consequences Of Violation
Cross-request data contamination, tenant data leaks, intermittent unreproducible bugs, data privacy violations.

## Use Factory Pattern For Stateful Services
---
## Architecture
---
## Rule
When a service needs request-scoped context (user, tenant), use a factory pattern that produces fresh instances per request rather than storing state on a singleton.
---
## Reason
Factories avoid the state leak problem of singletons while providing needed context. Each request gets a fresh instance with correct context.
---
## Bad Example
```php
class TenantService
{
    private ?Tenant $currentTenant = null;

    public function setTenant(Tenant $tenant): void
    {
        $this->currentTenant = $tenant; // Mutable state
    }

    public function getTenant(): ?Tenant
    {
        return $this->currentTenant;
    }
}

// Under Octane, Request A's tenant leaks to Request B
$this->app->singleton(TenantService::class);
```
---
## Good Example
```php
class TenantContext
{
    public function __construct(
        public readonly Tenant $tenant,
    ) {}
}

class TenantService
{
    public function __construct(
        private TenantContext $context, // Request-scoped via factory
    ) {}

    public function getData(): Collection
    {
        return Order::where('tenant_id', $this->context->tenant->id)->get();
    }
}

// Service provider creates factory:
$this->app->bind(TenantContext::class, function () {
    return new TenantContext(tenant: app(TenantResolver::class)->resolve());
});
// TenantService is transient — TenantContext is fresh per request
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cross-request data contamination, tenant data leaks, data privacy violations, intermittent bugs.

## No Service Should Store Mutable Request-Scoped State
---
## Architecture
---
## Rule
Services must not store request-scoped state (authenticated user, current tenant, request ID) as mutable properties. Pass request-scoped data as method arguments.
---
## Reason
Mutable request-scoped state on services causes cross-request contamination under Octane and creates implicit dependencies on request context that are invisible in method signatures.
---
## Bad Example
```php
class OrderService
{
    private User $user; // Request-scoped mutable state

    public function setUser(User $user): void
    {
        $this->user = $user;
    }

    public function getOrders(): Collection
    {
        return Order::where('user_id', $this->user->id)->get();
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function getOrders(User $user): Collection // User passed as argument
    {
        return Order::where('user_id', $user->id)->get();
    }
}
```
---
## Exceptions
Context objects that are value objects created fresh per request (immutable, no mutable state).
---
## Consequences Of Violation
Cross-request data leaks under Octane, implicit dependencies on request context, testing requires setting up service state.

## Under Octane, Prefer Transient For All Services
---
## Reliability
---
## Rule
Under Octane, prefer transient binding for all business services. Only use singleton for provably stateless infrastructure services.
---
## Reason
Octane's persistent worker model magnifies the risk of stateful singletons. A bug that routes data to the wrong user is a privacy incident. Transient is safe.
---
## Bad Example
```php
// Octane application — singletons used without stateless audit
class AnalyticsService
{
    private array $events = []; // Accumulates events across requests

    public function track(string $event): void
    {
        $this->events[] = $event; // Under Octane, events accumulate
    }

    public function flush(): void
    {
        Http::post('https://analytics.com/events', ['events' => $this->events]);
        $this->events = []; // Previous request's events mixed with current
    }
}

$this->app->singleton(AnalyticsService::class);
```
---
## Good Example
```php
// Octane application — transient by default
class AnalyticsService
{
    public function track(string $event): void // No mutable state
    {
        Http::post('https://analytics.com/events', ['events' => [$event]]);
    }
}

// No explicit binding — resolved as transient
```
---
## Exceptions
No common exceptions. Under Octane, transient is the safe default.
---
## Consequences Of Violation
User data leaks across requests, tenant cross-contamination, intermittent production-only bugs, data privacy violations.

## No Singleton For Convenience Without Audit
---
## Reliability
---
## Rule
Do not bind a service as singleton "for convenience" or perceived performance without auditing for statelessness.
---
## Reason
Singleton-for-convenience is a common anti-pattern that leads to undetected state leaks. The performance difference is negligible; the safety risk is significant.
---
## Bad Example
```php
// ServiceProvider.php — bound as singleton for "performance"
public function register(): void
{
    // "UserService doesn't change, so singleton should be fine"
    $this->app->singleton(UserService::class);
}

// Later, someone adds mutable state:
class UserService
{
    private ?string $impersonatingId = null;

    public function impersonate(string $userId): void
    {
        $this->impersonatingId = $userId; // State leak!
    }
}
```
---
## Good Example
```php
// ServiceProvider.php — transient by default
public function register(): void
{
    // No explicit binding — resolved transient
}

// If performance profiling proves transient resolution is a bottleneck:
// 1. Audit service for statelessness
// 2. Document the statelessness proof
// 3. Only then bind as singleton
// Stats show: 5μs per resolution, 10 resolutions per request = 50μs. Not a bottleneck.
```
---
## Exceptions
No common exceptions. Performance optimization should be data-driven, not speculative.
---
## Consequences Of Violation
Undetected state leaks, intermittent production bugs, debugging nightmare under Octane.
