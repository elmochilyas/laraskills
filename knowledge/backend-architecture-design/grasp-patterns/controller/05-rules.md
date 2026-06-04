## Rule 1: A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
---
## Category
Architecture
---
## Rule
The Controller receives input, translates it into a domain command, and delegates to a use case handler. It does not implement business logic.
---
## Reason
Controllers that contain business logic cannot be reused across different transports, are hard to test, and violate SRP.
---
## Bad Example
```php
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        $total = $request->qty * $request->price; // business logic
        Order::create(['total' => $total, 'status' => 'pending']);
        return response()->json(['id' => $order->id]);
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
        $command = new PlaceOrder(
            items: $request->toItems(),
            customerId: $request->user()->id
        );
        $orderId = $this->service->placeOrder($command);
        return response()->json(['id' => $orderId], 201);
    }
}
```
---
## Exceptions
Trivial field formatting or transport-level validation that is purely presentational.
---
## Consequences Of Violation
Business logic scattered in controllers, untestable logic, transport coupling.
---
## Rule 2: A Controller does not create the objects it delegates to — receive them via DI
---
## Category
Architecture
---
## Rule
Dependencies (services, repositories, validators) must be injected via constructor; Controllers should not instantiate their collaborators.
---
## Reason
Instantiation in Controllers couples them to concrete implementations, making testing and substitution impossible without modifying the Controller.
---
## Bad Example
```php
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        $service = new OrderService(new EloquentOrderRepository());
        return $service->placeOrder($request->toDto());
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(
        private OrderService $service
    ) {}

    public function store(OrderRequest $request): JsonResponse
    {
        return $this->service->placeOrder($request->toDto());
    }
}
```
---
## Exceptions
Factory methods that live in the Controller for creating DTOs from request data (pure data, no logic).
---
## Consequences Of Violation
Hard to test, concrete coupling, DI bypassed.
---
## Rule 3: Keep Controllers thin—less than 15 lines of logic excluding DI and validation
---
## Category
Architecture
---
## Rule
Controller methods should be minimal: validate request, build DTO/command, delegate to service, return response. Any logic beyond this belongs in a service.
---
## Reason
Fat controllers accumulate business logic, becoming untestable and violating SRP.
---
## Bad Example
```php
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        $this->validate($request, [...]);
        $discount = 0;
        if ($request->total > 1000) { $discount = 0.1; }
        $items = collect($request->items)->map(fn($i) => ...);
        $order = Order::make([...]);
        $order->calculate($discount);
        $order->save();
        Mail::to($request->user())->send(new OrderConfirmation($order));
        Log::info('Order placed', ['id' => $order->id]);
        return response()->json($order, 201);
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(private OrderService $orderService) {}

    public function store(OrderRequest $request): JsonResponse
    {
        $result = $this->orderService->placeOrder($request->toPlaceOrderCommand());
        return response()->json($result, 201);
    }
}
```
---
## Exceptions
When the Controller acts as a Facade for a very simple CRUD operation (single model save).
---
## Consequences Of Violation
Fat controllers, untestable, business logic coupled to HTTP.
---
## Rule 4: One Controller per aggregate or use-case group—not per entity
---
## Category
Architecture
---
## Rule
Group related use cases into one Controller class (e.g., `OrderController` with place, cancel, return). Avoid creating Controllers for every single entity.
---
## Reason
Too many tiny Controllers cause navigation overhead; too few create God Controllers. One per aggregate/use-case group balances readability and maintainability.
---
## Bad Example
```
OrderCreateController, OrderCancelController, OrderReturnController, OrderStatusController — 4 files for one aggregate
```
---
## Good Example
```
OrderController — handles: place, cancel, return, status
```
---
## Exceptions
When the use cases are completely unrelated in terms of dependencies and would benefit from separate DI configurations.
---
## Consequences Of Violation
File proliferation or God Controllers.
