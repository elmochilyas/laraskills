# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Octane compatibility considerations for layered architecture
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Octane (Roadrunner or Swoole) changes Laravel's memory model from "per-request" to "per-worker." Objects instantiated once persist across requests. This fundamentally impacts layered architecture: service classes with request-scoped state become buggy, singleton bindings must be stateless, and the pattern of injecting authenticated user or tenant context into services creates cross-request contamination. Every architectural layer (Application, Domain, Infrastructure, Presentation) must be audited for request-scoped state when running under Octane.

---

# Core Concepts

**The Octane memory model:**
- Default Laravel: All objects are created and destroyed per request. State is safe.
- Octane: The application boots once. Objects persist in memory across requests. State leaks are possible.

**Stateful vs. Stateless services:**
- Stateless: No mutable properties. Safe for Octane singletons.
- Stateful: Mutable properties that change during request life cycle. Unsafe if bound as singleton.

**Request-scoped dependencies:** `$request->user()`, tenant context, locale, `Auth::id()` must be retrieved fresh each request, not stored as service properties.

---

# Mental Models

**The "No Mutable State" model:** Under Octane, assume any mutable property on an injected service will be visible to the next request. If you set `$this->user` on a service, request B will see request A's user.

**The "Fresh per Request" model:** Scalars, arrays, and objects that vary by request must be fetched fresh inside each method call, not stored on the service instance.

**The "Singleton vs. Transient" model:** Octane makes the distinction critical. Singletons persist across requests. Transients are created per request. Stateless services = singleton. Stateful or request-scoped = transient (or factory).

---

# Internal Mechanics

```php
// Problematic: stateful singleton under Octane
class InvoiceService {
    private ?User $user = null;  // Mutable state!

    public function setUser(User $user): void { $this->user = $user; }
    public function createInvoice(array $data): Invoice {
        return $this->user->invoices()->create($data); // Wrong user for next request
    }
}

// Safe: stateless, user fetched per method
class InvoiceService {
    public function createInvoice(array $data): Invoice {
        $user = Auth::user(); // Fresh per request
        return $user->invoices()->create($data);
    }
}
```

Service container binding strategy:
```php
// Risky: singleton retains state across requests
$this->app->singleton(InvoiceService::class);

// Safe: transient creates new instance per request
$this->app->bind(InvoiceService::class);

// Or: use closure factory
$this->app->bind(InvoiceService::class, fn($app) => new InvoiceService(
    $app->make(InvoiceRepository::class),
    Auth::user()  // Captured at resolution timeâ€”may be stale!
));
```

---

# Patterns

**Stateless service pattern:** All dependencies injected in constructor. All request-specific data passed as method parameters:
```php
class CreateInvoiceUseCase {
    public function __construct(
        private InvoiceRepository $invoices,
        private EventBus $events,
    ) {}

    public function execute(CreateInvoiceDto $dto, User $user): Invoice {
        // User passed explicitly, not stored as property
        $invoice = Invoice::create($user, ...);
        $this->invoices->save($invoice);
        $this->events->dispatch(new InvoiceCreated($invoice->id()));
        return $invoice;
    }
}
```

**Context object pattern:** Pass request context (user, tenant, locale) as a value object through the call chain instead of storing it on services.

**Factory pattern for request-scoped services:** Use a factory to create service instances with per-request configuration:
```php
$this->app->bind(InvoiceService::class, function ($app) {
    return new InvoiceService(
        $app->make(InvoiceRepository::class),
        Auth::user(),
    );
});
```

---

# Architectural Decisions

**Bind services as transient unless they are provably stateless:** Default to `$this->app->bind()` (transient). Add `->singleton()` only after auditing the class for mutable state.

**Avoid storing request context on Domain entities:** Domain entities should receive context as method parameters, not via injected services.

**Use action classes for Octane-safe operations:** Action classes with no constructor state are naturally Octane-safe. They receive all input via `execute()` parameters.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Octane-safe architecture | All services must be stateless | Request context must be passed through method chains |
| Improved performance from Octane | Architectural audit required for Octane migration | Existing stateful services need refactoring |
| Singletons for truly stateless services | Transient services create more garbage collection | Increased memory allocation per request |

---

# Performance Considerations

Octane's performance benefit comes from avoiding framework bootstrap per request. Stateless services support this pattern. Transient service binding creates more objects per request (GC pressure) but is safe.

The performance difference between singleton and transient service binding under Octane is typically negligible for most services. Profile before optimizing.

---

# Production Considerations

Audit existing service layer for state before enabling Octane. Common stateful patterns:
- `$this->user = Auth::user()` in service constructors or `setUser()` methods
- `$this->tenant` stored on services
- Mutable properties set during request lifecycle
- Static properties on service classes

---

# Common Mistakes

**Storing Auth::user() in constructor:** Services that capture request context in the constructor. Under Octane, this captures the user from the first request on that worker, not the current request.

**Using singletons for everything:** Defaulting to singleton binding without auditing for state. This is safe in traditional Laravel (per-request) but breaks under Octane.

**Static state:** `public static $currentUser` on a service class. Under Octane, this is globally shared across all requests on the same worker.

---

# Failure Modes

**User data leak:** Request A creates an invoice as Admin User A. Request B (same worker) calls `createInvoice` and the service uses User A's identity. Bug is intermittent and hard to reproduce.

**Tenant data cross-contamination:** Multi-tenant application where tenant context stored on a singleton service leaks tenant A's data to tenant B's requests.

**Silent corruption:** Stateful services that work correctly in development (single request) but fail intermittently in production (Octane, multiple requests per worker).

---

# Ecosystem Usage

Laravel Octane explicitly documents stateful service risks. All first-party packages (Horizon, Telescope, Pulse) are Octane-safe. Community packages like Spatie's must be audited separately.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-06 Application layer | SLP-19 Octane service state | SLP-12 Service binding strategies |
| Octane architecture basics | SLP-09 Dependency injection | SLP-18 Anemic domain model |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche—most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
