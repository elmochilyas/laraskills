# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service binding strategies: singleton vs. transient
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Service binding strategies determine whether a service instance is shared across the application (singleton) or created fresh for each resolution (transient). Under the default Laravel lifecycle (per-request), the distinction is minor—objects are garbage collected per request. Under Octane (per-worker), singletons persist across requests, making state management critical. The rule: default to transient (via `$this->app->bind()`). Use singleton only for services that are provably stateless (no mutable properties, no request-scoped dependencies).

---

# Core Concepts

**Singleton (`$this->app->singleton()`):** One instance shared across the entire application lifetime. Under Octane, this instance persists across multiple requests.

**Transient (`$this->app->bind()`):** A new instance is created every time the class is resolved. Under any lifecycle, each resolution gets a fresh instance.

**The default:** Laravel's container auto-resolution (no explicit binding) creates a new instance each time (transient by default).

---

# Mental Models

**The "Shared Coffee Cup" (singleton):** Everyone uses the same cup. If someone leaves coffee in it, the next person gets coffee residue. Under Octane, the cup persists all day.

**The "Disposable Cup" (transient):** Everyone gets a fresh cup. No residue, no contamination. Slightly more waste (object allocation), but perfectly isolated.

**The "Stateless vs. Stateful" model:** Singleton-safe services have no mutable properties. All dependencies are injected in the constructor, and all request-specific data is passed as method arguments.

---

# Internal Mechanics

```php
// Transient: new instance per resolution
$this->app->bind(InvoiceService::class);

// Singleton: same instance for all resolutions
$this->app->singleton(InvoiceService::class);

// Closure binding: control instance creation
$this->app->bind(InvoiceService::class, function ($app) {
    return new InvoiceService(
        $app->make(InvoiceRepository::class),
        Auth::user(), // DANGER: captures user at resolution time
    );
});
```

---

# Patterns

**Default transient, explicit singleton:** Bind services as transient unless you've audited and confirmed they're stateless:
```php
// Default: transient
$this->app->bind(UserService::class);
$this->app->bind(InvoiceService::class);

// Explicit: singleton (audited and stateless)
$this->app->singleton(CurrencyConverter::class);  // Pure function, stateless
```

**Factory pattern for stateful services:** Create a factory that produces fresh instances:
```php
class InvoiceServiceFactory {
    public function make(User $user): InvoiceService {
        return new InvoiceService(
            app(InvoiceRepository::class),
            $user,
        );
    }
}
```

---

# Architectural Decisions

**Use singleton when:** The service has no mutable state, all dependencies are injected, and creating a new instance is expensive (rare in PHP).

**Use transient when:** The service may have request-scoped state (user, tenant), or you haven't audited it for statelessness. This is the safe default.

**Default to transient for all business services:** The performance cost of transient resolution is negligible. The safety benefit of avoiding state leaks (especially under Octane) is significant.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Singleton: fewer object allocations | Singleton: state leaks under Octane | Cross-request data contamination |
| Transient: no state leaks | Transient: more GC pressure | ~1μs extra per resolution |
| Singleton: faster resolution after first | Singleton: hidden coupling through state | Developers assume isolation, but state persists |

---

# Performance Considerations

Transient resolution adds ~1-5μs per resolution (Reflection, instantiation). Singleton resolution is ~1μs after first (array lookup). The difference is negligible for typical service resolution counts.

---

# Production Considerations

Under Octane, stateful singletons are a top-3 source of production bugs. Audit all singletons for:
- Mutable properties (set during request lifecycle)
- Captured request context (user, tenant)
- Static properties that change per request

---

# Common Mistakes

**Singleton for convenience:** Binding services as singletons "because they don't change." Not auditing for request-scoped dependencies.

**Stateful singleton under Octane:** A service that stores `$this->user` or `$this->request` leaks data between requests. Intermittent, hard-to-debug bugs.

**Factory misuse:** Creating complex factory hierarchies when a simple transient binding suffices. YAGNI.

---

# Failure Modes

**User data leak under Octane:** Singleton `InvoiceService` stores the authenticated user in a property. Request A's user is used for Request B's invoice creation.

**Stale Tenant Context:** Singleton `TenantService` caches the current tenant. After a tenant switch, it still returns the old tenant.

---

# Ecosystem Usage

Laravel's core services (router, config, cache) use singletons because they're genuinely stateless. First-party packages use singletons for their core services. The service container auto-resolution defaults to transient.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-09 Dependency injection | SLP-13 Interface contracts | LAP-15 Octane compatibility |
| SLP-19 Octane service state | SLP-01 Service classes | AEG-09 Octane audit |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
