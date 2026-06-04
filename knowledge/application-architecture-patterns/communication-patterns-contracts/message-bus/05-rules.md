# Rules: Message bus and pub/sub patterns

## Rule 1: Use Laravel events for in-process, dedicated bus for cross-process
---
## Category
Architecture
---
## Use Laravel's built-in event system for in-process event distribution within the same application server. Use a dedicated message bus (RabbitMQ, Kafka, Redis Streams) for cross-process event distribution.
---
## Reason
Laravel's event system is optimized for same-process communication — zero serialization overhead, direct listener resolution. A dedicated bus provides persistence, delivery guarantees, and routing for cross-process communication.
---
## Bad Example
```php
// Using a heavyweight Kafka bus for same-context internal events
class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Cross-process bus used for in-process events — unnecessary complexity
        KafkaBus::publish('order.placed', $event);
    }
}
```
---
## Good Example
```php
class EventServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // In-process: use Laravel's event system
        Event::listen(OrderPlaced::class, UpdateInventory::class);

        // Cross-process: register subscriptions for message bus
        // (registration happens in a bus-specific service provider)
    }
}
```
---
## Exceptions
If the application is already fully event-driven with a dedicated bus, using the bus for all events (including internal) is acceptable for consistency.
---
## Consequences Of Violation
Unnecessary network latency for same-process events; harder debugging; dependency on bus infrastructure for trivial internal communication.
---

## Rule 2: Register subscriptions explicitly in service providers
---
## Category
Code Organization | Maintainability
---
## Register all event subscriptions and bus topic subscriptions explicitly in service providers. Never register subscriptions via auto-discovery or convention-based scanning for cross-context events.
---
## Reason
Explicit registration makes dependencies visible and discoverable. Developers can open a service provider and immediately see what events a context listens to. Auto-discovery hides these dependencies.
---
## Bad Example
```php
// Subscription registration hidden via convention or config
// config/events.php — no explicit provider registration
return [
    'listeners' => [
        'order.placed' => [
            'app/Listeners/*', // Auto-discovered — dependencies hidden
        ],
    ],
];
```
---
## Good Example
```php
// Explicit registration in a service provider
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Bus::subscribe('order.placed', [
            CreateInvoice::class,
            UpdateCustomerBalance::class,
        ]);

        Bus::subscribe('payment.received', [
            MarkOrderAsPaid::class,
        ]);
    }
}
```
---
## Exceptions
In-process Laravel events within a single context may use auto-discovery for convenience.
---
## Consequences Of Violation
New developers cannot understand event flows; subscriptions accidentally registered/unregistered; debugging production issues requires searching the entire codebase.
---

## Rule 3: Avoid a single shared bus for all contexts
---
## Category
Scalability | Maintainability
---
## Use separate buses or topics per domain or bounded context. Never route all events from all contexts through a single shared bus.
---
## Reason
A monolithic "god bus" becomes a coupling point and bottleneck. Every context depends on the same bus infrastructure. Topic-per-domain isolates failures and makes the topology understandable.
---
## Bad Example
```php
// Single bus, single topic, all events
Bus::topic('all-events')->publish('order.placed', $data);
Bus::topic('all-events')->publish('payment.received', $data);
Bus::topic('all-events')->publish('inventory.updated', $data);
Bus::topic('all-events')->publish('user.registered', $data);
// Hundreds of events in one topic — impossible to manage
```
---
## Good Example
```php
// Per-domain topics
Bus::topic('orders')->publish('order.placed', $data);
Bus::topic('payments')->publish('payment.received', $data);
Bus::topic('inventory')->publish('inventory.updated', $data);
Bus::topic('users')->publish('user.registered', $data);

// Subscribers register only for domains they need
Bus::subscribe('orders', [OrderEventHandler::class]);
Bus::subscribe('payments', [PaymentEventHandler::class]);
```
---
## Exceptions
In very small systems (2-3 contexts), a single bus may be acceptable initially, but plan to split as the system grows.
---
## Consequences Of Violation
Bus becomes a bottleneck; one context's high event volume starves others; topology is impossible to reason about; failure in one event type affects all subscribers.
---

## Rule 4: Use pub/sub for domain events, point-to-point for commands
---
## Category
Architecture | Design
---
## Publish domain events using pub/sub (one event, many subscribers). Use point-to-point (one message, one consumer) for commands and task distribution.
---
## Reason
Domain events represent facts that multiple contexts may be interested in. Commands represent directed operations intended for exactly one handler. Mixing the semantics leads to confusion and unintended side effects.
---
## Bad Example
```php
// Command sent as pub/sub — multiple consumers could process it
Bus::publish('cancel.order', $data);
// Both Billing and Inventory might process this — canceling twice!
```
---
## Good Example
```php
// Domain event — pub/sub, many interested contexts
Bus::publish('order.placed', $data);
// Subscribers: Billing, Inventory, Shipping, Analytics

// Command — point-to-point, exactly one handler
Bus::send('cancel.order.command', $data);
// Handler: CancelOrderHandler (exactly one consumer)
```
---
## Exceptions
If using a bus that only supports pub/sub, use routing keys or message types to simulate point-to-point.
---
## Consequences Of Violation
Commands processed by multiple handlers causing duplicate side effects; domain events not reaching all interested subscribers; semantic confusion in the event topology.
---

## Rule 5: Configure dead letter queues for all message buses
---
## Category
Reliability
---
## Always configure a dead letter queue (DLQ) for every message bus topic or queue. Never let message processing failures result in silent message loss.
---
## Reason
Without a DLQ, messages that fail processing are discarded, causing data loss. With a DLQ, failed messages are preserved for inspection, replay, and debugging.
---
## Bad Example
```php
// No dead letter configuration — failed messages vanish
'queue' => [
    'connections' => [
        'rabbitmq' => [
            'host' => 'localhost',
            'queue' => 'orders',
            // No dead_letter_exchange configured
        ],
    ],
],
```
---
## Good Example
```php
// Dead letter exchange configured
'queue' => [
    'connections' => [
        'rabbitmq' => [
            'host' => 'localhost',
            'queue' => 'orders',
            'options' => [
                'dead_letter_exchange' => 'orders.dlx',
                'dead_letter_routing_key' => 'orders.failed',
            ],
        ],
    ],
],

// Worker that inspects and replays failed messages
class InspectDeadLetterQueue extends Command
{
    public function handle(): void
    {
        $messages = Bus::getDeadLetterMessages('orders.failed');
        foreach ($messages as $message) {
            Log::error('Failed message', [
                'id' => $message->id,
                'type' => $message->type,
                'error' => $message->error,
            ]);
        }
    }
}
```
---
## Exceptions
Non-critical events (analytics, page views) where occasional loss is acceptable may skip DLQ configuration.
---
## Consequences Of Violation
Silent data loss; failed events never noticed until business impact is visible; no ability to replay failed messages; debugging requires reproducing the exact scenario.
---

## Rule 6: Restrict bus access by context
---
## Category
Security
---
## Limit publish and subscribe permissions on the message bus to only the contexts that require them. Never grant all contexts unrestricted access to all topics.
---
## Reason
Unrestricted bus access allows any context to publish or consume any event, creating security holes and unintended coupling. A context could publish counterfeit events or consume sensitive data.
---
## Bad Example
```php
// All contexts have universal publish/subscribe access
Bus::allowPublish('*', '*'); // Any context, any topic
Bus::allowSubscribe('*', '*'); // Any context, any topic
```
---
## Good Example
```php
// Explicit publish/subscribe permissions per context
Bus::allowPublish('billing', ['orders', 'payments']);
Bus::allowSubscribe('billing', ['payments']);

Bus::allowPublish('inventory', ['inventory', 'orders']);
Bus::allowSubscribe('inventory', ['orders']);

Bus::allowPublish('shipping', ['shipping', 'orders']);
Bus::allowSubscribe('shipping', ['orders', 'inventory']);
```
---
## Exceptions
In a single-process modular monolith, access control is less critical since all code runs in the same process.
---
## Consequences Of Violation
Contexts publish counterfeit events causing incorrect processing; sensitive event data consumed by unauthorized contexts; bus topology security is opaque.
---
