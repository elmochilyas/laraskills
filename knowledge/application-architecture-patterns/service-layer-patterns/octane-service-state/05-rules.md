## All Request-Specific Data Must Be Method Arguments
---
## Architecture
---
## Rule
All request-specific data (authenticated user, current tenant, locale, timezone) must be passed as method arguments to services. Never store them as service properties.
---
## Reason
Storing request data on service properties causes cross-request contamination under Octane's persistent worker model, where singletons persist across requests.
---
## Bad Example
```php
class OrderService
{
    private ?User $currentUser = null;

    public function setUser(User $user): void
    {
        $this->currentUser = $user; // Request data stored as property
    }

    public function getOrders(): Collection
    {
        return Order::where('user_id', $this->currentUser->id)->get();
    }
}

// Under Octane:
// Request A: setUser(Admin) → getOrders() returns Admin's orders
// Request B: setUser(Guest) → getOrders() might return Admin's orders (state leak!)
```
---
## Good Example
```php
class OrderService
{
    public function getOrders(User $user): Collection // User as method parameter
    {
        return Order::where('user_id', $user->id)->get();
    }
}

// No state — each request passes its own user data
// Under Octane: safe — no mutable properties to leak
```
---
## Exceptions
Context objects (RequestContext, TenantContext) that are value objects created fresh per request and injected as constructor dependencies via factory.
---
## Consequences Of Violation
Cross-request user data leaks, tenant cross-contamination, data privacy violations, intermittent unreproducible bugs in Octane.

## Default To Transient Binding For All Services
---
## Architecture
---
## Rule
Default to transient binding for ALL services. Do not use singleton binding unless the service has been provably audited as stateless.
---
## Reason
Transient services create a new instance per resolution, preventing state leaks. The negligible performance cost (~1-5μs) is worth the safety benefit.
---
## Bad Example
```php
// ServiceProvider — singletons without audit
public function register(): void
{
    $this->app->singleton(UserService::class);
    $this->app->singleton(OrderService::class);
    $this->app->singleton(PaymentService::class);
    // None audited for statelessness
}
```
---
## Good Example
```php
// ServiceProvider — no explicit bindings = transient by default
public function register(): void
{
    // Business services are transient (no binding needed)
    // Only bind interfaces that need implementation mapping:
    $this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
}

// If singleton is needed, audit and document:
// UserService is stateless (pure functions, no mutable properties)
// after audit on 2024-01-15 — signed by team lead
$this->app->singleton(UserService::class);
```
---
## Exceptions
Provably stateless infrastructure services where instantiation overhead is measurable and statelessness has been strictly audited.
---
## Consequences Of Violation
Undetected state leaks under Octane, intermittent production-only bugs, data privacy violations.

## Use Context Object Pattern For Request Data
---
## Architecture
---
## Rule
Use a `RequestContext` value object to bundle request-scoped data (user, tenant, locale) and pass it to services. This simplifies method signatures while keeping request data explicit.
---
## Reason
A context object prevents parameter bloat (passing user, tenant, locale separately to every method) while avoiding stateful service properties that leak under Octane.
---
## Bad Example
```php
class OrderService
{
    public function getOrders(User $user, Tenant $tenant): Collection {} // 2 params
    public function createOrder(User $user, Tenant $tenant, array $data): Order {} // 3 params
    public function shipOrder(User $user, Tenant $tenant, Order $order): void {} // 3 params
}

// Every method repeats user + tenant params — parameter bloat
```
---
## Good Example
```php
class RequestContext
{
    public function __construct(
        public readonly User $user,
        public readonly Tenant $tenant,
        public readonly string $locale = 'en',
    ) {}
}

class OrderService
{
    public function getOrders(RequestContext $context): Collection
    {
        return Order::where('tenant_id', $context->tenant->id)
            ->where('user_id', $context->user->id)
            ->get();
    }

    public function createOrder(RequestContext $context, array $data): Order
    {
        // Use context for user, tenant context
    }
}

// Factory creates context per request:
$this->app->bind(RequestContext::class, function () {
    return new RequestContext(
        user: Auth::user(),
        tenant: app(TenantResolver::class)->resolve(),
        locale: request()->getLocale(),
    );
});
```
---
## Exceptions
Simple services that need only one request-scoped value (pass it directly).
---
## Consequences Of Violation
Parameter bloat across methods, incentive to store request data on service properties, state leak bugs under Octane.

## Audit Existing Services Before Enabling Octane
---
## Reliability
---
## Rule
Before enabling Octane, audit all existing services for mutable properties, captured request context, static state, and factory closures that capture request state.
---
## Reason
Stateful services that work correctly under FPM will silently leak data across requests under Octane. An audit prevents production incidents.
---
## Bad Example
```php
// Service works in FPM — no bugs
class AnalyticsService
{
    private array $events = []; // Mutable property — accumulates data

    public function track(string $event): void
    {
        $this->events[] = $event;
    }

    public function flush(): void
    {
        Http::post('https://analytics.com/events', ['events' => $this->events]);
        $this->events = [];
    }
}

// Under Octane: events accumulate across requests!
// Request A: track('login') → events = ['login']
// Request B: track('purchase') → events = ['login', 'purchase'] // LEAK!
```
---
## Good Example
```php
// Audited and fixed before Octane enablement
class AnalyticsService
{
    public function track(string $event): void // No mutable state
    {
        Http::post('https://analytics.com/events', ['events' => [$event]]);
    }
}

// Audit checklist:
// [ ] No mutable properties on any service
// [ ] No Auth::user() or request() in constructors
// [ ] No static properties that change per request
// [ ] No factory closures capturing request state
// [ ] All request data passed as method arguments
```
---
## Exceptions
No common exceptions. The audit is mandatory before enabling Octane.
---
## Consequences Of Violation
Production-only state leak bugs, data privacy incidents, difficult debugging, emergency rollback.

## No Mutable Properties On Services
---
## Architecture
---
## Rule
Services must have no mutable properties (instance variables that change after construction). All dependencies should be assigned in the constructor and never reassigned.
---
## Reason
Mutable properties are the primary source of state leaks under Octane. Each mutable property is a potential cross-request contamination vector.
---
## Bad Example
```php
class NotificationService
{
    private array $sentNotifications = []; // Mutable — accumulates

    public function send(string $notification): void
    {
        $this->sentNotifications[] = $notification;
    }

    public function getSentNotifications(): array
    {
        return $this->sentNotifications;
    }
}
```
---
## Good Example
```php
class NotificationService
{
    public function __construct(
        private Mailer $mailer, // Constructor — never reassigned
    ) {}

    public function send(Notification $notification): void
    {
        $this->mailer->send($notification); // No mutable state
    }
}
```
---
## Exceptions
Caches on provably stateless services where the cache key includes request-specific data (e.g., computed configuration).
---
## Consequences Of Violation
Cross-request data contamination, intermittent bugs, data leaks, debugging nightmare under Octane.

## No Captured Request Context On Services
---
## Architecture
---
## Rule
Do not capture request context (via `Auth::user()`, `request()`, or facades) in service constructors or methods. All request data must be passed explicitly.
---
## Reason
Captured request context is an invisible dependency that ties the service to the current HTTP request. Under Octane, this context may be stale or from a different request.
---
## Bad Example
```php
class OrderService
{
    public function __construct()
    {
        $this->currentUser = Auth::user(); // Captured at construction time
    }

    public function getOrders(): Collection
    {
        return Order::where('user_id', $this->currentUser->id)->get();
    }
}

// Under Octane:
// First request: Auth::user() = User A — stored in constructor
// Second request: Auth::user() = User B — but $this->currentUser is still User A!
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

// No capture — request data is explicit in method signature
// Under Octane: safe — no hidden request context
```
---
## Exceptions
No common exceptions. Capturing request context is always a bug under Octane.
---
## Consequences Of Violation
Stale user data, authentication bypass (using previous request's user), tenant cross-contamination, data privacy violations.

## Don't Assume FPM Behavior Applies To Octane
---
## Reliability
---
## Rule
Do not assume that code working correctly under FPM (single-request lifecycle) will work under Octane (persistent workers). Build stateless from the start regardless of deployment target.
---
## Reason
Octane changes fundamental assumptions about object lifetimes. Code that works in development (single request) may silently leak data in production (many requests per worker).
---
## Bad Example
```php
// Works in FPM — each request gets fresh objects
class UserService
{
    private ?User $cachedUser = null;

    public function find(int $id): User
    {
        if ($this->cachedUser === null || $this->cachedUser->id !== $id) {
            $this->cachedUser = User::find($id);
        }
        return $this->cachedUser;
    }
}

// "Works in development (FPM)" — developer assumes it's fine
// Under Octane: $cachedUser is never garbage collected
// Request A: find(1) → cached user 1
// Request B: find(2) → returns user 1 (WRONG!)
```
---
## Good Example
```php
// Stateless — works everywhere
class UserService
{
    public function find(int $id): ?User
    {
        return User::find($id); // No caching, no state
    }
}

// Stateless from the start — safe under FPM, Octane, Swoole, RoadRunner
```
---
## Exceptions
No common exceptions. Build stateless as the default, not as an Octane optimization.
---
## Consequences Of Violation
Intermittent production-only bugs, undetected data leaks, difficulty reproducing issues, emergency rollbacks.
