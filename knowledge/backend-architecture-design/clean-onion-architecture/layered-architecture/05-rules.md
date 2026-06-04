## Rule 1: Enforce strict layer dependency direction—Presentation → Application → Domain → Infrastructure
---
## Category
Architecture
---
## Rule
Each layer may only depend on the layer directly below it; never skip or reverse the direction; enforce with Deptrac/PHPArkitect.
---
## Reason
Layer skipping creates hidden coupling; reversed dependencies turn the architecture into a tangled mess that cannot be tested or swapped.
---
## Bad Example
```php
// Presentation layer directly accesses infrastructure
class UserController
{
    public function __construct(private EloquentUserRepository $repo) {}
}
```
---
## Good Example
```php
// Presentation → Application → Domain → Infrastructure
class UserController
{
    public function __construct(private UserService $service) {}
}
```
---
## Exceptions
When a cross-cutting concern (logging, auth, caching) is shared via the infrastructure layer and accessed through interfaces.
---
## Consequences Of Violation
Tight coupling, untestable code, inability to swap implementations.

> **ECC Context Note:** Layered architecture patterns often prescribe interfaces between every layer. The ECC default takes a pragmatic approach: skip the interface layer when using direct Eloquent for standard CRUD operations inside Actions. Introduce repository interfaces only when justified by the Repository Justification Criteria in `docs/architecture-decisions/repository-vs-direct-eloquent.md`. This rule applies strictly when formal layered architecture has been explicitly adopted.
---
## Rule 2: Isolate the Domain layer — zero framework or infrastructure imports
---
## Category
Architecture
---
## Rule
The Domain layer must not import any framework class (Eloquent, Request, DB, Cache, etc.); it should be plain PHP with domain primitives.
---
## Reason
Framework-coupled domain logic cannot be unit-tested without the framework, cannot be reused, and violates DIP.
---
## Bad Example
```php
// Domain layer depends on Eloquent
class Order
{
    public function calculateTotal(): void
    {
        $taxRate = TaxRate::where('region', $this->region)->first();
    }
}
```
---
## Good Example
```php
class Order
{
    public function __construct(
        private Money $total,
        private Region $region
    ) {}

    public function calculateTotal(TaxRateProvider $tax): Money
    {
        $rate = $tax->forRegion($this->region);
        return $this->total->multiplyBy($rate);
    }
}
```
---
## Exceptions
Laravel's facades, helpers, or global functions inside domain classes, even if convenient.
---
## Consequences Of Violation
Framework lock-in, slow tests, domain logic mixed with infrastructure concerns.
---
## Rule 3: Never put business logic in the Presentation layer
---
## Category
Architecture
---
## Rule
Controllers, routes, and views must only handle HTTP concerns (request parsing, response formatting) and delegate all business logic to the Application layer.
---
## Reason
Business logic in controllers cannot be reused across transports (CLI, queue, API), cannot be tested without HTTP, and violates SRP.
---
## Bad Example
```php
class OrderController
{
    public function store(Request $request)
    {
        $total = $request->quantity * $request->price; // business logic
        if ($total > 1000) { $total *= 0.9; } // discount logic
        Order::create(['total' => $total]);
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(private OrderService $service) {}

    public function store(OrderRequest $request): JsonResponse
    {
        $order = $this->service->placeOrder($request->toDto());
        return response()->json($order, 201);
    }
}
```
---
## Exceptions
Trivial field formatting or validation that is purely UI-driven (e.g., masking phone numbers for display).
---
## Consequences Of Violation
Code duplication, testing difficulty, coupling to HTTP transport.
---
## Rule 4: Layer boundaries must be stable—do not cross them with shortcuts or "temporary" bypasses
---
## Category
Architecture
---
## Rule
Never bypass a layer with a direct dependency "just for now"; temporary bypasses become permanent.
---
## Reason
Each shortcut erodes the architecture until the layer isolation is meaningless; the architecture degrades incrementally.
---
## Bad Example
```php
// "Temporary" — controller directly queries DB for a report
$report = DB::table('orders')->selectRaw('...')->get();
```
---
## Good Example
```php
// Goes through proper layers
class ReportController
{
    public function __construct(private ReportService $service) {}
}
```
---
## Exceptions
During active refactoring when the bypass is tracked in an ADR and has a removal date.
---
## Consequences Of Violation
Architectural drift, untestable code, eventual monolith.
---
## Rule 5: Handle cross-cutting concerns via infrastructure-layer decorators, not domain mixins
---
## Category
Architecture
---
## Rule
Logging, caching, transaction management, and authorization should wrap domain services as decorators in the infrastructure layer.
---
## Reason
Cross-cutting concerns in domain or application layers scatter logic and violate SRP.
---
## Bad Example
```php
class PlaceOrderUseCase
{
    public function execute(OrderDto $dto): Order
    {
        DB::beginTransaction(); // infrastructure concern in app layer
        Log::info('Placing order...');
        $order = $this->orderRepo->save($dto);
        DB::commit();
        return $order;
    }
}
```
---
## Good Example
```php
// Infrastructure decorator wraps application service
class LoggingOrderService implements OrderServiceInterface
{
    public function __construct(private OrderServiceInterface $inner) {}
    public function placeOrder(OrderDto $dto): Order
    {
        Log::info('Placing order...');
        return $this->inner->placeOrder($dto);
    }
}
```
---
## Exceptions
When the "cross-cutting concern" is actually a domain invariant that belongs in the domain layer (e.g., "order total must never exceed credit limit").
---
## Consequences Of Violation
Scattered cross-cutting logic, untestable layers, SRP violation.
