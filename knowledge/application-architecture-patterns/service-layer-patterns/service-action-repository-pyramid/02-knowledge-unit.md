# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service-Action-Repository pyramid architecture
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The Service-Action-Repository pyramid organizes business logic into three layers with specific responsibilities: Services orchestrate workflows and manage transactions, Actions execute single business operations, and Repositories handle data access. The call chain flows from Controller → Service → Action → Repository. This architecture prevents god services (by splitting operations into actions), centralizes data access (via repositories), and maintains a clear orchestration layer (services).

---

# Core Concepts

**Controller:** Accepts HTTP, delegates to service, returns response.

**Service (top layer):** Orchestrates business workflows. Coordinates multiple actions. Manages transactions. Handles cross-cutting concerns (logging, events).

**Action (middle layer):** Executes a single business operation. Calls repositories for data access. Contains operation-specific logic. Does not call other actions.

**Repository (bottom layer):** Provides data access interface. Encapsulates Eloquent queries. Returns domain objects or models.

```
Request → Controller → Service → Action → Repository → Database
                ↓          ↓          ↓
            Transaction  Single op  Data access
```

---

# Mental Models

**The "Pyramid" model:** Services at the top compose multiple actions. Actions in the middle perform operations. Repositories at the base provide data. Each layer only depends on the layer below it.

**The "Military Chain of Command" model:** Controllers are the front desk (take requests). Services are officers (give orders). Actions are soldiers (execute orders). Repositories are logistics (provide supplies).

**The "Layered Responsibility" model:** Each layer asks "what belongs here?" Services: composition and workflow. Actions: single business operations. Repositories: data access.

---

# Internal Mechanics

```php
class OrderService {
    public function __construct(
        private CreateOrderAction $createOrder,
        private ProcessPaymentAction $processPayment,
        private UpdateInventoryAction $updateInventory,
    ) {}

    public function placeOrder(CheckoutData $data): Order {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrder->execute($data);
            $this->processPayment->execute($order, $data->payment);
            $this->updateInventory->execute($order);
            return $order;
        });
    }
}

class CreateOrderAction {
    public function __construct(
        private OrderRepository $orders,
        private ProductRepository $products,
    ) {}
    public function execute(CheckoutData $data): Order { ... }
}

class OrderRepository {
    public function create(array $data): Order { ... }
}
```

---

# Patterns

**Service as transaction boundary:** The service opens and commits transactions. Actions and repositories don't manage transactions individually.

**Action as leaf node:** Actions never call other actions. If composition is needed, it happens at the service level.

**Repository as abstraction boundary:** Repositories abstract data access. Services and actions depend on repository interfaces, not Eloquent models directly.

---

# Architectural Decisions

**Use all three layers when:** The application has complex workflows that coordinate multiple operations, and you want to avoid god services by splitting operations.

**Use Service + Action (no Repository) when:** Data access is simple (single Eloquent calls). The Repository layer adds complexity without benefit.

**Use Service + Repository (no Action) when:** Operations are simple enough that splitting them into individual actions isn't justified.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear separation of responsibilities | Significant file overhead | One feature = 4+ layers = 8+ files |
| Each class has single responsibility | Call chain navigation overhead | Tracing a request through 4+ layers |
| Testable at each layer | Coordination across layers requires discipline | Actions must not call actions, services must not query directly |

---

# Performance Considerations

Each layer adds a method call and dependency resolution. For most operations this is negligible. For high-throughput operations, consider flattening the pyramid (Service → Model directly).

---

# Production Considerations

Document the call chain convention. Establish: "Services orchestrate. Actions execute. Repositories access data." Violations (service directly calling repository) should be caught in code review.

---

# Common Mistakes

**Action calling action:** The most common violation. Action A depends on Action B. This creates coupling between operations and bypasses the service's coordination role.

**Service doing data access:** A service that calls `Model::where()` directly, bypassing the repository and action layers. This couples orchestration to data access.

**Repository returning Eloquent models:** Repositories that return `Collection` or `LengthAwarePaginator` from Eloquent. This leaks ORM coupling to the action layer.

---

# Failure Modes

**All three layers are the same file:** The service method, action logic, and repository query are all in one method. The structure exists on paper but not in practice.

**Pyramid becomes flat:** Over time, actions are removed and services directly access repositories. The action layer atrophies.

---

# Ecosystem Usage

The `lorisleiva/laravel-actions` package supports the action layer in the pyramid. The `Modulate` package scaffolds the full pyramid structure. Pulsar (community pattern) explicitly defines the service-action-repository call chain.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-05 DTO pattern | SLP-10 Service vs Action vs Use Case |
| SLP-02 Action classes | SLP-14 Repository debate | SLP-11 Transaction management |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
