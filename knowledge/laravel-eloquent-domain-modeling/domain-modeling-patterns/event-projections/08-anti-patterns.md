# Event Projections — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Event Projections |
| Focus | Anti-patterns in event projection design and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Non-Rebuildable Projections (Treated as Primary Data) | Architecture | Critical |
| 2 | Non-Idempotent Projectors | Reliability | Critical |
| 3 | Over-Fetched Projections (Mirroring Write Model) | Performance | High |
| 4 | Unmonitored Async Projections | Scalability | High |
| 5 | Copied Write-Model Indexes on Projections | Performance | Medium |
| 6 | Wrong Sync/Async Projection Choice | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is treating projections as primary data — not being able to drop and rebuild them from events loses the core benefit of event-driven architecture
- Non-idempotent projectors that use `create()` instead of `updateOrCreate()` cause duplicate rows and corrupted aggregates when events are replayed or retried
- Projections that mirror the write model schema defeat their purpose — they should contain only the fields needed for the specific read use case

---

## 1. Non-Rebuildable Projections (Treated as Primary Data)

### Category
Architecture

### Description
Designing projection tables as if they were primary data — adding columns through migrations, manually editing rows, and treating the projection as authoritative. The projection cannot be dropped and rebuilt from historical events without data loss.

### Why It Happens
Teams that are new to event-driven design treat projections like normal database tables. They may not have experienced a scenario where a projection needs rebuilding. The distinction between "primary data" and "derived projection" isn't established in the team's mental model.

### Warning Signs
- Manual data edits directly on projection tables via SQL or Tinker
- Schema migrations that alter projection tables (instead of rebuilding from events)
- No Artisan command to rebuild projections from scratch
- Team members saying "we can't rebuild that — the data would be lost"
- Projection data backed up independently of event store data
- Business logic that reads from and writes to the same projection table

### Why Harmful
- Data corruption in a projection cannot be recovered from by replaying events — requires manual SQL repair
- Schema changes to projections require migration scripts instead of simple replay
- The projection becomes a source of truth, violating the event-driven architecture
- If the event store is pruned, projections can never be rebuilt from scratch
- The team loses confidence in the ability to recover from failures

### Consequences
- A corrupted projection table requires hours of manual data repair
- Adding a new field to a projection requires writing and testing a migration
- Developers are afraid to change projection schemas because "we'll lose data"
- The projection cannot be recreated in a staging environment from production events
- The team doesn't trust the replay mechanism because no one has tested it

### Preferred Alternative
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderSummary::updateOrCreate(
            ['order_id' => $event->orderId],
            ['total' => $event->totalCents, 'status' => 'placed']
        );
    }
}

class RebuildProjections extends Command
{
    public function handle(): void
    {
        DB::statement('TRUNCATE order_summaries');
        // Re-dispatch all events to rebuild
        Event::all()->each(fn ($e) => Event::dispatch($e));
    }
}
```

### Refactoring Strategy
1. Identify projection tables that lack a rebuild command
2. Create an Artisan command that truncates and rebuilds each projection from events
3. Document that projection data is derived, not primary
4. Remove manual data editing workflows for projection tables
5. Test the rebuild command in staging against production-like data
6. Verify that no business logic reads from and writes to the same projection

### Detection Checklist
- [ ] Is there an Artisan command to rebuild each projection from scratch?
- [ ] Are projection tables manually edited in production?
- [ ] Do schema changes to projections go through migrations or replay?
- [ ] Are projections backed up separately from events?
- [ ] Can the team confidently rebuild a projection in staging from production events?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Design Every Projection as Rebuildable from Scratch |
| Rule | `05-rules.md` — Provide an Artisan Command for Rebuilding Projections |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |
| Knowledge | `04-standardized-knowledge.md` — Event Projections |

---

## 2. Non-Idempotent Projectors

### Category
Reliability

### Description
Projector listeners that use `create()` or other non-idempotent insert operations, causing duplicate rows or incorrect aggregations when the same event is processed multiple times during replay, queue retries, or at-least-once delivery.

### Why It Happens
Developers write projectors the same way they write normal event listeners — assuming each event is processed exactly once. They may not design for replay or may not be aware that queue systems guarantee at-least-once delivery, not exactly-once.

### Warning Signs
- `ProjectionModel::create([...])` in projector code (no upsert)
- `Model::firstOrCreate([...])` without unique constraint matching
- Raw `INSERT` statements in projectors
- Duplicate rows appearing in projection tables after queue retries
- Inflated counters and sums after replaying events
- The team manually deletes duplicates from projection tables

### Why Harmful
- Inflated aggregate values: a counter incremented twice produces wrong results
- Duplicate rows cause queries to return multiple results for expected unique lookups
- The projection cannot be rebuilt reliably — each replay produces different data
- Manual cleanup of duplicates is error-prone and time-consuming
- Queue retries (common in production) silently corrupt projection data

### Consequences
- A `total_orders` counter shows 150 when only 100 orders were placed
- An `updateOrCreate` missing projector produces duplicate user summaries
- After a queue outage, replaying backlogged events doubles all aggregates
- Dashboard data becomes untrustworthy — users notice discrepancies
- The team must implement deduplication as a workaround

### Preferred Alternative
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderSummary::updateOrCreate(
            ['user_id' => $event->customerId],
            [
                'total_orders' => DB::raw('total_orders + 1'),
                'lifetime_value_cents' => DB::raw('lifetime_value_cents + ' . $event->totalCents),
                'last_order_at' => now(),
            ]
        );
    }
}
```

### Refactoring Strategy
1. Identify all projectors using `create()` or non-idempotent operations
2. Replace `create()` with `updateOrCreate()` using unique event identifiers
3. For append-only projections (event logs), add a unique constraint on event ID and use `firstOrCreate()`
4. Add a unique compound key to projection tables if missing
5. Truncate and rebuild the projection after fixing the projector
6. Verify idempotency by running events through the projector twice

### Detection Checklist
- [ ] Search for `::create(` in projector classes
- [ ] Search for `INSERT` statements in projector files
- [ ] Check if projection tables have unique constraints on event/entity identifiers
- [ ] Run projectors twice with the same events — do results change?
- [ ] Verify queue retries don't produce duplicates in projection tables

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Make Every Projector Idempotent |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |
| Knowledge | `04-standardized-knowledge.md` — Event Projections |

---

## 3. Over-Fetched Projections (Mirroring Write Model)

### Category
Performance

### Description
Projection tables that include every field from the write model regardless of whether the read use case needs them. The projection becomes a near-copy of the source aggregate, bloating storage and coupling read schema to write schema changes.

### Why It Happens
Developers take a shortcut by projecting "all the fields" instead of analyzing what the read use case actually needs. It seems safer to include everything than to miss a field. The projection is treated as a "cache" of the write model rather than a purpose-built read structure.

### Warning Signs
- Projection table schema closely mirrors the write model table schema
- Fields in the projection that are never displayed or queried
- A single projection serving multiple unrelated read use cases
- `SELECT *` queries against the projection (unnecessary data transfer)
- Schema changes to the write model also require changes to the projection migration
- Projection table has 20+ columns when only 5-7 are needed for the read

### Why Harmful
- Storage costs increase — denormalized projections store redundant data
- Projection writes are slower because more columns must be updated per event
- Schema coupling: a write-model column rename requires a projection migration
- The CQRS benefit is lost — read and write models are tightly coupled
- Query performance degrades: larger rows mean fewer per page and more I/O

### Consequences
- A dashboard projection storing `notes`, `internal_flags`, and `coupon_code` fields never displayed
- Changing a column name on the orders table requires migrating the projection table
- The projection table is 3x larger than necessary, slowing full-table scans
- Adding a new read use case requires changing the same projection instead of creating a new one
- The team cannot confidently add write-model columns without checking all projections

### Preferred Alternative
```php
Schema::create('order_dashboard', function (Blueprint $table) {
    $table->id();
    $table->integer('order_id')->unique();
    $table->string('customer_name');
    $table->string('status');
    $table->integer('total_cents');
    $table->timestamp('placed_at');
    // Only fields the dashboard displays
});
```

### Refactoring Strategy
1. Identify projection tables that mirror write-model schemas
2. Determine the actual fields consumed by the read use case
3. Create a migration to drop unused columns from the projection table
4. Update the projector to only write required fields
5. Update read queries to only select required fields
6. Create separate projections for different read use cases

### Detection Checklist
- [ ] Compare projection schema to write model schema — how similar are they?
- [ ] Review read queries against the projection — which columns are actually selected?
- [ ] Check if a write-model column rename needs a projection migration
- [ ] Count projection columns vs actual fields used in read queries
- [ ] Verify the projection serves exactly one read use case

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Project Only the Minimum Fields Required for the Read Use Case |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |
| Decision Tree | `07-decision-trees.md` — Projection Design |

---

## 4. Unmonitored Async Projections

### Category
Scalability

### Description
Deploying asynchronous (queued) projectors without any monitoring for projection lag. The queue can back up silently for hours or days while users see stale data and no one is alerted.

### Why It Happens
The team focuses on the happy path — events are processed immediately. Queue monitoring is seen as "ops work" rather than development responsibility. The team may not realize how quickly a queue can fall behind under load or after a failure.

### Warning Signs
- Async projectors deployed with no lag monitoring
- No alerting when the project queue grows beyond normal size
- Users report "data not showing up" before the team notices
- Dashboard showing data from hours ago
- Queue worker count never adjusted based on projection volume
- No way to check current projection lag from a CLI command

### Why Harmful
- Business decisions are made on stale data without anyone realizing
- Users lose trust in the application when data doesn't appear promptly
- The projection lag grows during peak hours, compounding the problem
- No historical data on projection health — can't identify trends
- Recovering from a large lag requires emergency scaling of queue workers

### Consequences
- An analytics dashboard shows yesterday's data for 3 hours during a queue backlog
- Support tickets about "missing data" are filed before the projection catches up
- The team doesn't know about the backlog until a user complains
- No metric exists to correlate deployment changes with projection health
- Scaling decisions for queue workers are based on guesses, not data

### Preferred Alternative
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

### Refactoring Strategy
1. Identify all async projectors without lag monitoring
2. Add lag calculation in each projector (compare event timestamp to current time)
3. Configure alert thresholds for acceptable lag (e.g., 5 minutes for critical, 30 for non-critical)
4. Add logging or metrics emission for lag values
5. Set up alerting (PagerDuty, Slack) when lag exceeds threshold
6. Add an Artisan command to check current projection lag on demand
7. Monitor lag trends over time to inform scaling decisions

### Detection Checklist
- [ ] Are async projectors monitored for processing lag?
- [ ] Is there an alert when projection lag exceeds acceptable thresholds?
- [ ] Can current lag be checked via a CLI command or dashboard?
- [ ] Are lag metrics tracked over time for trend analysis?
- [ ] Do queue worker counts scale based on projection volume?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Monitor Projection Lag for Async Projections |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |

---

## 5. Copied Write-Model Indexes on Projections

### Category
Performance

### Description
Creating indexes on projection tables that mirror the write-model indexes without analyzing the actual read queries the projection serves. The projection's performance optimization potential is lost.

### Why It Happens
Developers copy the migration from the write model as a starting point and don't revisit indexing. Index decisions are made at table creation time and never reviewed against actual query patterns. The team may not recognize that projections should be optimized for different query patterns than the write model.

### Warning Signs
- Projection table indexes are identical to write model indexes
- Indexes on columns that the projection's read queries never filter or sort by
- Missing indexes on columns that the projection's queries actually use in WHERE/ORDER BY
- No composite indexes matching the projection's common query patterns
- Slow query log entries for projection queries despite "having indexes"
- The team adds indexes reactively (after slow query detected) rather than proactively

### Why Harmful
- Projection queries perform full-table scans or inefficient index lookups
- The performance benefit of having a projection is partially negated
- Unnecessary indexes on unused columns slow writes for no benefit
- Storage is wasted on indexes that serve no query
- Write-model index changes may incorrectly propagate to projections

### Consequences
- A dashboard query filtering by `[status, placed_at]` does a full scan because the index is on `user_id`
- Writes to the projection table are slower than necessary due to unused indexes
- Adding a write-model index causes unnecessary work maintaining the same index on the projection
- The team doesn't analyze the slow query log because "the projection has indexes"
- Projection tables use more storage than needed

### Preferred Alternative
```php
Schema::create('order_summaries', function (Blueprint $table) {
    $table->id();
    $table->integer('user_id');
    $table->string('status');
    $table->timestamp('placed_at');
    // Composite index matching the actual dashboard query
    $table->index(['status', 'placed_at']);
});
```

### Refactoring Strategy
1. Analyze the actual read queries hitting each projection table
2. Compare existing projection indexes to the query patterns (WHERE, ORDER BY, GROUP BY)
3. Drop indexes on columns that are never used in read queries
4. Add composite indexes matching the most common query filters
5. Add missing indexes for columns used in JOINs or WHERE clauses
6. Monitor query performance after index changes
7. Review indexes periodically as query patterns evolve

### Detection Checklist
- [ ] Compare projection indexes to write model indexes — are they identical?
- [ ] Analyze slow query log for projection table queries
- [ ] Review the projection's read queries — do indexes match WHERE/ORDER BY clauses?
- [ ] Check if any projection indexes are never used (use `sys.dm_db_index_usage_stats` or equivalent)
- [ ] Verify composite indexes match exact query filter combinations

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Give Projection Tables Different Indexes Than Write Tables |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |

---

## 6. Wrong Sync/Async Projection Choice

### Category
Reliability

### Description
Using async queues for projections that require immediate consistency (order confirmation, payment status) or using sync projections for every read model including non-critical analytics. The sync/async choice is not matched to the consistency requirements.

### Why It Happens
Developers pick a default (often async because "it scales better") and apply it uniformly. They may not analyze which read models need immediate consistency vs. which can tolerate lag. The team doesn't distinguish between consistency requirements across different projections.

### Warning Signs
- All projectors are async (or all are sync) — no differentiation
- Users see stale order status or payment confirmation on screens that should be current
- Write path is slow because non-critical analytics projections update synchronously
- Queue backlogs delay critical projections (confirmation pages) because they share the queue with non-critical ones
- The team says "we always use async" or "we always use sync"
- No documentation on which projections need immediate consistency

### Why Harmful
- Critical projections using async show stale data to users at the worst moment (post-purchase)
- Non-critical projections using sync slow down the write path for every request
- A queue backlog delays both critical and non-critical projections equally
- Users lose trust when order confirmations don't appear immediately
- The write path fails more often because non-critical analytics projections are updated in the same transaction

### Consequences
- An order confirmation page shows "no orders found" for 30 seconds after placing an order
- A non-critical "recently viewed products" projection slows down every product page load
- A queue worker crash delays both analytics and payment confirmation projections
- The team adds workarounds (polling, websockets) because sync/async choice is wrong
- Users refresh confirmation pages and see inconsistent data

### Preferred Alternative
```php
// Sync — order confirmation page needs immediate consistency
Event::listen(OrderPlaced::class, UpdateOrderConfirmationProjection::class);

// Async — analytics dashboard can tolerate minutes of lag
Event::listen(OrderPlaced::class, UpdateAnalyticsProjection::class)
    ->shouldQueue();
```

### Refactoring Strategy
1. List all projections and classify by consistency requirements
2. For projections that must show current data (order confirmations, balances), switch to sync
3. For projections that can tolerate lag (analytics, reports, recommendations), switch to async
4. Consider a separate queue for critical vs. non-critical async projections
5. Document the sync/async decision for each projection
6. Test that critical projections show data immediately after write
7. Monitor write path latency — sync projections should add minimal overhead

### Detection Checklist
- [ ] Are all projectors configured identically (all sync or all async)?
- [ ] Check each projection's consumers — how long can they wait for fresh data?
- [ ] Measure write path latency — is it acceptable for the user experience?
- [ ] Review queue backlog monitoring — are critical projections affected by non-critical volume?
- [ ] Test post-write reads — does the projection show the latest data immediately?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Sync Projections When Consistency Is Critical, Async for Everything Else |
| Decision Tree | `07-decision-trees.md` — Sync vs Async Projection |
| Skill | `06-skills.md` — Create an Event Projection From Domain Events |
