# Event Projections — Rules

---

## Rule: Design Every Projection as Rebuildable from Scratch
---
## Category
Architecture
---
## Rule
Ensure that every projection table can be dropped and fully rebuilt by replaying all historical domain events. Never treat projection data as authoritative primary data.
---
## Reason
The ability to rebuild projections from events is what distinguishes a projection from primary data. If a projection cannot be rebuilt, data corruption or schema changes require manual migration scripts instead of a simple replay command.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderSummary::create([
            'order_id' => $event->orderId,
            'total' => $event->totalCents,
            'status' => 'placed',
        ]);
    }
}
// What happens if OrderSummary needs a new column?
// Manual migration would be needed — not rebuildable.
```
---
## Good Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderSummary::updateOrCreate(
            ['order_id' => $event->orderId],
            [
                'total' => $event->totalCents,
                'status' => 'placed',
            ]
        );
    }
}
// Replay is safe — updateOrCreate prevents duplicates
```
---
## Exceptions
Read models that are assembled from multiple event types where the source events are not all retained. In this case, document clearly that replay is not supported.
---
## Consequences Of Violation
Inability to recover from data corruption without manual intervention, expensive schema migration processes, and fear of changing projection structures.

---

## Rule: Make Every Projector Idempotent
---
## Category
Reliability
---
## Rule
Use `updateOrCreate()`, `firstOrCreate()`, or explicit upsert logic in all projectors to ensure that processing the same domain event twice produces the same final state.
---
## Reason
Event replay, queue retries, and at-least-once delivery guarantees mean the same event may be processed multiple times. Non-idempotent projectors create duplicate rows or incorrectly increment aggregates on replay.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        // Creates a new row every time — duplicate on replay!
        OrderSummary::create([
            'order_id' => $event->orderId,
            'total' => $event->totalCents,
        ]);
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
        OrderSummary::updateOrCreate(
            ['order_id' => $event->orderId],
            [
                'total' => DB::raw('total + ' . $event->totalCents),
                'last_order_at' => now(),
            ]
        );
    }
}
```
---
## Exceptions
Append-only projections (e.g., event logs, audit trails) where duplicates are meaningful. Use a unique constraint to deduplicate by event ID in that case.
---
## Consequences Of Violation
Duplicate records and corrupted aggregate values after event replay, requiring manual data cleansing and making reliable projection rebuilding impossible.

---

## Rule: Project Only the Minimum Fields Required for the Read Use Case
---
## Category
Performance
---
## Rule
Include only the fields that the specific read use case requires in each projection table. Never mirror the entire write model schema.
---
## Reason
Projections exist to optimize specific read patterns. Including unnecessary fields increases storage, slows writes, and creates coupling between the projection and the write model's schema — a write-model column change then forces a projection change.
---
## Bad Example
```php
// Orders dashboard projection — but includes every order field
Schema::create('order_dashboard', function (Blueprint $table) {
    $table->id();
    $table->integer('order_id');
    $table->string('status');
    $table->text('notes');           // Never shown on dashboard
    $table->json('internal_flags');  // Not relevant
    $table->string('coupon_code');   // Not displayed
    $table->integer('total_cents');
    $table->timestamps();
});
```
---
## Good Example
```php
// Orders dashboard projection — only what the dashboard displays
Schema::create('order_dashboard', function (Blueprint $table) {
    $table->id();
    $table->integer('order_id')->unique();
    $table->string('customer_name');
    $table->string('status');
    $table->integer('total_cents');
    $table->timestamp('placed_at');
});
```
---
## Exceptions
When it's clearer to store the full aggregate snapshot than to maintain complex field selection logic. Rare — prefer minimal fields.
---
## Consequences Of Violation
Increased storage costs, slower projection writes, and tighter coupling between read and write models that reduces the benefits of CQRS-style separation.

---

## Rule: Provide an Artisan Command for Rebuilding Projections
---
## Category
Reliability
---
## Rule
Always provide an `artisan` command that can rebuild each projection from scratch by replaying all relevant domain events.
---
## Reason
Without a rebuild command, recovering from projection corruption requires direct database manipulation, manual event replay scripts, or full data migration — each error-prone and slow.
---
## Bad Example
```bash
# No rebuild command exists — developers must manually
# truncate tables and write ad-hoc replay scripts
```
---
## Good Example
```php
// app/Console/Commands/RebuildProjections.php
#[AsCommand('projections:rebuild')]
class RebuildProjections extends Command
{
    public function handle(EventRepository $events): void
    {
        DB::statement('TRUNCATE order_summaries');
        DB::statement('TRUNCATE user_dashboards');

        $events->all()->each(fn ($event) => Event::dispatch($event));
        // Each projector re-processes the event and upserts into its table

        $this->info('Projections rebuilt successfully.');
    }
}
```
---
## Exceptions
When rebuilding requires external data that is no longer available (e.g., third-party API responses). Document this limitation explicitly.
---
## Consequences Of Violation
No reliable recovery path from projection corruption, manual data repair procedures that take hours, and fear of schema changes because projections cannot be rebuilt.

---

## Rule: Monitor Projection Lag for Async Projections
---
## Category
Scalability
---
## Rule
Implement monitoring for asynchronous projections that alerts when the event processing lag exceeds a defined threshold (e.g., 5 minutes).
---
## Reason
Async projections trade immediacy for scalability. Without lag monitoring, a projection can fall hours behind due to queue backlogs, resource contention, or failures — and users see stale data without anyone noticing.
---
## Bad Example
```php
// Async projector deployed — no monitoring
// Queue backs up silently for hours
// Users see stale dashboard data
```
---
## Good Example
```php
class OrderProjector implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        $lag = now()->diffInMinutes($event->occurredAt);
        if ($lag > config('projections.max_lag_minutes')) {
            Log::warning('Projection lag detected', [
                'event' => OrderPlaced::class,
                'lag_minutes' => $lag,
            ]);
        }

        OrderSummary::updateOrCreate([...]);
    }
}
```
---
## Exceptions
Synchronous projections that update within the same request — no lag possible.
---
## Consequences Of Violation
Users see stale data, business decisions made on outdated information, and no automated detection of when the projection system has failed.

---

## Rule: Give Projection Tables Different Indexes Than Write Tables
---
## Category
Performance
---
## Rule
Create indexes on projection tables that match the specific read queries they serve, which will differ from the write-model indexes optimized for transactional integrity.
---
## Reason
Projections exist to serve read queries efficiently. Applying write-model indexes misses the optimization opportunity. Projection indexes should support the exact `WHERE`, `ORDER BY`, and `GROUP BY` clauses of their read queries.
---
## Bad Example
```php
// Copying write-model indexes without analysis
Schema::create('order_summaries', function (Blueprint $table) {
    $table->id();
    $table->integer('user_id')->index(); // Copied from write model
    $table->string('status')->index();   // Copied from write model
    // But the dashboard queries by date range, not user_id
});
```
---
## Good Example
```php
// Indexes matching the actual dashboard query
Schema::create('order_summaries', function (Blueprint $table) {
    $table->id();
    $table->integer('user_id');
    $table->string('status');
    $table->timestamp('placed_at');
    // Composite index matching the dashboard query
    $table->index(['status', 'placed_at']);
});
```
---
## Exceptions
No common exceptions. Always analyze read query patterns before creating projection indexes.
---
## Consequences Of Violation
Projection queries that do not use indexes efficiently, negating the performance benefit of the projection and still causing slow read responses.

---

## Rule: Use Sync Projections When Consistency Is Critical, Async for Everything Else
---
## Category
Reliability
---
## Rule
Choose synchronous projections (same transaction, same request) only when the read model must be immediately consistent with the write. Use async projections (queue-based) for all other read models.
---
## Reason
Synchronous projections keep the read model consistent but slow the write path and can cause write failures if the projection update fails. Async projections scale better and isolate write path reliability from projection updates.
---
## Bad Example
```php
// Every write uses async — even the order confirmation page
// that must show the newly placed order
```
---
## Good Example
```php
// Sync — order confirmation page needs immediate consistency
Event::listen(OrderPlaced::class, UpdateOrderConfirmationProjection::class);

// Async — analytics dashboard can tolerate minutes of lag
Event::listen(OrderPlaced::class, UpdateAnalyticsProjection::class)
    ->shouldQueue();
```
---
## Exceptions
No common exceptions. Consistency requirements dictate sync vs. async — not convenience.
---
## Consequences Of Violation
Users seeing stale data on pages that require current state, or alternatively, slow write paths that degrade user experience for non-critical projections.
