## Rule 1: Each query must return data, never modify state
---
## Category
Architecture
---
## Rule
Query handlers must be read-only operations; they never persist, publish events, or trigger side effects.
---
## Reason
Mixing side effects into queries violates CQS and causes unpredictable behavior when queries are cached or retried.
---
## Bad Example
```php
class OrderQuery
{
    public function findById(OrderId $id): ?Order
    {
        $this->logger->info('Order queried'); // side effect
        $order = Order::find($id);
        $order->incrementViewCount(); // state modification
        return $order;
    }
}
```
---
## Good Example
```php
class OrderQuery
{
    public function findById(OrderId $id): ?Order
    {
        return Order::find($id); // pure read
    }
}
```
---
## Exceptions
When the "query" is actually a materialized view refresh that explicitly updates a read model (but this is a command semantically).
---
## Consequences Of Violation
CQS violation, caching bugs, unpredictable retries.
---
## Rule 2: Create specific query objects for complex queries; simple finders need only a repository method
---
## Category
Architecture
---
## Rule
If a query requires filtering, sorting, pagination, or projection, create a dedicated Query object. Simple lookup-by-id can stay as a repository method.
---
## Reason
Dedicated query objects make complex queries testable, reusable, and documentable; fine for simple lookups to remain minimal.
---
## Bad Example
```php
class OrderRepository
{
    public function find(QueryCriteria $criteria): Collection
    {
        // Generic query builder — hard to test, understand, or optimize
    }
}
```
---
## Good Example
```php
// Simple lookup — repository method
class OrderRepository
{
    public function findById(OrderId $id): ?Order { /* ... */ }
}

// Complex query — dedicated object
class GetMonthlyReportQuery
{
    public function __construct(
        public readonly DateRange $range,
        public readonly ?string $region = null,
        public readonly SortOrder $sort = SortOrder::Desc
    ) {}
}

class GetMonthlyReportHandler
{
    public function handle(GetMonthlyReportQuery $query): MonthlyReport
    {
        // Optimized, testable query logic
    }
}
```
---
## Exceptions
When the repository is already a well-defined query interface and adding separate query objects would add ceremony without benefit.
---
## Consequences Of Violation
Generic query builders, untestable queries, poor optimization.
---
## Rule 3: Index query handlers for performance—measure p50/p95/p99 latency
---
## Category
Reliability
---
## Rule
Add query monitoring (p50/p95/p99) to detect slow queries; optimize or cache any query exceeding 500ms at p95.
---
## Reason
Slow queries degrade user experience and are the primary source of production incidents in read-heavy systems.
---
## Bad Example
```
No query monitoring. "The system feels slow." No data to investigate.
```
---
## Good Example
```php
class MonitoredQueryBus implements QueryBus
{
    public function ask(object $query): mixed
    {
        $start = hrtime(true);
        $result = $this->next->ask($query);
        $latency = (hrtime(true) - $start) / 1e6;
        Metrics::histogram('query_latency_ms', $latency, [
            'query' => get_class($query),
        ]);
        return $result;
    }
}
```
---
## Exceptions
Trivial queries that complete in under 10ms and don't need monitoring overhead.
---
## Consequences Of Violation
Undetected performance degradation, user-facing latency.
---
## Rule 4: Use read models / materialized views for complex queries to keep write model optimized
---
## Category
Architecture
---
## Rule
When a query requires data from multiple aggregates or heavy computation, create a dedicated read model that is updated by events.
---
## Reason
Complex queries on the write model degrade write performance and couple query concerns to command structures.
---
## Bad Example
```php
class OrderQuery
{
    public function getDashboard(): array
    {
        // Join across 5 tables, aggregate data — slow and complex
        return DB::table('orders')
            ->join('payments', ...)
            ->join('customers', ...)
            ->join('shipments', ...)
            ->get();
    }
}
```
---
## Good Example
```php
class OrderDashboardProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        DashboardReadModel::upsert([
            'order_id' => $event->orderId,
            'total' => $event->total,
            'customer_name' => $event->customerName,
            'status' => 'placed',
        ]);
    }
}

class DashboardQuery
{
    public function getDashboard(): Collection
    {
        return DashboardReadModel::all(); // simple, fast
    }
}
```
---
## Exceptions
When the query is simple enough (single table, no aggregation) that a read model adds needless complexity.
---
## Consequences Of Violation
Poor query performance, write model coupling, scalability bottleneck.
---
## Rule 5: Apply caching at the query handler level when data is immutable or slowly changing
---
## Category
Architecture
---
## Rule
Cache query results at the handler level with a TTL; invalidate cache by event handlers when underlying data changes.
---
## Reason
Caching at the query handler reduces load on the database and improves latency; event-driven invalidation ensures cache freshness.
---
## Bad Example
```php
// Caching in controller — inconsistent and bypasses repository
class OrderController
{
    public function show(OrderId $id): JsonResponse
    {
        $data = Cache::remember("order.$id", 3600, function () {
            return Order::with('items')->find($id);
        });
    }
}
```
---
## Good Example
```php
class GetOrderHandler
{
    public function handle(GetOrder $query): ?Order
    {
        return Cache::remember("order.{$query->id}", 300, function () {
            return DB::table('order_read_model')->find($query->id);
        });
    }
}

class OrderProjector
{
    public function onOrderUpdated(OrderUpdated $event): void
    {
        Cache::forget("order.{$event->orderId}");
    }
}
```
---
## Exceptions
When data consistency demands are stronger than latency requirements (real-time dashboards, financial data).
---
## Consequences Of Violation
High latency, unnecessary database load, stale data without invalidation.
