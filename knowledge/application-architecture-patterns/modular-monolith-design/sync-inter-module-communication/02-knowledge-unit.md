# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module synchronous communication via contracts
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Synchronous inter-module communication happens when Module A needs a response from Module B before proceeding. The canonical pattern uses contracts (interfaces): Module A depends on a contract interface that Module B implements. Module A never imports Module B directly. The contract lives in a shared location or is owned by the providing module. This maintains module independence while enabling type-safe, traceable communication without network overhead.

---

# Core Concepts

**Contract (interface):** A PHP interface that defines what the providing module exposes to consumers. The contract is the API boundary between modules:
```php
// Contracts/InvoiceService.php (owned by Billing module)
interface InvoiceService {
    public function createForOrder(OrderData $data): InvoiceData;
    public function find(string $id): ?InvoiceData;
}
```

**Consumer (Module A):** Depends on the contract, not the implementation. Uses Laravel's service container to receive the implementation at runtime.

**Provider (Module B):** Implements the contract. The implementation is internal to the module; external code only sees the contract.

---

# Mental Models

**The "API Without Network" model:** Think of contracts as internal APIs. Module A calls Module B through the contract interface, just as it would call a remote service over HTTP. The contract is the boundary.

**The "Interface Ownership" model:** The providing module owns the interface. It defines what it offers and is responsible for backward compatibility. Consumer modules depend on the owner's interface.

**The "Compile-time Safety, Runtime Flexibility" model:** At compile time (type-checking), the contract provides full type safety. At runtime, Laravel's container resolves the implementation. No network calls, no serialization.

---

# Internal Mechanics

```php
// 1. Contract defined in Billing module
namespace Modules\Billing\Contracts;
interface InvoiceService {
    public function createForOrder(array $orderData): InvoiceData;
}

// 2. Implementation in Billing module
namespace Modules\Billing\Services;
class BillingInvoiceService implements InvoiceService { ... }

// 3. Binding in Billing service provider
class BillingServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(InvoiceService::class, BillingInvoiceService::class);
    }
}

// 4. Consumption in Catalog module
use Modules\Billing\Contracts\InvoiceService;
class OrderService {
    public function __construct(private InvoiceService $invoices) {}
    public function completeOrder(Order $order): void {
        $invoice = $this->invoices->createForOrder($order->toArray());
        // ...
    }
}
```

---

# Patterns

**Contract in providing module only:** The interface is defined in the providing module's `Contracts/` directory. Consumer modules import it. No shared contracts directory needed.

**Shared contracts module:** All contracts live in a shared `Contracts/` namespace or a dedicated `app/Contracts/` directory. Easier discovery but creates shared coupling.

**DTO objects as contract payloads:** Contract methods accept and return DTOs (Data Transfer Objects) rather than domain entities. DTOs are part of the contract and should be versioned.

---

# Architectural Decisions

**Use contracts when:** Module A needs a synchronous response from Module B. The operation must complete before the response is returned to the client.

**Use events when:** Module A needs to notify Module B but doesn't need a response. The notification can happen asynchronously.

**Avoid contracts when:** The modules should not be coupled at all (use events), or the modules should actually be merged (the boundary is wrong).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Type-safe inter-module communication | Module coupling (compile-time dependency) | Catalog module depends on Billing module's interface |
| No network overhead | Contract version management | Changing a contract breaks all consumers |
| Easy to mock for testing | Contract design requires upfront thought | Poorly designed contracts are hard to change |
| Laravel container handles DI | Interface proliferation | Every interaction between modules needs an interface |

---

# Performance Considerations

Synchronous contract calls are PHP method calls (microseconds). This is the fastest inter-module communication mechanism and should be the default for operations that need immediate response.

---

# Production Considerations

Contract changes are breaking changes. All consuming modules must be updated atomically (same deployment). This is fine in a monolith but requires coordination.

---

# Common Mistakes

**Implementation in contract namespace:** Placing the implementation class in the contract interface's namespace. The contract directory should only contain interfaces.

**Too many contracts:** Creating a separate interface for every cross-module interaction. Group related methods into logical service interfaces.

**Domain entities in contracts:** Contract methods that accept or return Eloquent models. Contract parameters should be DTOs or primitives to maintain decoupling.

---

# Failure Modes

**Circular contract dependency:** Module A's contract depends on Module B's contract, which depends on Module A's contract. This prevents module independence. Resolve by extracting shared contracts or merging modules.

**Contract drift:** The contract interface changes but the implementation doesn't match. PHP catches this at runtime (missing method errors). Test coverage should catch it before production.

---

# Ecosystem Usage

The `Modulate` package enforces contract-only cross-module access. The `laravel-brick` package provides typed bridges for module communication.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-05 Module autonomy | MMD-07 Async inter-module communication | CPC-01 Interface contracts |
| MMD-03 Module internal structure | CPC-02 Domain events | CPC-07 Bridge/adapter pattern |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
