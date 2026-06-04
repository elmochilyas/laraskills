## Service As Transaction Boundary
---
## Architecture
---
## Rule
Place transaction boundaries in the Service layer only. Services open and commit transactions. Actions and repositories must not manage transactions.
---
## Reason
The service defines the unit of work. All operations within a transaction either succeed or fail together. Actions and repositories don't own the consistency boundary.
---
## Bad Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            return Order::create($data);
        });
    }
}

class OrderRepository
{
    public function save(Order $order): Order
    {
        return DB::transaction(fn() => $order->save()); // Transaction at repository level
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->reserveInventoryAction->execute($order);
            $this->processPaymentAction->execute($order);
            return $order;
        });
    }
}

// Actions do not manage transactions
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return Order::create($data);
    }
}
```
---
## Exceptions
No common exceptions. Transaction management belongs exclusively in the Service layer.
---
## Consequences Of Violation
Nested transactions (inner becomes savepoint), partial commits, inconsistent data, action composition failure.

## Action As Leaf Node — Never Call Other Actions
---
## Architecture
---
## Rule
Actions must be leaf nodes in the call graph. An action must never call another action. Composition of multiple actions belongs at the Service layer.
---
## Reason
Actions calling actions creates opaque call graphs, couples leaf operations, and prevents the service from managing the workflow and transaction boundary.
---
## Bad Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        $order = Order::create($data);
        $this->reserveInventoryAction->execute($order); // Action calling action
        return $order;
    }
}
```
---
## Good Example
```php
class CheckoutService // Service orchestrates
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->reserveInventoryAction->execute($order);
            $this->processPaymentAction->execute($order);
            return $order;
        });
    }
}

// Each action is a leaf node
class CreateOrderAction
{
    public function execute(array $data): Order { /* leaf */ }
}

class ReserveInventoryAction
{
    public function execute(Order $order): void { /* leaf */ }
}
```
---
## Exceptions
No common exceptions. Action-to-action calls are always an architecture violation.
---
## Consequences Of Violation
Opaque call graphs, coupled leaf operations, bypassed service orchestration, transaction boundary confusion.

## Service Must Not Do Direct Data Access
---
## Architecture
---
## Rule
Services must not perform direct data access (Eloquent queries, raw SQL). Services call actions or repositories that encapsulate data access.
---
## Reason
A service doing data access couples the orchestration layer to the data source, bypassing abstraction layers and making it harder to change data sources.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $product = Product::where('sku', $data['sku'])->first(); // Direct data access
            $order = Order::create([...$data, 'total' => $product->price]);
            return $order;
        });
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function __construct(
        private ProductRepository $products,
        private CreateOrderAction $createOrder,
    ) {}

    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $product = $this->products->findBySku($data['sku']);
            return $this->createOrder->execute($data, $product);
        });
    }
}
```
---
## Exceptions
Simple read operations where adding a repository layer adds unacceptable overhead for the project's context.
---
## Consequences Of Violation
Orchestration coupled to data access, difficult to switch data sources, bypassed repository abstraction.

## Repository As Abstraction Boundary
---
## Architecture
---
## Rule
Use repositories as the abstraction boundary for data access. Services and actions depend on repository interfaces, not on Eloquent directly.
---
## Reason
Repository interfaces decouple business logic from data access implementation, enabling testing with in-memory implementations and future data-source swaps.
---
## Bad Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return Order::create($data); // Direct Eloquent dependency
    }
}
```
---
## Good Example
```php
class CreateOrderAction
{
    public function __construct(private OrderRepository $orders) {}

    public function execute(array $data): Order
    {
        return $this->orders->create($data); // Depends on interface
    }
}

interface OrderRepository
{
    public function create(array $data): Order;
    public function findById(int $id): ?Order;
}
```
---
## Exceptions
Simple CRUD applications where the overhead of repository interfaces is not justified. Prototype-stage development.
---
## Consequences Of Violation
Business logic coupled to Eloquent, difficult to test without database, hard to switch data sources.

## Each Layer Depends Only Below It
---
## Architecture
---
## Rule
Each layer must depend only on the layer below it. Controller depends on Service. Service depends on Action. Action depends on Repository. No layer skips or depends multiple layers.
---
## Reason
The strict one-directional dependency chain prevents circular dependencies, keeps responsibilities clear, and enforces the architecture.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        // Service skips Action layer, uses Repository directly
        $product = $this->productRepo->findBySku($data['sku']);
        return $this->createOrderAction->execute($data, $product);
    }
}
```
---
## Good Example
```php
// Controller → Service → Action → Repository → Database
class CheckoutController
{
    public function store(Request $request): JsonResponse
    {
        $order = $this->checkoutService->checkout($request->validated());
        return response()->json($order, 201);
    }
}

class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            return $this->createOrderAction->execute($data);
        });
    }
}

class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return $this->orders->create($data);
    }
}
```
---
## Exceptions
No common exceptions. The dependency direction is the foundation of the pyramid architecture.
---
## Consequences Of Violation
Circular dependencies, confused responsibilities, architecture erosion, resistance to change.

## Document The Call Chain Convention
---
## Maintainability
---
## Rule
Document the call chain convention explicitly and enforce it during code review. Every developer must know: "Services orchestrate. Actions execute. Repositories access data."
---
## Reason
Without documented conventions, developers make inconsistent choices, and the architecture degrades over time as shortcuts are taken.
---
## Bad Example
```php
// No documented convention — each developer builds differently
// Developer A: Controller → Service → Model directly
// Developer B: Controller → Action → Service → Repository
// Developer C: All logic in Controller
// No one can predict where to find logic
```
---
## Good Example
```php
// Documented in project README or ADR:
// Call Chain: Controller → Service → Action → Repository → Database
// - Controllers: HTTP handling only (validate, call service, respond)
// - Services: orchestration + transaction management
// - Actions: single business operations (leaf nodes)
// - Repositories: data access abstraction

// All code reviews verify compliance with this chain
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent architecture across features, pattern soup, confusion about where logic belongs, difficulty onboarding.

## Repository Should Return Domain Types, Not Raw Queries
---
## Architecture
---
## Rule
Repository methods should return domain objects (Eloquent models, DTOs, or value objects), not raw query builders or arrays.
---
## Reason
Repository is an abstraction boundary. Returning raw queries or arrays leaks implementation details to the action layer.
---
## Bad Example
```php
class OrderRepository
{
    public function findOverdue(int $days): Builder // Returns query builder
    {
        return Order::where('status', 'pending')
            ->where('created_at', '<', now()->subDays($days));
    }
}

// Action has to finish the query:
$orders = $this->orders->findOverdue(30)->get();
```
---
## Good Example
```php
class OrderRepository
{
    public function findOverdue(int $days): Collection // Returns domain objects
    {
        return Order::where('status', 'pending')
            ->where('created_at', '<', now()->subDays($days))
            ->get();
    }
}

// Action calls and gets complete result
$orders = $this->orders->findOverdue(30);
```
---
## Exceptions
Query objects that are designed to be composable (builder pattern) with multiple chainable methods.
---
## Consequences Of Violation
Leaked ORM coupling to action layer, duplicated query completion logic, inconsistent return types.

## Avoid Pyramid Becomes Flat
---
## Architecture
---
## Rule
Do not let the action layer atrophy. If actions are removed and services access repositories directly, the pyramid collapses and the architecture loses its benefits.
---
## Reason
Without the action layer, services either become god orchestrators doing everything or data access leaks into the orchestration layer.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->orders->create($data); // Service directly uses repository
            $this->inventory->decrement($order->items); // No action layer
            return $order;
        });
    }
}
// Action layer removed — services do everything
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->reserveInventoryAction->execute($order);
            return $order;
        });
    }
}
// Action layer maintained — each operation independently testable
```
---
## Exceptions
Simple CRUD operations where the action layer adds no benefit. The pyramid is only needed for complex workflows.
---
## Consequences Of Violation
Loss of independent testability for operations, service layer becomes monolithic, architecture erosion.
