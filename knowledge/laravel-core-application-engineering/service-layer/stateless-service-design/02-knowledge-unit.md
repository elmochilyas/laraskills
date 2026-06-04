# Stateless Service Design

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Stateless Service Design
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

A stateless service is one that does not retain any mutable state between method calls. Every method receives all its required data through parameters or injected dependencies, performs its operation, and returns a result without modifying any internal properties. The service instance, after the method call, is in exactly the same state as before the call.

The engineering significance of statelessness is correctness under concurrency. In traditional PHP-FPM, each request has its own process, so state leaks between requests are impossible. Under Laravel Octane (Swoole, RoadRunner) and queue workers (Horizon), a single process handles multiple requests sequentially. A stateful service registered as a singleton silently leaks data between requests — a bug that is intermittent, environment-dependent, and extremely difficult to debug. Statelessness eliminates this entire class of bugs.

Statelessness also determines testability. A stateless service is trivially testable: construct with dependencies, call a method, assert the result. No setup, no teardown, no state reset between tests. A stateful service requires careful per-test initialization and reset, and tests can interfere with each other through shared mutable state. The single strongest predictor of service testability is whether the service is stateless.

---

## Core Concepts

### Mutable State vs Configuration vs External State

**Mutable state:** Properties set or modified during request processing. `$this->currentUser`, `$this->items[]`, `$this->callCount`. These values leak across requests if the service is a singleton.

**Configuration:** Immutable values set at construction time. API keys, base URLs, rate limits. These are safe because they never change after construction.

**External state:** Data fetched fresh on each call from a dependency. Database query results, HTTP API responses. These are safe because they are fetched per-call and not stored on the service.

The distinction: configuration never changes, external state is fetched per-call, mutable state accumulates across calls. Only mutable state is dangerous.

### Singleton Scope and Cross-Request Contamination

When a service is registered as a singleton, the container caches the first resolved instance and returns it on every subsequent resolution. In PHP-FPM, this is per-request (process ends after request). Under Octane or queue workers, the process lives across multiple requests.

Contamination cascade:
1. Request A arrives. Service singleton resolves (first time). Middleware sets `$this->tenant = Tenant::find(1)` on the service.
2. Request A completes. Service instance persists in container.
3. Request B arrives (different tenant). Service singleton is reused. `$this->tenant` is still Tenant 1 from Request A.
4. If Request B's code path does not explicitly overwrite `$this->tenant`, it silently operates on Request A's data.

The bug is intermittent — it only occurs when the same worker processes requests for different users in sequence. Local development (single request per process) never reproduces it.

### The scoped() Binding

Laravel's `scoped()` binding solves the per-request state problem:

```php
$this->app->scoped(TenantContext::class);
```

`scoped()` internally calls `singleton()` but tracks the abstract name. Before each new request or job, the container calls `forgetScopedInstances()`, which removes each scoped abstract from the instances array. The next `resolve()` call creates a fresh instance.

The `scoped()` lifecycle:
```
Octane/Worker starts
  → Resolve scoped service (first request) — creates instance
  → Request ends — scoped instances are forgotten
  → Resolve scoped service (second request) — creates NEW instance
```

### Fluent API and State Mutation

A fluent API that returns `$this` and mutates internal state is incompatible with stateless service design:

```php
// Stateful fluent — DANGER for singletons
class QueryBuilderService
{
    private array $wheres = [];

    public function where(string $column, $value): self
    {
        $this->wheres[] = [$column, $value]; // Mutates internal state
        return $this;
    }
}
```

If this is a singleton, calling `where('x', 1)` on one request leaks the condition to the next. The `$wheres` array grows unbounded.

Immutable fluent (safe):

```php
class QueryBuilderService
{
    private array $wheres;

    public function where(string $column, $value): self
    {
        $clone = clone $this;
        $clone->wheres = [...$this->wheres, [$column, $value]];
        return $clone; // Returns new instance, original unchanged
    }
}
```

Better yet, avoid fluent mutation on services entirely — pass all data as method arguments.

---

## Mental Models

### Service as Pure Function
A stateless service method is a pure function: given the same inputs, it always produces the same outputs (for the same external state). It has no side effects on its own instance. This makes it predictable, testable, and safe to cache or memoize.

### Singleton as Shared Pencil
A singleton service is a shared pencil on a desk. Anyone can use it, but no one should leave their writing on it. If a developer draws on the pencil, the next user sees their drawing. The pencil must be clean before and after each use.

### State as Parameter, Not Property
Data that varies per request should be a method parameter, not a class property. The authenticated user, the current tenant, the request locale — these are call-specific data. Passing them as parameters makes the call-site explicit and the service stateless.

---

## Internal Mechanics

### Container Singleton Behavior

```php
// Container.php (simplified)
public function singleton($abstract, $concrete = null)
{
    $this->bindings[$abstract] = [
        'concrete' => $concrete,
        'shared' => true,    // ← Singleton flag
    ];
}

public function make($abstract)
{
    if (isset($this->instances[$abstract])) {
        return $this->instances[$abstract]; // ← Returns cached instance
    }

    $object = $this->resolve($abstract);

    if ($this->isShared($abstract)) {
        $this->instances[$abstract] = $object; // ← Cache for next time
    }

    return $object;
}
```

Singleton means: resolve once, cache the instance, return it on every subsequent call.

### scoped() Implementation

```php
public function scoped($abstract, $concrete = null)
{
    $this->singleton($abstract, $concrete);
    $this->scopedInstances[] = $abstract;
}

// Called between requests in Octane/queue workers
public function forgetScopedInstances()
{
    foreach ($this->scopedInstances as $abstract) {
        unset($this->instances[$abstract]);
    }
}
```

`forgetScopedInstances()` clears the cached instances. The next `make()` call resolves a fresh service.

### Immutable Fluent via Clone

```php
public function where(string $column, $value): self
{
    $clone = clone $this;
    $clone->wheres = array_merge($this->wheres, [[$column, $value]]);
    return $clone;
}
```

`clone` creates a shallow copy of the object. The new instance has the same property values as the original at the time of cloning. Subsequent mutations on the clone do not affect the original.

---

## Patterns

### Stateless Service with All State as Parameters

```php
class InvoiceService
{
    public function __construct(
        private InvoiceRepository $invoices,
        private TaxCalculator $taxCalculator,
    ) {}

    public function generateForUser(User $user, Cart $cart): Invoice
    {
        $subtotal = $cart->total();
        $tax = $this->taxCalculator->calculate($subtotal, $user->country);
        $total = $subtotal + $tax;

        return $this->invoices->create([
            'user_id' => $user->id,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
        ]);
    }
}
```

No mutable properties. All per-request data (user, cart) is passed as method parameters. The service is safe as a singleton.

### Scoped Context Service

When a service genuinely needs per-request context (tenant, locale), use `scoped()`:

```php
// Service provider
$this->app->scoped(TenantContext::class);

// Middleware
public function handle(Request $request, Closure $next): mixed
{
    app(TenantContext::class)->set($request->user()->tenant);
    return $next($request);
}

// Service
class ReportService
{
    public function __construct(
        private TenantContext $context,
        private ReportRepository $reports,
    ) {}

    public function generateReport(): Report
    {
        $tenant = $this->context->get(); // Fresh per request — scoped lifecycle
        return $this->reports->forTenant($tenant)->get();
    }
}
```

`TenantContext` is scoped — it provides the same instance within a request but is reset between requests.

### No Mutable Properties Service

```php
class EmailService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly int $maxRetries,
    ) {}

    public function send(Email $email, User $recipient): bool
    {
        for ($attempt = 1; $attempt <= $this->maxRetries; $attempt++) {
            try {
                $this->mailer->send($email, $recipient->email);
                $this->logger->info('Email sent', ['to' => $recipient->email]);
                return true;
            } catch (TransportException $e) {
                if ($attempt === $this->maxRetries) {
                    $this->logger->error('Email failed', [
                        'to' => $recipient->email,
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
                }
            }
        }
        return false;
    }
}
```

`$maxRetries` is configuration (injected, read-only). `$attempt` is a local variable, not a property. No mutable state.

### Instance Counter (Anti-Pattern)

```php
// BAD — stateful, dangerous as singleton
class MetricsService
{
    private int $callCount = 0;

    public function track(): void
    {
        $this->callCount++;
    }

    public function getCallCount(): int
    {
        return $this->callCount;
    }
}
```

Under Octane, `$callCount` accumulates across all requests handled by the same worker. Safe alternatives: return count from the method and let the caller accumulate, or use a `scoped()` cache service.

---

## Architectural Decisions

### Why Statelessness Is Required, Not Optional
The framework does not enforce statelessness. A service with mutable properties works fine in PHP-FPM. The requirement emerges from deployment environment. Any application that may run under Octane, RoadRunner, or queue workers must be stateless. Since these environments are the standard for production Laravel (performance + queue processing), statelessness is effectively required.

### When to Use scoped() vs bind()
- `bind()`: Creates a new instance on every resolution. Use for services that genuinely need fresh state per-call (rare).
- `singleton()`: Same instance for the process lifetime. Use for stateless services (most common).
- `scoped()`: Same instance within a request, fresh instance between requests. Use for services that need per-request state (tenant context, request cache).

### Why Fluent APIs Are Discouraged on Services
Fluent mutation (`$this->method()->anotherMethod()`) typically mutates internal state. On a singleton service, the mutation leaks to the next caller. If fluent APIs are required, use immutable patterns (clone on mutation) or avoid fluent patterns on services entirely — use it on value objects and DTOs instead.

---

## Tradeoffs

### Stateless vs Stateful Services

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Stateless: Safe under Octane/queue workers; trivially testable; no state leaks | Stateless: Must pass context explicitly — more parameters, more verbose call-sites | Caller must provide all data; no implicit context |
| Stateful: Convenient — set context once, use implicitly in all methods | Stateful: Dangerous under concurrency; hard to test; intermittent bugs | Only acceptable with `scoped()` binding and explicit lifecycle management |

### Explicit Parameters vs Scoped Context

| Pattern | Benefit | Cost |
|---------|---------|------|
| Explicit parameters | No hidden state, no lifecycle management, trivially testable | Verbose method signatures for deeply nested call chains |
| Scoped context | Clean method signatures, implicit availability | Hidden state dependencies, test setup overhead, lifecycle coupling |

### Immutable Fluent vs Method Arguments

| Pattern | Benefit | Cost |
|---------|---------|------|
| Immutable fluent (clone) | Clean builder pattern, method chaining | Clone overhead for every mutation, reference semantics confusion |
| Method arguments | Explicit, zero overhead, no cloning | Verbose, no chaining |

---

## Performance Considerations

### Singleton Resolution Cost
Singleton resolution: one-time cost at first resolution (~0.01ms). Subsequent resolutions return the cached instance with no reflection or construction overhead. For services injected into multiple controllers (common for shared services), the savings add up.

### Clone Overhead for Immutable Fluent
`clone` creates a shallow copy of the object (~0.001ms). For simple objects with a few scalar properties, the cost is negligible. For objects with deep object graphs, cloning propagates through the graph and can be expensive. Avoid cloning large object trees.

### scoped() Flush Cost
`forgetScopedInstances()` iterates over the scoped instances array and unsets each entry. The cost is O(n) where n is the number of scoped bindings. For typical applications with 5–20 scoped bindings, the cost is negligible (~0.001ms).

---

## Production Considerations

### Auditing Services for State Leaks
Review services for mutable properties during code review. Check for:
- `$this->property = ...` assignments in methods
- `protected` or `private` properties that are not `readonly`
- `static` properties that accumulate state (counters, caches)
- Properties set in middleware and used in services

### Migrating Stateful Services
If a stateful service is found in production:
1. Make properties `readonly` where possible (configuration)
2. Move mutable state to method parameters
3. If per-request context is genuinely needed, switch binding to `scoped()`
4. Verify all call-sites pass the required data explicitly

### Octane Safety Checklist
Before deploying under Octane:
- All services registered in providers: confirm stateless or `scoped()`
- No `static` properties that accumulate state
- No mutable properties set during request processing
- No closures stored in properties that capture request-scoped data

---

## Common Mistakes

### Using Singleton Registrations for Stateful Services
Why it happens: `singleton()` is the default recommendation for performance, and developers apply it without considering state. Why it's harmful: A stateful service leaks data across requests under Octane/workers. Better approach: Use `scoped()` for services with per-request state, or refactor to stateless and use `singleton()`.

### Storing Authenticated User on the Service
Why it happens: The service needs the current user, so it's stored in a property for convenience. Why it's harmful: The user from Request A persists for Request B. If Request B's code path skips the "set user" step, it silently operates on the wrong user. Better approach: Pass the user as a method parameter.

### Static Properties in Services
Why it happens: A counter, cache, or registry that seems convenient as a static property. Why it's harmful: Static properties are shared across ALL instances, not just one service instance. Under Octane, a static counter accumulates across all requests. Better approach: Use `Cache` facade or a scoped service for per-request state.

### Not Using readonly Properties
Why it happens: PHP 8.1+ `readonly` is a relatively new feature. Why it's harmful: Without `readonly`, any property can be modified, and modifications may go unnoticed during code review. Using `readonly` for all constructor-promoted properties enforces immutability at the language level. Better approach: Use `readonly` for all service constructor properties.

---

## Failure Modes

### Silent Data Leak Under Octane
A stateful singleton in Octane causes silent data corruption. User A's data appears in User B's dashboard. The bug is intermittent, non-deterministic, and only occurs under production load. Local development rarely reproduces it. Debugging requires understanding the container lifecycle and worker architecture.

### Intermittent Test Failures
A stateful service in tests causes order-dependent test failures. Test A sets state on the service. Test B runs next and sees Test A's state. If tests run in random order (as they should), Test B fails intermittently. The developer suspects a race condition but the root cause is shared mutable state on the service instance.

### Memory Leak from Accumulated State
A service with a `private array $cache = []` that accumulates data across requests never releases memory. Under Octane, the cache grows unbounded until the worker runs out of memory and crashes. The memory leak is gradual — it may take hours or days to manifest depending on traffic volume.

---

## Ecosystem Usage

### Laravel Framework
The framework's own service classes in `Illuminate` are generally stateless. They accept their dependencies via constructor injection and do not store per-request state. The container itself is the primary exception — it must maintain state about resolved instances, but it manages this explicitly through the `instances` array.

### Laravel Octane
Octane's documentation explicitly warns against stateful singletons. The `scoped()` binding was introduced alongside Octane support. Octane's request lifecycle resets scoped instances between requests.

### Spatie Packages
Spatie packages use stateless services. Their service classes accept dependencies via constructor and do not maintain mutable state. This is consistent with their publishing guidelines.

### Community Production Pattern
The community standard (2024–2026) is: `readonly` constructor-promoted properties, no mutable state, `scoped()` for per-request context, method parameters for request-specific data. This pattern is safe under all deployment environments.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — How services are structured and what dependencies they take
- Service Container Basics — Container resolution, singleton, and scoped binding

### Related Topics
- Service Testing — How statelessness enables simple, isolated tests
- Service Orchestration — Maintaining statelessness in composed workflows

### Advanced Follow-up Topics
- Laravel Octane — Worker lifecycle and state management
- Queue Workers — State persistence across job processing
- Service vs Action Decision — How statelessness affects the choice between patterns

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container.php` — `singleton()`, `scoped()`, `forgetScopedInstances()`, `isShared()`
- govigilant.io — Real-world singleton contamination case under Octane (TeamService report)
- michael-rubel/laravel-octane-best-practices — Static property warnings, state management guidelines

### Key Insight
Statelessness is not an architectural preference — it is a correctness requirement in any environment where the process lives longer than one request. PHP-FPM masked this requirement by destroying the process after each request. Octane and queue workers reveal the hidden assumption. Every service should be designed as if it will run under Octane, even if it currently runs under PHP-FPM.

### Version-Specific Notes
- `scoped()` binding: Laravel 8+ (introduced alongside Octane support)
- `readonly` properties: PHP 8.1+
- No version-specific changes to statelessness principles in Laravel 10–13
