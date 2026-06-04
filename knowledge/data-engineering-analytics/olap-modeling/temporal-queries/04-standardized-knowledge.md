# K029: Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)

## Metadata
- **ID:** K029
- **Tier:** Tier 3 (Expert)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Expert
- **Adoption:** Emerging
- **Packages:** spatie/laravel-event-sourcing, alireza-aminzadeh/laravel-eventsource

## Overview
Temporal queries — asking "what was the state at a specific point in time" — are the primary value proposition of event sourcing for analytics. Instead of snapshot-based read models that show only the current state, event sourcing enables querying historical state by replaying events up to a specific timestamp. This powers audit trails, time-travel debugging, historical reporting, and trend analysis that are difficult or impossible with mutable-table architectures. The engineering challenge is making temporal queries efficient: replaying all events from the beginning for each query is impractical, so temporal queries require snapshotting, event indexing, and PIT (Point-in-Time) table strategies.

## Core Concepts
- **State reconstruction:** Replaying all events for an aggregate from the beginning up to a target timestamp, applying each event to rebuild the state at that exact moment.
- **Snapshot:** A saved state of an aggregate at a specific event version. Replaying from the snapshot (instead of from the beginning) speeds reconstruction.
- **Event stream:** An ordered sequence of events for a single aggregate. Each event has a version number and timestamp.
- **Temporal query:** Return data as it existed at a specific moment in time.
- **Projection versioning:** Storing multiple versions of projections keyed by event version, enabling direct lookups without replay.
- **Bitemporal storage:** Storing both "valid time" (when the event happened in the real world) and "transaction time" (when the event was recorded). Enables correcting past events while preserving the original record.

## When To Use
- Audit trails requiring exact state at a specific past moment ("What was the customer's address when the order was placed?").
- Historical reporting that compares current state to past state ("How many active users did we have on June 1, 2024?").
- Compliance requirements where data must be queryable as it existed at any point in time.
- Event-sourced systems where the event store already exists — temporal queries are a natural extension.

## When NOT To Use
- Simple analytics dashboards showing only current state — current-state read models are simpler and faster.
- High-throughput query patterns (millions of temporal queries per second) — each query requires replay or snapshot lookup.
- Systems without event persistence — temporal queries require the full event history.
- Teams without operational capacity to manage snapshot creation, pruning, and event store backups.

## Best Practices
- **Use periodic snapshots to bound replay to at most 1000 events per temporal query** because replaying from the beginning of time gets slower as the event store grows. A snapshot captures the aggregate state at event version N. Temporal queries load the nearest snapshot before the target timestamp and replay only events after it. Create snapshots every 100 events per aggregate — this guarantees replay never exceeds 100 events, keeping query time under 10ms.
- **Pre-compute daily PIT snapshots for dashboard queries** because on-demand replay is too slow for interactive dashboards. Schedule a nightly command that computes the state of every aggregate as of midnight and stores it in a `daily_state` table. Dashboards query `daily_state WHERE date = '2024-06-01'` — a simple indexed SELECT that completes in milliseconds.
- **Index `stored_events` on `(aggregate_uuid, created_at)` for efficient as-of queries** because temporal queries filter by timestamp, not just version. The standard `(aggregate_uuid, version)` index handles sequential replay. The timestamp index enables jumping to the correct time range without scanning irrelevant events.
- **Choose a pragmatic retention strategy: keep full events for 90 days, daily snapshots for 3 years** because keeping all events forever is expensive, and 90 days covers most debugging and audit needs. Daily snapshots preserve the ability to answer "what was the state on any date" without keeping raw events. Beyond 3 years, keep yearly snapshots.
- **Validate snapshots periodically by comparing to full replay** because a buggy snapshot produces incorrect temporal queries silently. Schedule a weekly job that picks 100 random aggregates, loads their snapshot, replays events after the snapshot, and compares to the current state. If any mismatch is found, drop all snapshots and recreate them.

## Architecture Guidelines
- **Snapshot scheduler:** Run snapshot creation as a scheduled Laravel job during low-traffic periods. Use Spatie's `SnapshotRepository` with configurable interval per aggregate type. High-volume aggregates (page views, API calls) get more frequent snapshots. Low-volume aggregates (refunds, chargebacks) get less frequent.
- **Pre-computed daily tables over on-demand replay for analytics:** On-demand replay is powerful for audits but too slow for dashboards. Build a nightly job that computes daily state for all aggregates and stores it in a simple table. This is the analytics-friendly approach to temporal queries.
- **Event store backup with PITR:** The event store is the source of truth for temporal queries. Without it, temporal queries are impossible. The database hosting the event store must have point-in-time recovery (PITR) enabled and regular backups.
- **Versioned projections for continuous temporal data:** For projections that change frequently (e.g., daily revenue), store each update with the event version and timestamp. `SELECT * FROM daily_revenue_history WHERE date = '2024-06-01' ORDER BY event_version DESC LIMIT 1` gives the state after all events up to any point.

## Performance Considerations
- Replaying 10,000 events in memory: ~100ms. Replaying 1M events: ~10 seconds — too slow for interactive use.
- Snapshot creation: ~50-100ms per aggregate with 10K events. For 100K aggregates with daily snapshots: ~2-3 hours.
- Stored events growth: ~500 bytes per event. 1M events/month = 500MB/month. 90-day retention = 1.5GB.
- Daily snapshots: ~1KB per aggregate. 100K aggregates = 100MB per snapshot. 365 snapshots = 36GB/year.

## Security Considerations
- The event store contains the complete history of every aggregate — including deleted or corrected data. GDPR erasure of an aggregate must delete all events for that aggregate, not just mark the current state as deleted.
- Temporal queries can reveal data that was later corrected or deleted. "What did the system show on June 1?" may expose information that is no longer accurate.
- Snapshots contain aggregate state at a point in time — secure them with the same access controls as the event store.
- The daily PIT table aggregates state across all entities — ensure cross-tenant data access is properly restricted.

## Common Mistakes

### No snapshots
- **Description:** Temporal queries replay from the beginning of time for every request.
- **Cause:** Developer does not configure snapshot creation.
- **Consequence:** As the event store grows, temporal queries become slower until they timeout. 6 months in, a temporal query on a high-volume aggregate takes 30+ seconds.
- **Better:** Create snapshots at regular intervals (every 100 events per aggregate) from day one.

### Snapshot without pruning
- **Description:** Snapshots are created but old ones are never deleted.
- **Cause:** Snapshot creation logic does not include a cleanup step.
- **Consequence:** The snapshot table grows without bound. Old snapshots are never used but consume storage and slow down snapshot queries.
- **Better:** Prune snapshots older than the event retention window. Keep only the latest snapshot per 100-event interval for the retention period.

### Mutable event store
- **Description:** Events are deleted or updated in the `stored_events` table.
- **Cause:** Developer treats the event store like a regular database table.
- **Consequence:** Temporal queries produce wrong results. Replaying events from a modified event store reconstructs incorrect state. Audit integrity is compromised.
- **Better:** Events are immutable. Corrections are new events (e.g., `EmailAddressCorrected`). Never DELETE or UPDATE stored events.

## Anti-Patterns

### Temporal queries on non-temporal data
Running `SELECT * FROM users WHERE created_at <= '2024-01-01'` and calling it a temporal query. This shows users that existed on Jan 1 but with their CURRENT attribute values — not the state as of Jan 1. A user whose email changed on March 1 shows the March email, not the January email. True temporal queries require event sourcing or temporal database features.

### On-demand replay for every dashboard request
Calling `OrderAggregate::retrieve($orderId, asOf: $date)` for every row in a dashboard table. Each call replays events. A dashboard with 100 rows requires 100 replays, taking 10+ seconds to load. Pre-compute daily snapshots or use versioned projections instead.

### Full event retention without compaction
Keeping every event forever "just in case." The event store grows to terabytes. Temporal queries become slow even with snapshots because snapshot creation over full history takes hours. Define a retention policy and enforce it.

## Examples

### Temporal query with snapshot optimization
```php
class TemporalOrderQuery
{
    public function stateAsOf(string $orderId, Carbon $timestamp): array
    {
        $snapshot = Snapshot::where('aggregate_uuid', $orderId)
            ->where('version_in_snapshot', function ($q) use ($timestamp) {
                // Nearest snapshot before the target timestamp
                $q->selectRaw('MAX(version)')
                    ->from('stored_events')
                    ->where('aggregate_uuid', $orderId)
                    ->where('created_at', '<=', $timestamp);
            })
            ->first();

        $aggregate = new OrderAggregate();

        if ($snapshot) {
            $aggregate->applySnapshot($snapshot);
            $aggregate->setVersion($snapshot->last_event_version);
        }

        $events = StoredEvent::where('aggregate_uuid', $orderId)
            ->where('created_at', '>', $snapshot?->state_created_at ?? '1970-01-01')
            ->where('created_at', '<=', $timestamp)
            ->orderBy('version')
            ->get();

        foreach ($events as $event) {
            $aggregate->applyEvent($event->toDomainEvent());
        }

        return $aggregate->state();
    }
}
```

### Daily PIT table generation
```php
class GenerateDailySnapshotCommand
{
    public function __invoke(): void
    {
        $aggregateTypes = ['Order', 'Customer', 'Subscription'];
        $date = now()->subDay()->toDateString();

        foreach ($aggregateTypes as $type) {
            $aggregateIds = StoredEvent::where('event_class', 'like', "App\Events\%{$type}%")
                ->where('created_at', '<', $date . ' 23:59:59')
                ->distinct('aggregate_uuid')
                ->pluck('aggregate_uuid');

            foreach ($aggregateIds as $id) {
                $state = $this->stateAsOf($id, $date); // Uses TemporalOrderQuery above

                DailyAggregateSnapshot::upsert(
                    [
                        'aggregate_type' => $type,
                        'aggregate_uuid' => $id,
                        'snapshot_date' => $date,
                        'state_data' => json_encode($state),
                    ],
                    ['aggregate_type', 'aggregate_uuid', 'snapshot_date']
                );
            }
        }
    }
}
```

## Related Topics
- **K008 (CQRS Read Models):** Read models updated by projectors are the "current state" counterpart of temporal queries.
- **K044 (Data Vault 2.0):** Data Vault's PIT tables serve the same purpose — pre-computed temporal snapshots.
- **K030 (SCD Type 1/2):** Temporal queries vs Slowly Changing Dimensions — different approaches to tracking history.

## AI Agent Notes
- Use periodic snapshots (every 100 events) to bound replay to < 1000 events per query.
- Pre-compute daily PIT snapshots for dashboard queries — on-demand replay is too slow.
- Index `stored_events` on `(aggregate_uuid, created_at)` for as-of timestamp queries.
- Keep full events for 90 days, daily snapshots for 3 years, yearly snapshots beyond.
- Validate snapshots periodically by comparing to full replay.
- Never DELETE or UPDATE stored events — corrections are new events.

## Verification
- [ ] Snapshots are created at regular intervals (every 100 events per aggregate).
- [ ] Old snapshots are pruned — snapshot table does not grow unbounded.
- [ ] `stored_events` is indexed on `(aggregate_uuid, created_at)`.
- [ ] Daily PIT snapshots are pre-computed for dashboard queries.
- [ ] Event store has PITR backup enabled and is backed up regularly.
- [ ] Snapshots are validated periodically against full replay.
- [ ] Retention policy is documented and enforced (events: 90 days, snapshots: 3 years).
