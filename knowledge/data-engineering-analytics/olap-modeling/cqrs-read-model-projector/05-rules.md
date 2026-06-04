# CQRS Read Model / Projector Pattern for Analytics

## Rule 1: Always Queue Projector Execution

### Category
Architecture

### Rule
Always dispatch projector event handling to a queue — never update read models synchronously in the HTTP request path.

### Reason
A slow analytics write (e.g., an aggregation query) in the HTTP request path blocks the response to the user. Analytics should never degrade the primary application experience. Queuing ensures that a failed analytics projection does not cause a 500 error for the customer.

### Bad Example
```php
class OrderController
{
    public function store(): RedirectResponse
    {
        $order = Order::create(/* ... */);
        (new DailyRevenueProjector())->onOrderCreated(new OrderCreated($order));
        // HTTP response blocked until projector completes
    }
}
```

### Good Example
```php
class DailyRevenueProjector implements ShouldQueue
{
    public function onOrderCreated(OrderCreated $event): void
    {
        // Executes on queue worker — HTTP response not blocked
    }
}
```

### Exceptions
Non-critical, sub-millisecond projections (e.g., incrementing a Redis counter) may run synchronously after benchmarking.

### Consequences Of Violation
Slow HTTP responses, 500 errors when analytics DB is slow, coupling between application availability and analytics infrastructure.

---

## Rule 2: Idempotent Projectors with `upsert()`

### Category
Reliability

### Rule
Always use `upsert()` or `updateOrCreate()` in projectors — never use `insert()`.

### Reason
Replaying events (after schema changes, bug fixes, or data corruption) re-processes the same events. A projector using `insert()` creates duplicate rows on replay. `upsert()` with a unique constraint ensures replay produces identical results to the original run.

### Bad Example
```php
public function onOrderCreated(OrderCreated $event): void
{
    DailyRevenue::insert([
        'date' => $event->order->created_at->toDateString(),
        'revenue' => $event->order->total,
    ]); // Duplicate rows on replay
}
```

### Good Example
```php
public function onOrderCreated(OrderCreated $event): void
{
    DailyRevenue::upsert(
        ['date' => $event->order->created_at->toDateString()],
        ['revenue' => DB::raw('daily_revenue.revenue + ' . $event->order->total)],
        ['date']
    );
}
```

### Exceptions
Event stores that guarantee exactly-once delivery (e.g., Kafka with idempotent producer + deduplication) — still recommended for safety.

### Consequences Of Violation
Duplicate data on replay, inflated counts and sums, unrecoverable read model corruption, trust loss in analytics.

---

## Rule 3: One Projector Class Per Read Model

### Category
Maintainability

### Rule
Always create one projector class per read model — never share a single projector across multiple read models.

### Reason
A single projector updating 10 tables is tightly coupled and hard to test. When daily revenue logic changes, one file changes. When replaying, only the relevant projector is replayed. Fat projectors that update everything take hours to replay and break as a unit.

### Bad Example
```php
class AllAnalyticsProjector
{
    public function onOrderCreated(OrderCreated $event): void
    {
        // Updates daily_revenue, customer_summary, product_stats, region_totals
        // A change to any table requires modifying this file
    }
}
```

### Good Example
```php
class DailyRevenueProjector { /* updates only daily_revenue */ }
class CustomerSummaryProjector { /* updates only customer_summary */ }
// One projector per read model — independent, testable, replayable
```

### Exceptions
Trivial read models (< 3 columns) that are always updated together.

### Consequences Of Violation
Tight coupling between read models, long replay times, difficulty testing individual projections, monolithic code changes.

---

## Rule 4: Monitor Projection Lag

### Category
Maintainability

### Rule
Always measure and alert on projection lag (difference between last event timestamp and last projected event timestamp) — never deploy projectors without lag monitoring.

### Reason
A projector queue backlog of thousands of unprocessed events means analytics data is stale. Without lag monitoring, a stuck projector (crashed queue worker, deadlock) goes undetected until users notice outdated dashboards.

### Bad Example
```php
// No lag monitoring — assume projectors are always up to date
```

### Good Example
```php
$lag = DB::select("
    SELECT EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) AS lag_seconds
    FROM read_models.last_projected_events
");
if ($lag > 300) { // 5 minutes
    alert("Projection lag: {$lag} seconds");
}
```

### Exceptions
Development environments where data freshness is not critical.

### Consequences Of Violation
Stale dashboards without detection, delayed response to pipeline failures, incorrect business decisions based on stale data.

---

## Rule 5: Database-Level Unique Constraints on Read Models

### Category
Reliability

### Rule
Always add unique constraints on the natural key of every read model table — never rely solely on application-level deduplication.

### Reason
Unique constraints are a safety net that catches duplicates regardless of application bugs. Even with idempotent projectors, race conditions or queue ordering issues can produce duplicate rows. Database-level constraints prevent this at the storage layer.

### Bad Example
```php
Schema::create('daily_revenue', function ($table) {
    $table->date('date');
    $table->decimal('revenue', 12, 2);
    // No unique constraint — duplicates possible
});
```

### Good Example
```php
Schema::create('daily_revenue', function ($table) {
    $table->date('date')->unique(); // Application-level safety net
    $table->decimal('revenue', 12, 2);
});
```

### Exceptions
Read models where multiple versions or states per natural key are valid (e.g., audit log tables).

### Consequences Of Violation
Duplicate rows after replay, inflated metrics, unrecoverable data corruption from race conditions.

---

## Rule 6: Handle Event Ordering

### Category
Reliability

### Rule
Always ensure events for the same aggregate are processed in order — never dispatch related events to different queue workers without ordering guarantees.

### Reason
Two events for the same aggregate processed out of order (e.g., `OrderShipped` before `OrderCreated`) produce incorrect read model state. Use a single queue worker per aggregate or include sequence numbers to discard out-of-order events.

### Bad Example
```php
// Events for same aggregate can go to different workers
OrderCreated::dispatch($order); // Worker A
OrderShipped::dispatch($order); // Worker B — may process first
```

### Good Example
```php
// Partition queue by aggregate ID
OrderCreated::dispatch($order)->onQueue("orders.{$order->id}");
OrderShipped::dispatch($order)->onQueue("orders.{$order->id}");
// Same worker processes events for this aggregate in order
```

### Exceptions
Read models where only the latest state matters (overwrite-based projections).

### Consequences Of Violation
Incorrect read model state, phantom updates, data races that are hard to reproduce and debug.
