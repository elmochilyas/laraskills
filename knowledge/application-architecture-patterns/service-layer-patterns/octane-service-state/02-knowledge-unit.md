# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service layer in Octane: state management considerations
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Octane fundamentally changes assumptions about service layer state. Under Octane's persistent worker model, services are resolved once per worker, not once per request. Services with mutable properties, captured request context, or static state cause cross-request contamination. The solution: services must be stateless. All request-specific data (authenticated user, tenant context) must be passed as method parameters, not stored as service properties. The service layer should default to transient binding and be audited for any mutable state.

---

# Core Concepts

**Stateless service contract:**
- No mutable properties (everything is `readonly` or not set after construction)
- No captured request context (no `$this->user`, `$this->request`)
- All request data passed as method parameters
- Dependencies are injected into constructor (stateless: repositories, services)
- Dependencies are passed as method arguments (stateful: user, tenant)

---

# Mental Models

**The "Pure Function" ideal:** Service methods should behave like pure functions. Given the same arguments, they produce the same result regardless of when they're called or by which request.

**The "No Hidden State" rule:** If a service has any property that changes after construction, it's stateful and unsafe for Octane.

**The "Transient by Default, Singleton by Proof" rule:** Bind every service as transient unless you can prove it's stateless. Proof requires code audit, not assumption.

---

# Internal Mechanics

```php
// UNSAFE under Octane (stateful)
class InvoiceService {
    private ?User $currentUser = null;

    public function setUser(User $user): void {
        $this->currentUser = $user;
    }

    public function createInvoice(array $data): Invoice {
        return $this->currentUser->invoices()->create($data);
    }
}

// SAFE under Octane (stateless)
class InvoiceService {
    public function createInvoice(User $user, array $data): Invoice {
        return $user->invoices()->create($data);
    }
}
```

**Binding strategies under Octane:**
```php
class AppServiceProvider extends ServiceProvider {
    public function register(): void {
        // Transient (safe - new instance per request)
        $this->app->bind(InvoiceService::class);

        // Singleton (only if provably stateless)
        $this->app->singleton(CurrencyConverter::class);
    }
}
```

---

# Patterns

**Stateless service pattern:** All constructor dependencies are injectable, stateless services. All request-specific state is method arguments:
```php
class OrderService {
    public function __construct(
        private OrderRepository $orders,    // Stateless
        private InventoryService $inventory, // Stateless
    ) {}

    public function placeOrder(User $user, Cart $cart, PaymentMethod $payment): Order {
        // user, cart, payment are method arguments, not stored
        return DB::transaction(function () use ($user, $cart, $payment) {
            $order = $this->orders->create($user, $cart);
            $this->inventory->reserve($cart->items());
            return $order;
        });
    }
}
```

**Context object pattern:** Pass request context as a value object:
```php
class RequestContext {
    public function __construct(
        public readonly User $user,
        public readonly ?Tenant $tenant,
        public readonly string $locale,
        public readonly string $ipAddress,
    ) {}
}

class OrderService {
    public function placeOrder(Cart $cart, RequestContext $context): Order { ... }
}
```

---

# Architectural Decisions

**Default to transient for all services:** No performance penalty for transient under Octane. Safety is more valuable than micro-optimization.

**Add singleton binding only for provably stateless services:** Services with no mutable properties and no request-scoped dependencies.

**Use factory pattern for creating services that need request context:** The factory receives the context and creates service instances per request.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Octane-safe service layer | Request context must be passed explicitly | Service method signatures include user, tenant, locale params |
| No cross-request state leaks | More verbose method signatures | Every method's arguments include context |
| Predictable service behavior | Context objects needed for complex state | Additional DTO/context classes |

---

# Performance Considerations

Transient service resolution under Octane creates more objects per request than singletons. PHP 8+ memory management handles this well. The difference is typically <50μs per resolution.

---

# Production Considerations

Audit existing service layer for Octane before enabling it. Look for:
- `$this->user` or `$this->currentUser` on services
- Mutable properties (`private $status`, `private $result`)
- Static properties that vary per request
- Services that call `Auth::user()` in constructor
- Factory closures that capture request state

---

# Common Mistakes

**Assuming Octane doesn't change service behavior:** The most common mistake. "It works in development (single request) so it should work in production."

**Storing Auth user in service property:** `$this->user = Auth::user()` in the service constructor or setter. Leaks users across requests.

**Singleton for performance without audit:** Binding a service as singleton to "improve performance" without verifying it's stateless.

---

# Failure Modes

**User data leak:** Service stores `$this->user = Auth::user()`. Request A's admin user is used to create an invoice for Request B. The invoice is attributed to the wrong user.

**Tenant cross-contamination:** Multi-tenant app where tenant context stored on service leaks to other tenants. Data privacy violation.

**Intermittent bugs that can't be reproduced in development:** Bugs appear in production (Octane) but not in development (FPM). Classic stateful service symptom.

---

# Ecosystem

Laravel Octane documentation explicitly warns about stateful services. The community has developed the "transient by default" convention specifically for Octane compatibility. Spatie's packages are audited for Octane safety.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-15 Octane compatibility | SLP-12 Service binding strategies | LAP-09 Framework independence |
| SLP-09 Dependency injection | SLP-18 Anemic domain model | AEG-09 Refactoring remediation |

---

## Ecosystem Usage



---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
