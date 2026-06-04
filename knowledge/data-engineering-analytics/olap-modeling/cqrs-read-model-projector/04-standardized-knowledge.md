# K008: CQRS Read Model / Projector Pattern for Analytics

## Metadata
- **ID:** K008
- **Tier:** Tier 1 (Core)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Intermediate
- **Adoption:** Growing
- **Packages:** spatie/laravel-event-sourcing, Laravel Events (built-in), queue workers

## Overview
The CQRS read model pattern treats analytics data as a projection derived from domain events — not as the primary source of truth. Instead of querying operational tables for dashboards, you maintain dedicated analytics tables ("read models") that are updated asynchronously by projectors listening to domain events. This decouples the analytics schema (optimized for queries, denormalized, aggregated) from the operational schema (optimized for transactions, normalized). The core insight: "Your analytics platform is a read model" — it sits downstream of operational truth, is eventually consistent, and is optimized for queries, not writes.

## Core Concepts
- **Read model:** A table or set of tables optimized for analytical queries. Denormalized, aggregated, indexed for fast SELECT. Separate from operational tables.
- **Projector / Projection:** A class that listens to a domain event and updates one or more read models.
- **Domain event:** A record of something that happened. `OrderCreated`, `PaymentReceived`, `UserRegistered`. Immutable, timestamped.
- **Eventual consistency:** There is a delay between the event occurring and the read model being updated. The dashboard may be seconds behind operational state.
- **Replaying:** Re-running all historical events through a projector to rebuild the read model from scratch.

## When To Use
- Any Laravel application where analytics queries are slowing down the operational database.
- Systems with distinct write-heavy (orders, registrations) and read-heavy (dashboards, reports) patterns.
- Applications using event sourcing — read models are the natural way to expose event-sourced data for analytics.
- Teams that need the ability to rebuild analytics tables from scratch without data loss.

## When NOT To Use
- Simple applications with < 10K daily events and < 1M rows in analytics tables — direct queries against operational tables are simpler and sufficient.
- Real-time systems requiring sub-second consistency between events and analytics — CQRS is eventually consistent by design.
- Applications without event persistence (fire-and-forget events) — you cannot replay what wasn't stored.
- Teams unfamiliar with queue infrastructure — CQRS without reliable queue processing leads to stale or incomplete analytics data.

## Best Practices
- **Always dispatch event handling to a queue, never update read models synchronously** because a slow analytics write (e.g., an aggregation query) in the HTTP request path blocks the response to the user. Analytics should never degrade the primary application experience. Queue the event handling — a failed analytics projection does not cause a 500 error for the customer.
- **Make every projector idempotent — use `upsert()` or `updateOrCreate()` instead of `insert()`** because replaying events (after schema changes, bug fixes, or data corruption) re-processes the same events. A projector that calls `insert()` creates duplicate rows on replay. `upsert()` with a unique constraint ensures that replay produces the same result as the original run.
- **Use one projector class per read model** because a single projector updating 10 tables is tightly coupled and hard to test. A `DailyRevenueProjector` updates only the `daily_revenue` table. When the daily revenue logic changes, only one file changes. When replaying, you replay only the relevant projector.
- **Track projection lag as a key production metric** because a projector queue backlog of thousands of unprocessed events means analytics data is stale. Measure the difference between the last event timestamp and the last projected event timestamp. Alert when lag exceeds 5 minutes.
- **Add unique constraints on all read model tables** because replay without unique constraints produces duplicate rows. Every read model table must have a natural key or composite key that prevents duplicates. This is a safety net — even with idempotent projectors, constraints catch errors.

## Architecture Guidelines
- **Event store for replayable projectors:** Use Spatie's event sourcing package when replay capability is required. The `stored_events` table persists all domain events. Without it, a projector bug that corrupts the read model requires restoring from backup rather than replaying.
- **Checkpoint tracking per projector:** Track which event ID each projector has processed. This enables resuming from the last processed event after a failure, avoiding full re-replay. Spatie's `Projector` base class handles this automatically.
- **Separate read model storage:** Store read models in a dedicated `analytics` schema (PostgreSQL) or a separate analytics database. This prevents analytics queries from competing with operational queries for database resources.
- **Scheduled projectors for complex aggregations:** Queue-based projectors handle event-by-event updates. Complex aggregations (cohort analysis, retention, funnel conversion) are better handled by scheduled commands that run hourly/daily.

## Performance Considerations
- Queue dispatch per event: ~1ms overhead. For high-throughput events (page views, API calls), batch events before dispatch.
- `upsert()` for single-row updates is fast. For 10K+ events/minute, batch upsert in 100-row chunks.
- Replaying 1M events through a projector: ~5-15 minutes depending on read model complexity. Test replay time in staging.
- Read model queries against denormalized, pre-aggregated tables: sub-millisecond with proper indexing.

## Security Considerations
- Domain events in the event store contain all data about the event — including potentially sensitive information (PII, financial data). The event store table must have access controls.
- Events persist forever in the event store. GDPR erasure requests must delete events from the event store, breaking replay capability for that aggregate.
- Read models may expose aggregated data that is sensitive (revenue, profit margins). Apply row-level security or separate read models per tenant.
- Queue payloads contain serialized events. Ensure the analytics queue is not accessible to unauthorized consumers.

## Common Mistakes

### Updating read models synchronously
- **Description:** The projector runs in the same HTTP request as the event dispatch.
- **Cause:** Developer registers the projector as a sync listener for simplicity.
- **Consequence:** A slow analytics write causes the HTTP response to fail. Analytics affects the primary application flow.
- **Better:** Always queue projector execution. Use synchronous projection only for non-critical, fast operations.

### Non-idempotent projectors
- **Description:** Projector calls `insert()` instead of `upsert()` or `updateOrCreate()`.
- **Cause:** Developer assumes events are processed exactly once.
- **Consequence:** Replaying events creates duplicate rows. Read model has inflated counts.
- **Better:** Always use `upsert()` with a unique constraint. Design for replay from the start.

### Missing unique constraints on read models
- **Description:** Read model table has no unique constraint on the natural key.
- **Cause:** Developer relies on application-level deduplication.
- **Consequence:** Replay creates duplicates regardless of upsert logic. Data corruption.
- **Better:** Add unique constraints at the database level. This is a safety net for all projection patterns.

### Ignoring event ordering
- **Description:** Two events for the same aggregate processed out of order.
- **Cause:** Events dispatched to different queue workers without ordering guarantees.
- **Consequence:** Read model reflects stale state. Example: `OrderShipped` processed before `OrderCreated` — the read model tries to update a non-existent order.
- **Better:** Use a single queue worker per aggregate (partitioning by aggregate ID) or include sequence numbers and discard out-of-order events.

## Anti-Patterns

### Direct operational table queries for dashboards
Running `SELECT SUM(revenue) FROM orders WHERE ...` directly on the operational `orders` table for every dashboard load. The operational table has indexes optimized for transactional queries, not analytical aggregations. As the table grows, dashboard queries slow down and eventually impact order processing.

### Fat projectors updating every read model
A single `AllAnalyticsProjector` that updates 15 different read models. Any change to any read model logic requires modifying the same file. Replaying all read models requires running one projector, which takes hours. One projector per read model keeps things independent and fast.

### No replay testing
Writing projectors without ever testing replay. The first time replay is needed (after a bug fix or schema change), duplicates, constraint violations, and data corruption are discovered. Every projector should be tested with a replay against a staging copy of production events.

## Examples

### Queue-backed projector with idempotent upsert
```php
class DailyRevenueProjector implements ShouldQueue, ShouldBeUnique
{
    public function onOrderCreated(OrderCreated $event): void
    {
        $date = $event->order->created_at->toDateString();

        DailyRevenue::upsert(
            [
                'date' => $date,
                'revenue' => $event->order->total,
                'order_count' => 1,
            ],
            ['date'], // Unique by date
            [
                'revenue' => DB::raw('daily_revenue.revenue + ' . $event->order->total),
                'order_count' => DB::raw('daily_revenue.order_count + 1'),
            ]
        );
    }

    public function uniqueId(): string
    {
        return 'daily-revenue-' . $this->event->order->created_at->toDateString();
    }
}
```

### Scheduled projector for complex aggregation
```php
class CohortAnalysisProjector
{
    public function __invoke(): void
    {
        $monthly = DB::table('stored_events')
            ->where('event_class', UserRegistered::class)
            ->selectRaw("
                DATE_TRUNC('month', created_at) as cohort_month,
                COUNT(*) as registered_users
            ")
            ->groupBy(DB::raw("DATE_TRUNC('month', created_at)"))
            ->get();

        CohortSummary::upsert(
            $monthly->toArray(),
            ['cohort_month'],
            ['registered_users']
        );
    }
}

// Schedule: $schedule->call(new CohortAnalysisProjector)->daily();
```

## Related Topics
- **K002 (Queue Dispatching):** Queue-backed projectors depend on reliable queue infrastructure.
- **K019 (Analytic Schema Separation):** The `analytics.*` schema as the read model storage.
- **K029 (Temporal Queries):** Point-in-time state reconstruction from event streams.
- **K006 (Star Schema):** Read models often implement star schema for query performance.

## AI Agent Notes
- Always use queue-backed projectors — never update read models synchronously.
- Every projector must be idempotent — use `upsert()` with unique constraints.
- One projector class per read model — independent, testable, replayable.
- Monitor projection lag and alert when > 5 minutes.
- Use Spatie's event sourcing for replay capability; fire-and-forget events are not replayable.
- Add unique constraints on all read model tables at the database level.

## Verification
- [ ] Every projector dispatches to a queue — no synchronous read model updates.
- [ ] Every projector uses `upsert()` or `updateOrCreate()` — no raw `insert()`.
- [ ] Each read model table has a unique constraint on the natural key.
- [ ] Projection lag monitoring is configured with alerts.
- [ ] Replay has been tested in staging with a copy of production events.
- [ ] Event ordering is handled (partitioned queue or sequence number filtering).
- [ ] Event store is backed up — without it, replay is impossible.
