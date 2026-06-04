# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Interface contracts for services: when and why
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Interface contracts for services (e.g., `UserServiceInterface` → `UserService`) are a debated practice in the Laravel community. Proponents argue they enable loose coupling, test mocking, and implementation swapping. Critics argue they add ceremony without value when only one implementation exists or will ever exist. The pragmatic consensus: add interfaces only when you need multiple implementations (different drivers, testing with mocks, legacy integration), when the interface is shared across module boundaries, or when the contract is consumed via Dependency Inversion in cleaner architectures.

---

# Core Concepts

An interface contract declares what a service does without specifying how:

```php
interface PaymentService {
    public function charge(string $customerId, Money $amount): PaymentResult;
    public function refund(string $paymentId): PaymentResult;
}

class StripePaymentService implements PaymentService { ... }
class PinPaymentService implements PaymentService { ... }
```

---

# Mental Models

**The "YAGNI" model (default):** You Ain't Gonna Need It. If only one implementation of a service exists, an interface is speculative overhead. Add the interface when a second implementation is needed.

**The "Contract Boundary" model:** Interfaces define boundaries between architectural layers or modules. They're the "ports" in Ports and Adapters. If the consumer and implementer are in different layers/modules, an interface is justified.

**The "Testing Convenience" model:** Interfaces make mocking straightforward in tests. Without an interface, you can still mock concrete classes (Laravel's container supports mocking concrete classes), but interfaces are cleaner.

---

# Internal Mechanics

```php
// Interface
interface InvoiceService {
    public function create(array $data): Invoice;
    public function find(string $id): ?Invoice;
}

// Implementation
class DefaultInvoiceService implements InvoiceService { ... }

// Binding
$this->app->bind(InvoiceService::class, DefaultInvoiceService::class);

// Consumption (depends on interface, not concrete)
class InvoiceController {
    public function __construct(private InvoiceService $service) {}
}
```

---

# Patterns

**Interface-per-service when:** The service is consumed by another module or layer, the service has multiple possible implementations, or you're following Clean Architecture port-adapter.

**No interface when:** The service is consumed only within the same layer/module, there's only one implementation, and no planned alternative.

**Local interface (minimal):** If you want interface benefits without ceremony, define the interface next to the implementation and use it locally.

---

# Architectural Decisions

**Add interface for:** Payment gateways, notification channels, file storage, cache backends—anywhere multiple implementations are likely.

**Skip interface for:** Business services (UserService, OrderService) that have a single implementation and no planned alternative.

**Use only when a variation point exists or is imminent:** The interface-driven overhead (binding registration, documentation) is only justified when there's actual variation.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Swappable implementations | Extra file per service | 2 files instead of 1 for each service |
| Easy mocking in tests | Binding registration overhead | Must maintain service provider bindings |
| Clear separation of contract from implementation | Indirection for single-implementation services | Developers jumping through unnecessary files |
| Formalizes module boundaries | Can lead to interface-per-class syndrome | Every class has an interface, even Value Objects |

---

# Performance Considerations

Interface dispatch has negligible overhead. PHP 8+ JIT eliminates the virtual call cost.

---

# Production Considerations

Consistency matters more than the specific choice. If the team decides to use interfaces, use them for all services. If not, don't.

---

# Common Mistakes

**Interface-per-class without reason:** Every service class has an interface, including those with only one implementation and no planned alternative. Ceremony without value.

**Interface that mirrors implementation exactly:** The interface has the same methods with the same signatures. The interface provides no abstraction—it's just a pass-through.

**Missing interfaces when swapping is needed:** A payment service without an interface that needs to switch from Stripe to PayPal mid-project. The lack of interface makes the swap harder.

---

# Failure Modes

**Interface/implementation drift:** The interface and implementation diverge over time (a method is added to the implementation but not the interface). Type errors occur when consumers depend on the interface.

**Interface pollution:** A single interface with 20+ methods covering every possible use case. The interface is too large—split by client needs.

---

# Ecosystem Usage

Taylor Otwell has stated that he doesn't use the Repository pattern or interface-per-service in most projects. However, interface contracts are fundamental to Clean Architecture and Hexagonal Architecture. Spatie uses interfaces for variation points (file systems, cache backends).

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-09 Dependency injection | CPC-01 Interface contracts | SLP-14 Repository pattern debate |
| SLP-12 Service binding strategies | LAP-04 Dependency Rule | LAP-09 Framework independence |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
