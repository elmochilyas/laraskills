## Rule 1: Every command must be a named object representing a user's intent
---
## Category
Architecture
---
## Rule
Define each command as an immutable object with a descriptive name (e.g., `PlaceOrder`, `CancelInvoice`). Avoid generic "process" commands.
---
## Reason
Named commands make the use cases explicitly visible in the code; generic commands obscure intent and prevent targeted handling.
---
## Bad Example
```php
class ProcessRequest
{
    public function __construct(
        public string $type,
        public array $data
    ) {}
}
```
---
## Good Example
```php
class PlaceOrder
{
    public function __construct(
        public readonly OrderId $orderId,
        public readonly CustomerId $customerId,
        public readonly LineItemCollection $items
    ) {}
}
```
---
## Exceptions
When using a generic command bus as a message queue and the command name is extracted from a routing key.
---
## Consequences Of Violation
Unclear use cases, switch statements on type, lost domain intent.
---
## Rule 2: Each command must have exactly one handler
---
## Category
Architecture
---
## Rule
One command class → one handler class. No conditional dispatch inside handlers based on command fields.
---
## Reason
One-to-one mapping makes the code predictable, testable, and navigable. Conditional dispatch creates implicit sub-use-cases.
---
## Bad Example
```php
class OrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        if ($command->type === 'express') {
            // express logic
        } else {
            // standard logic
        }
    }
}
```
---
## Good Example
```php
class PlaceOrderHandler
{
    public function __construct(
        private OrderRepository $repo,
        private EventDispatcher $events
    ) {}

    public function handle(PlaceOrder $command): void
    {
        $order = Order::create($command->items);
        $this->repo->save($order);
        $this->events->dispatch(new OrderPlaced($order->id()));
    }
}
```
---
## Exceptions
When the command is a base class with variants that share handler infrastructure (rare; prefer composition).
---
## Consequences Of Violation
Conditional branches, hidden sub-use-cases, SRP violation.
---
## Rule 3: Handlers must be synchronous, stateless, and return void
---
## Category
Architecture
---
## Rule
A command handler executes a use case synchronously, holds no state, and does not return a value (or returns an optional ID when the caller needs to know the created aggregate ID).
---
## Reason
Return values from commands blur the line with queries; state in handlers creates concurrency and ordering issues.
---
## Bad Example
```php
class PlaceOrderHandler
{
    private int $lastOrderId;

    public function handle(PlaceOrder $command): array // returns data
    {
        // ...
        $this->lastOrderId = $order->id();
        return ['order' => $order->toArray()];
    }
}
```
---
## Good Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): OrderId
    {
        $order = Order::create($command->items);
        $this->repo->save($order);
        $this->events->dispatch(new OrderPlaced($order->id()));
        return $order->id();
    }
}
```
---
## Exceptions
When the command handler creates an aggregate and the caller needs the aggregate ID (return the ID only, not full data).
---
## Consequences Of Violation
Blurred CQRS boundary, implicit queries, hard-to-test handlers.
---
## Rule 4: Route commands to handlers via a single command bus abstraction
---
## Category
Architecture
---
## Rule
All commands go through one bus interface; handlers are registered declaratively (auto-discovery or explicit mapping), never invoked directly by controllers.
---
## Reason
Direct handler instantiation from controllers bypasses middleware (transaction, logging, validation) and couples presentation to handlers.
---
## Bad Example
```php
class OrderController
{
    public function store(Request $request): JsonResponse
    {
        $handler = new PlaceOrderHandler($this->repo, $this->events);
        $handler->handle(new PlaceOrder(...));
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function __construct(private CommandBus $bus) {}

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $this->bus->dispatch($request->toCommand());
        return response()->json(status: 202);
    }
}
```
---
## Exceptions
In the simplest CRUD applications where the overhead of a command bus is unjustified.
---
## Consequences Of Violation
Coupling controllers to handlers, no middleware support, untestable command pipeline.
---
## Rule 5: Wrap every command dispatch with transactional middleware
---
## Category
Reliability
---
## Rule
Use middleware on the command bus to wrap dispatch in a database transaction; commit on success, rollback on failure.
---
## Reason
Commands modify state; partial execution leaves the system in an inconsistent state. Transactional middleware ensures atomicity.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        // Some code fails after saving half the data
    }
}
```
---
## Good Example
```php
// Middleware wraps dispatch
class TransactionMiddleware implements CommandBusMiddleware
{
    public function dispatch(object $command, callable $next): void
    {
        DB::beginTransaction();
        try {
            $next($command);
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```
---
## Exceptions
Query-only commands are read-only and don't need transactions; only write commands require transactional middleware.
---
## Consequences Of Violation
Partial writes, data inconsistency, difficult failure recovery.
