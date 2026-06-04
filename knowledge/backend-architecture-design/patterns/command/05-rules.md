## Rule 1: Encapsulate a request as an object (Command)
---
## Category
Architecture
---
## Rule
Define a Command class for each operation, containing all the information needed to perform it, including the receiver to invoke.
---
## Reason
Encapsulating requests as objects enables parameterization, queuing, logging, and undo of operations.
---
## Bad Example
```php
class OrderController
{
    public function cancel(int $orderId): void
    {
        $order = Order::find($orderId);
        $order->cancel();
        // Direct execution, no command object
    }
}
```
---
## Good Example
```php
class CancelOrderCommand
{
    public function __construct(
        public readonly int $orderId,
        public readonly string $reason
    ) {}
}

class CancelOrderHandler
{
    public function __construct(private OrderRepository $repo) {}

    public function handle(CancelOrderCommand $command): void
    {
        $order = $this->repo->find($command->orderId);
        $order->cancel($command->reason);
        $this->repo->save($order);
    }
}
```
---
## Exceptions
Trivial operations that will never need queuing, logging, or undo.
---
## Consequences Of Violation
Implicit operations, no undo/logging capability.
---
## Rule 2: Commands are immutable—once created, they cannot change
---
## Category
Architecture
---
## Rule
Command objects should be immutable with readonly properties. All data needed for execution is set at construction.
---
## Reason
Mutable commands create uncertainty about their state at execution time and make logging/replay unreliable.
---
## Bad Example
```php
class PlaceOrder
{
    public array $items; // mutable
    public ?string $discountCode; // mutable
}
```
---
## Good Example
```php
class PlaceOrder
{
    public function __construct(
        public readonly array $items,
        public readonly ?string $discountCode = null
    ) {}
}
```
---
## Exceptions
When the command is built incrementally and frozen before execution (Builder pattern).
---
## Consequences Of Violation
Unpredictable command state, replay unreliability.
---
## Rule 3: Use Command Bus for executing commands (CQRS)
---
## Category
Architecture
---
## Rule
Commands are dispatched through a Command Bus that routes them to the appropriate handler.
---
## Reason
Direct handler invocation couples the caller to the handler; Command Bus provides middleware support (logging, transactions) and decouples.
---
## Bad Example
```php
class OrderController
{
    public function cancel(CancelOrderRequest $request): JsonResponse
    {
        $handler = new CancelOrderHandler(new EloquentOrderRepository());
        $handler->handle(new CancelOrderCommand($request->orderId));
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(private CommandBus $bus) {}

    public function cancel(CancelOrderRequest $request): JsonResponse
    {
        $this->bus->dispatch(new CancelOrderCommand($request->orderId));
        return response()->json(status: 202);
    }
}
```
---
## Exceptions
Simple CRUD applications where Command Bus overhead is not justified.
---
## Consequences Of Violation
Coupling controllers to handlers, no middleware support.
