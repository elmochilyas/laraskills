# K008: CQRS Read Model / Projector Pattern for Analytics

## Metadata
- **ID:** K008
- **Tier:** Tier 1 (Core)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Intermediate
- **Adoption:** Growing
- **Packages:** spatie/laravel-event-sourcing, Laravel Events (built-in), queue workers

## Executive Summary
The CQRS read model pattern treats analytics data as a projection derived from domain events — not as the primary source of truth. Instead of querying operational tables for dashboards, you maintain dedicated analytics tables ("read models") that are updated asynchronously by projectors listening to domain events. This decouples the analytics schema (optimized for queries, denormalized, aggregated) from the operational schema (optimized for transactions, normalized). The core insight: "Your analytics platform is a read model" — it sits downstream of operational truth, is eventually consistent, and is optimized for queries, not writes.

## Core Concepts
- **Read model:** A table or set of tables optimized for analytical queries. Denormalized, aggregated, indexed for fast SELECT. Separate from operational tables.
- **Projector / Projection:** A class that listens to a domain event and updates one or more read models. `class OrderProjector implements Projector { public function onOrderCreated(OrderCreated $event) { ... } }`.
- **Domain event:** A record of something that happened in the system. `OrderCreated`, `PaymentReceived`, `UserRegistered`. Immutable, timestamped.
- **Eventual consistency:** There is a delay between the event occurring and the read model being updated. The dashboard may be a few seconds behind the operational state.
- **Replaying:** Re-running all historical events through a projector to rebuild the read model from scratch. Used when read model schema changes or data corruption occurs.

## Mental Models
- **Separate read/write databases:** The operational database is for writing ("the source of truth"). The analytics database is for reading ("the query-optimized view"). They can have different schemas, different databases, even different technologies.
- **Event as truth, read model as cache:** Domain events are the immutable truth. Read models are caches of computed state derived from events. If a read model is wrong, you don't fix it directly — you replay the events through a corrected projector.
- **Reporter/Assistant:** The operational system is the busy professional living life (creating orders, registering users). The analytics read model is the assistant taking notes, summarizing, and preparing reports in the background.
- **Eventually consistent = never inconsistent for long:** The read model may not reflect the latest event immediately, but it will catch up within seconds (queue latency). For analytics dashboards, this is acceptable — users understand data may be "up to 30 seconds old."

## Internal Mechanics
1. A domain event is fired: `event(new OrderCreated($order))`. The event contains the data needed to update the read model (order ID, amount, customer ID, timestamp).
2. The event is serialized and dispatched to a queue job.
3. The queue worker executes the projector class. The projector reads the event data and updates the analytics read model.
4. For insert-heavy projections: `AnalyticsOrder::upsert(['order_id' => $event->orderId], ['amount' => $event->amount, 'customer_id' => $event->customerId])`.
5. For aggregation projections: The projector reads the current aggregate value, applies the event delta, and writes the new aggregate. Example: increment daily revenue total.
6. For scheduled projections: A command runs hourly to compute complex aggregations from the event store.

## Patterns
- **Projector-per-read-model:** One projector class per analytics table. Keeps projections focused and testable. `DailyRevenueProjector`, `CustomerLifetimeValueProjector`.
- **Queue-backed projectors:** Always dispatch event handling to a queue. Never update read models synchronously — a slow analytics write should not delay the HTTP response.
- **`ShouldBeUnique` on scheduled projectors:** Prevents duplicate aggregation runs. If the hourly aggregation job takes 45 minutes, the next scheduled run is discarded if the previous is still running.
- **Replayable projectors:** Projectors should be idempotent — running them twice produces the same result. This enables replay without data duplication.
- **Checkpoint tracking:** Track which events have been processed per projector. Enables resuming from the last checkpoint after failure rather than replaying from the beginning.

## Architectural Decisions
| Decision | Options | Trade-off |
|---|---|---|
| Event store | Laravel events (fire-and-forget) vs Spatie Event Sourcing (persistent event store) | Laravel events are simpler but not replayable if the listener fails; Spatie event store persists events for replay, audit, but adds storage and complexity |
| Projection timing | Synchronous (in request) vs Queue (async) vs Scheduled (cron) | Synchronous is simplest but blocks response; queue adds seconds of latency but non-blocking; scheduled adds minutes of latency but handles complex aggregations |
| Read model storage | Same DB (different schema) vs Separate DB vs ClickHouse | Same DB is simplest but operational query load affects analytics queries; separate DB isolates performance but adds replication cost; ClickHouse is best for query performance but needs ETL |
| Full rebuild strategy | Truncate-and-replay vs Upsert-only vs Versioned schema | Truncate-and-replay is clean but takes time (requires event store); upsert-only is safe but can accumulate stale data; versioned schema enables zero-downtime migration |

## Tradeoffs
- **Eventual consistency vs complexity:** Read models are eventually consistent by nature. If your dashboard MUST show data immediately (sub-second), use synchronous projections or direct queries. But the simpler the consistency requirement, the more you lose the benefits of CQRS.
- **Replay capability vs storage cost:** Spatie's event store persists all domain events — this grows with every write. Storage cost: ~500 bytes per event. 10M events/month = 5GB/month. Retention policy helps but loses replay capability.
- **Granular projections vs maintenance:** A separate projector per read model (10 projectors for 10 reports) is clean and independent but 10x the code. A single projector updating all tables is simpler but harder to test and modify.

## Performance Considerations
- Queue processing of events: Each event dispatch adds ~1ms overhead. For high-throughput events (page views, API calls), batch events before dispatching to the projector.
- `upsert()` in projectors is fast for single-row updates. For batch updates (10,000 events per minute), batch upsert: `upsert($rows, $uniqueBy, $update)` with 100-row chunks.
- Replaying 1M events through a projector: ~5-15 minutes depending on read model complexity. Staging should mirror production for replay time estimation.
- Read model query performance: Since read models are denormalized and pre-aggregated, queries are simple SELECT with WHERE — sub-millisecond with proper indexing.

## Production Considerations
- **Projector failure handling:** If a projector fails (e.g., constraint violation), the event is released back to the queue. After 3 retries, move to the failed events queue. Alert on projector failures — they mean stale analytics data.
- **Monitoring projection lag:** Track the difference between the last event timestamp and the last projected event timestamp. Alert on lag > 5 minutes.
- **Read model schema migration:** When read model schema changes, drop the old table, create the new one, and replay the projector from the event store. Use a maintenance window for large replays.
- **Backup of event store:** The event store is the source of truth. Back up the `stored_events` table. Without it, read models cannot be rebuilt.

## Common Mistakes
- **Updating read models synchronously:** An order projection fails → the HTTP response fails → the customer sees a 500 error. Analytics should never affect the primary application flow.
- **Non-idempotent projectors:** A projector that inserts a row on every event call creates duplicates during replay. Use `updateOrCreate` or `upsert` with a unique constraint.
- **Missing unique constraints on read models:** Replaying creates duplicate rows. Always have unique constraints on natural keys in read model tables.
- **Ignoring event ordering:** Two events for the same order (created, updated) processed out of order → stale data in read model. Use sequence numbers or timestamps to apply events in correct order.

## Failure Modes
- **Projector queue backlog:** Thousands of unprocessed events → analytics data is hours stale. Alert on queue depth > 10,000. Scale projectors via additional workers.
- **Event store corruption:** A bug in event creation produces malformed events → projector fails. Mitigation: store event type version, skip unprocessable events, alert for manual intervention.
- **Replay collision:** Re-initiation of replay while previous replay is still running → duplicate data. Mitigation: lock (atomic) the projector during replay, mark as `is_replaying`.

## Ecosystem Usage
- **spatie/laravel-event-sourcing:** The canonical event sourcing package for Laravel. Provides `StoredEvent` model, `Projector` base class with `onEvent*` convention, and `Reactor` for side effects.
- **Laravel Business Metrics:** Uses `public.business_events` (append-only) → scheduled report jobs → `analytics.*` tables. A pragmatic CQRS pattern without full event sourcing.
- **Laravel native:** Simple event + listener pattern with `Dispatchable` events and queue-based listeners. No event store, no replay — simpler but less robust.

## Related Knowledge Units
- K002 (Queue Dispatching): Queue-backed projectors depend on reliable queue infrastructure
- K019 (Analytic Schema Separation): The `analytics.*` schema as the read model storage
- K029 (Temporal Queries): Point-in-time state reconstruction from event streams
- K006 (Star Schema): Read models often implement star schema for query performance

## Research Notes
- The CQRS pattern for analytics was explicitly articulated in the Laravel community by the "Your Analytics Platform Is a Read Model" article (NILUS). The core insight: analytics tables are not the primary data — they're derived projections of domain events.
- Spatie's event sourcing package is the most common implementation for full CQRS. However, for many analytics use cases, the simpler "events + queue listeners" pattern (without persistent event store) is sufficient and avoids event store management overhead.
- The key production insight: projectors should be "dumb" — they receive an event and update a table. Complex business logic should be in the event itself or in a separate service. Projectors are view models, not business logic.
