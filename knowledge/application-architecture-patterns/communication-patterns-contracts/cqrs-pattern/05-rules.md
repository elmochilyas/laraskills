# Rules: CQRS pattern

## Rule 1: Default to segregated models, not full CQRS
---
## Category
Architecture
---
## Use segregated read and write models within the same database as the default CQRS approach. Never adopt full CQRS (separate databases) unless read and write performance requirements diverge significantly.
---
## Reason
Segregated models within a single database provide the benefits of CQRS (optimized reads, clean writes) without the complexity of separate databases, eventual consistency, and cross-database transactions.
---
## Bad Example
```php
// Full CQRS with separate databases — unnecessary complexity for most apps
'connections' => [
    'write' => ['driver' => 'mysql', 'host' => 'write.cluster.local'],
    'read'  => ['driver' => 'mysql', 'host' => 'read.cluster.local'],
];

class OrderWriteModel extends Model
{
    protected $connection = 'write';
}

class OrderReadModel extends Model
{
    protected $connection = 'read';
}
```
---
## Good Example
```php
// Segregated models in the same database
class OrderWriteModel extends Model
{
    // Write model: full domain logic with aggregates
    protected $table = 'orders';

    public function place(array $data): void
    {
        DB::transaction(function () use ($data) {
            $this->fill($data);
            $this->save();
            OrderPlaced::dispatchAfterCommit($this);
        });
    }
}

class OrderReadModel
{
    // Read model: flat DTO optimized for queries
    public function __construct(
        public readonly string $id,
        public readonly string $customerName,
        public readonly float $total,
        public readonly string $status,
    ) {}
}
```
---
## Exceptions
Full CQRS is justified when: separate scaling of read/write throughput, different database technologies for reads (e.g., Elasticsearch), or strict read/write performance isolation is required.
---
## Consequences Of Violation
Unnecessary complexity, eventual consistency headaches, cross-database transaction issues where a simpler approach would have sufficed.
---

## Rule 2: Use imperative naming for commands
---
## Category
Design
---
## Name commands in imperative mood using verb-noun format (e.g., `PlaceOrder`, `CancelInvoice`). Never use past tense or declarative naming.
---
## Reason
Commands express intent to perform an action. Imperative naming makes the intent explicit. Past tense (`OrderPlaced`) or declarative (`OrderData`) obscures whether this is a command or an event.
---
## Bad Example
```php
class OrderPlaced // Past tense — this is an event name, not a command
{
    public function __construct(
        public string $orderId,
        public array $items,
    ) {}
}

class OrderData // Vague — doesn't indicate mutation
{
    public function __construct(
        public string $orderId,
    ) {}
}
```
---
## Good Example
```php
class PlaceOrder
{
    public function __construct(
        public readonly string $customerId,
        public readonly array $items,
    ) {}
}

class CancelInvoice
{
    public function __construct(
        public readonly string $invoiceId,
        public readonly string $reason,
    ) {}
}
```
---
## Exceptions
None. Commands are always imperative.
---
## Consequences Of Violation
Confusion between commands and events; developers unsure whether a handler should mutate state or just record a fact.
---

## Rule 3: Never return domain objects from queries
---
## Category
Architecture
---
## Ensure queries return DTOs, read models, or plain arrays. Never return Eloquent models, entities, or domain objects from query methods.
---
## Reason
Domain objects carry business logic, relationships, and internal behavior. Returning them from queries exposes internals and couples the presentation layer to the domain model. DTOs are stable, flat, and safe to serialize.
---
## Bad Example
```php
class OrderQuery
{
    public function findById(string $id): Order // Returns Eloquent model!
    {
        return Order::with('items', 'payments')->findOrFail($id);
    }
}

// Controller receives an Eloquent model with all relationships loaded
class OrderController
{
    public function show(string $id): JsonResponse
    {
        $order = $this->query->findById($id);
        return response()->json($order->toArray());
        // Coupled to Eloquent serialization — any model change breaks the API
    }
}
```
---
## Good Example
```php
// Read model DTO
readonly class OrderSummary
{
    public function __construct(
        public string $id,
        public string $customerName,
        public float $total,
        public string $status,
        public CarbonImmutable $placedAt,
    ) {}
}

class OrderQuery
{
    public function findById(string $id): OrderSummary
    {
        $order = Order::findOrFail($id);

        return new OrderSummary(
            id: $order->id,
            customerName: $order->customer->name,
            total: (float) $order->total,
            status: $order->status->value,
            placedAt: $order->created_at->toImmutable(),
        );
    }
}

// Controller receives only the data it needs
class OrderController
{
    public function show(string $id): JsonResponse
    {
        $summary = $this->query->findById($id);
        return response()->json($summary);
    }
}
```
---
## Exceptions
Within the same bounded context, passing entities between services is acceptable (not crossing context boundaries).
---
## Consequences Of Violation
Presentation layer coupled to domain internals; eager loading issues; model changes break API contracts; serialization of lazy-loaded relationships causes N+1 queries.
---

## Rule 4: Keep commands synchronous when the user waits
---
## Category
Performance | User Experience
---
## Execute commands that the user awaits synchronously. Only queue commands that don't require immediate feedback.
---
## Reason
Synchronous commands return results to the user in the same request. Queued commands defer execution — the user leaves without knowing if the operation succeeded. Only queue operations that can tolerate eventual consistency.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        dispatch(new PlaceOrderJob($command))->onQueue('high');
        // Returns immediately — user sees "success" but order may fail to process
    }
}
```
---
## Good Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): PlaceOrderResult
    {
        DB::transaction(function () use ($command) {
            $order = Order::createFromCommand($command);
            OrderPlaced::dispatchAfterCommit($order);
        });

        return new PlaceOrderResult(
            success: true,
            orderId: $order->id,
        );
    }
}

// Queued command for non-urgent work
class SendOrderConfirmationHandler implements ShouldQueue
{
    public $afterCommit = true;

    public function handle(SendOrderConfirmation $command): void
    {
        Mail::to($command->email)->send(new OrderConfirmation($command->orderId));
    }
}
```
---
## Exceptions
Operations that are inherently asynchronous (e.g., video transcoding, report generation) should be queued despite user wait expectations — communicate the async nature via UI.
---
## Consequences Of Violation
Users misled by immediate success for operations that may fail later; bad UX when errors surface minutes later.
---

## Rule 5: Use the command bus over direct service calls
---
## Category
Architecture | Maintainability
---
## Route all commands through Laravel's command bus (`Bus::dispatch`). Never call command handlers directly.
---
## Reason
The command bus provides middleware support, queuing capability, pipeline processing, logging, and a consistent pattern for all mutations. Direct handler calls bypass these capabilities.
---
## Bad Example
```php
class CheckoutController
{
    public function __construct(
        private PlaceOrderHandler $handler, // Direct dependency on handler
    ) {}

    public function checkout(Request $request): JsonResponse
    {
        $command = new PlaceOrder(
            customerId: $request->user()->id,
            items: $request->input('items'),
        );

        $this->handler->handle($command); // Bypasses bus middleware
    }
}
```
---
## Good Example
```php
class CheckoutController
{
    public function checkout(Request $request): JsonResponse
    {
        $command = new PlaceOrder(
            customerId: $request->user()->id,
            items: $request->input('items'),
        );

        $result = Bus::dispatch($command); // Goes through command bus with middleware
    }
}
```
---
## Exceptions
Simple read-only operations (queries) do not go through the command bus — they are direct method calls on query objects.
---
## Consequences Of Violation
No centralized logging of commands; no queue capability; no middleware (authorization, validation, DB transactions) applied consistently; inconsistent mutation patterns across the codebase.
---

## Rule 6: Authorize commands, authorize queries separately
---
## Category
Security
---
## Apply authorization checks on commands for write access and on queries for read access. Never assume command authorization is sufficient for the corresponding query.
---
## Reason
A user may have write access to an entity but not read access (e.g., support agents can update orders but not view payment details). Commands and queries operate in different contexts and have different authorization requirements.
---
## Bad Example
```php
class OrderController
{
    public function update(string $id, Request $request): JsonResponse
    {
        $this->authorize('update', Order::class); // Authorizes command

        $result = Bus::dispatch(new UpdateOrder($id, $request->all()));

        return response()->json($result);
    }

    public function show(string $id): JsonResponse
    {
        // No separate authorization — assumes command authorization is enough
        return response()->json($this->query->findById($id));
    }
}
```
---
## Good Example
```php
class OrderController
{
    public function update(string $id, Request $request): JsonResponse
    {
        $this->authorize('update', Order::class);

        $result = Bus::dispatch(new UpdateOrder($id, $request->all()));

        return response()->json($result);
    }

    public function show(string $id): JsonResponse
    {
        $this->authorize('view', Order::class); // Separate query authorization

        return response()->json($this->query->findById($id));
    }
}
```
---
## Exceptions
For simple entities where read and write permissions are identical, a single gate can cover both.
---
## Consequences Of Violation
Unauthorized data access; users with write access viewing data they shouldn't; compliance violations (GDPR, PCI-DSS).
---
