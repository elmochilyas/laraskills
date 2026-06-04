## Rule 1: Build read models via projectors listening to domain events, never via dual writes
---
## Category
Architecture
---
## Rule
Read models must be built from domain events published by the write model; never update both write and read models in the same transaction.
---
## Reason
Dual writes create distributed transaction problems—if one write succeeds and the other fails, data is inconsistent.
---
## Bad Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        $order = Order::create($command->items);
        $order->save(); // write model
        OrderReadModel::create([...]); // read model in same transaction
    }
}
```
---
## Good Example
```php
class PlaceOrderHandler
{
    public function handle(PlaceOrder $command): void
    {
        $order = Order::create($command->items);
        $this->repo->save($order);
        $this->events->dispatch(new OrderPlaced($order->id(), $order->data()));
    }
}

class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::create($event->data);
    }
}
```
---
## Exceptions
When using the Outbox pattern where both writes happen within the same local transaction (write + outbox).
---
## Consequences Of Violation
Data inconsistency, distributed transaction failures, read-model staleness.
---
## Rule 2: Denormalize aggressively—read models should be query-optimized, not normalized
---
## Category
Architecture
---
## Rule
Read models should contain exactly the data needed for a specific query, pre-joined and pre-computed. Do not normalize read tables.
---
## Reason
Normalized read models require joins at query time, defeating the performance benefit of a separate read model.
---
## Bad Example
```php
// Read model mirrors normalized write model
class OrderReadModel
{
    public function getWithCustomer(): Collection
    {
        return $this->join('customers', ...)->get(); // still joining!
    }
}
```
---
## Good Example
```php
class OrderReadModel
{
    public function __construct(
        public readonly string $order_id,
        public readonly string $customer_name,  // denormalized
        public readonly string $customer_email, // denormalized
        public readonly float $total,            // pre-computed
        public readonly string $status,          // ready to display
        public readonly Carbon $placed_at
    ) {}
}
```
---
## Exceptions
When the read model must support ad-hoc queries that cannot be predicted.
---
## Consequences Of Violation
Read model doesn't solve the performance problem it was created for.
---
## Rule 3: Choose read-model storage based on query patterns, not write-model technology
---
## Category
Architecture
---
## Rule
Evaluate each read model's query pattern (full-text search? aggregation? graph traversal?) and pick the best storage for it—Elasticsearch for search, Redis for real-time, SQL for relational reports.
---
## Reason
Forcing all read models into the write model's storage technology limits query capabilities and performance.
---
## Bad Example
```
All read models in MySQL even though some need full-text search and others need graph traversal.
Result: awkward queries, poor performance.
```
---
## Good Example
```
Write model: PostgreSQL
Read models:
- Full-text search → Elasticsearch
- Real-time dashboard → Redis sorted sets
- Monthly reports → PostgreSQL materialized views
- Graph queries → Neo4j
```
---
## Exceptions
When the team cannot support multiple read-model stores; limit to one additional store until the team is ready.
---
## Consequences Of Violation
Poor read performance, unnatural query patterns, scalability issues.
---
## Rule 4: Keep read models eventually consistent and communicate staleness to users
---
## Category
Architecture
---
## Rule
Accept that read models lag behind write models; communicate the staleness window (e.g., "updated 5 seconds ago") in the UI/API response.
---
## Reason
Hiding eventual consistency from users creates false expectations; transparency prevents confusion when data appears stale.
---
## Bad Example
```
User places an order. Navigates to "My Orders" — order not visible.
User: "Bug! I just placed the order!" (because no staleness indicator)
```
---
## Good Example
```json
{
  "orders": [...],
  "last_updated": "2026-03-15T10:30:05Z",
  "staleness_seconds": 2
}
```
---
## Exceptions
When strong consistency is required (payment confirmation, inventory reservation) and eventual consistency is unacceptable.
---
## Consequences Of Violation
User confusion, false bug reports, trust erosion.
---
## Rule 5: Implement idempotent projectors that can replay events without duplicating data
---
## Category
Reliability
---
## Rule
Projectors must be idempotent—replaying the same event must produce the same final state without duplicates.
---
## Reason
Event replay is necessary for recovery, migration, and adding new read models; non-idempotent projectors cause data corruption on replay.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::create($event->data); // creates duplicate on replay
    }
}
```
---
## Good Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::updateOrCreate(
            ['order_id' => $event->orderId],
            $event->data
        );
    }
}
```
---
## Exceptions
When the read model is append-only and replays are handled by clearing and full re-projection.
---
## Consequences Of Violation
Duplicate data on replay, corruption during recovery.
