# K029: Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)

## Metadata
- **ID:** K029
- **Tier:** Tier 3 (Expert)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Expert
- **Adoption:** Emerging
- **Packages:** spatie/laravel-event-sourcing, alireza-aminzadeh/laravel-eventsource

## Executive Summary
Temporal queries — asking "what was the state at a specific point in time" — are the primary value proposition of event sourcing for analytics. Instead of snapshot-based read models that show only the current state, event sourcing enables querying historical state by replaying events up to a specific timestamp. This powers audit trails, time-travel debugging, historical reporting, and trend analysis that are difficult or impossible with mutable-table architectures. The engineering challenge is making temporal queries efficient: replaying all events from the beginning for each query is impractical, so temporal queries require snapshotting, event indexing, and PIT (Point-in-Time) table strategies.

## Core Concepts
- **State reconstruction:** Replaying all events for an aggregate from the beginning up to a target timestamp, applying each event to rebuild the state at that exact moment.
- **Snapshot:** A saved state of an aggregate at a specific event version. Replaying from the snapshot (instead of from the beginning) speeds reconstruction.
- **Event stream:** An ordered sequence of events for a single aggregate (e.g., all events for `Order #123`). Each event has a version number and timestamp.
- **Temporal query:** `SELECT ... AS OF TIMESTAMP '2024-06-01 00:00:00'` — return data as it existed at that exact moment.
- **Projection versioning:** Storing multiple versions of projections keyed by event version, enabling direct lookups without replay.
- **Bitemporal storage:** Storing both "valid time" (when the event happened in the real world) and "transaction time" (when the event was recorded in the system). Enables correcting past events while preserving the original record.

## Mental Models
- **Tape recorder rewind:** The event store is a tape recording. Every event is recorded in sequence. A temporal query rewinds the tape to the requested timestamp and plays forward to reconstruct state.
- **Time machine:** Event sourcing IS a time machine — you can visit any past state of the system. The question is just how fast the time machine can travel (replay speed).
- **Git for data:** Events are like git commits. Each commit (event) represents a change. `git checkout <timestamp>` gives you the state at that point. Snapshots are like git tags — they mark specific versions for fast access.
- **Accounting ledger:** An accounting ledger never deletes or updates entries — every transaction is a new entry. The current balance is the SUM of all entries. Temporal queries are just the SUM up to a cutoff date. Events = ledger entries.

## Internal Mechanics
1. **Event loading:** `OrderAggregate::retrieve($orderId)` loads all events for `Order #123` from `stored_events` table.
2. **Replay:** Events are applied in order to an empty aggregate instance. `$aggregate->applyEvent($event)` mutates the aggregate state.
3. **Snapshot check:** Before replaying, check if a snapshot exists at version N. Load snapshot, replay events from version N+1 onward.
4. **Temporal filter:** `OrderAggregate::retrieve($orderId, asOf: $timestamp)` — filter events `WHERE created_at <= $timestamp ORDER BY version ASC`. Replay only up to the timestamp.
5. **Result:** The aggregate state reflects exactly what the system knew at `$timestamp`.

## Patterns
- **Periodic snapshots:** Create snapshots every 100 events per aggregate. `php artisan event-sourcing:snapshot --aggregate=Order --interval=100`. Balance snapshot storage vs replay speed.
- **Materialized temporal views:** Pre-compute daily snapshots of all aggregates into a `daily_state` table. Dashboards query `daily_state WHERE date = '2024-06-01'` directly.
- **Versioned projections:** Store each projection update with the event version. `customer_lifetime_value` table has columns: `user_id, value, event_version, recorded_at`. SELECT the row with `MAX(event_version)` for current state.
- **SQL AS OF pattern (without event sourcing):** For databases without event sourcing, use `SELECT * FROM table AS OF SYSTEM TIME '$timestamp'` (CockroachDB) or temporal tables (SQL Server 2016+, PostgreSQL pg_cron for snapshot tables).
- **PIT table for fact queries:** Pre-compute a Point-in-Time table that maps event_version → aggregate_state at that version. Enables sub-second temporal queries without replay.

## Architectural Decisions
| Decision | Options | Trade-off |
|---|---|---|
| Temporal query method | Event replay vs Snapshot + incremental vs Pre-computed temporal table | Event replay is flexible but slow for deep history; snapshot+incremental balances speed and storage; pre-computed tables are fastest but storage-intensive (daily snapshots × number of aggregates) |
| Snapshot strategy | Interval-based (every N events) vs Time-based (daily) vs Hybrid | Interval-based is predictable but may create many small snapshots; time-based aligns with business periods (daily, weekly); hybrid covers both |
| Event versioning | Monotonic version per aggregate vs Global sequence | Per-aggregate versions are standard for event sourcing; global sequence simplifies cross-aggregate temporal queries but adds coordination overhead |
| Retention of past states | Full event store (no deletion) vs Compaction (snapshot + prune old events) | Full store enables unlimited temporal queries but grows unbounded; compaction limits history depth to snapshot retention period |

## Tradeoffs
- **Query history depth vs storage cost:** Unlimited temporal queries require keeping all events. At 1M events/month (typical for a SaaS application), storage is ~500MB/month. For 5 years of retention, ~30GB — manageable. For massive event volumes (100M+/month), compaction becomes necessary.
- **Replay speed vs snapshot frequency:** More frequent snapshots = faster temporal queries (less events to replay) but more storage and write overhead for snapshot creation. Default: snapshot every 100 events.
- **Temporal query accuracy vs complexity:** Replaying events gives exact state reconstruction but has overhead. Pre-computed daily tables approximate temporal state (if state changed 5 times in a day, only the EOD state is stored). For most analytics, daily granularity is sufficient.
- **Event sourcing vs temporal tables:** Full event sourcing requires architectural commitment (rewriting data layer). PostgreSQL's built-in temporal features (`system_time` period tables in PG 17+) provide temporal queries without event sourcing but with less flexibility.

## Performance Considerations
- Replaying 10,000 events takes ~100ms (in-memory, no I/O). Replaying 1M events takes ~10 seconds — too slow for interactive dashboards. Use snapshots to bound replay to at most 1000 events.
- Snapshot creation itself is not free: creating a snapshot of a large aggregate (10,000 events, 100KB state) takes 50-100ms per snapshot.
- The `stored_events` table grows by event count, not aggregate count. Temporal queries on aggregates with few events (e.g., a user with 10 events) are fast regardless of total events. Temporal queries on aggregates with many events (e.g., a high-traffic page with 1M pageviews) are slow without snapshots.
- Temporal queries across AGGREGATES (e.g., "Total revenue across all orders at 3pm yesterday") require summing PIT states of all aggregates. This is a full scan of the snapshot table or a complex event aggregation.

## Production Considerations
- **Snapshot scheduler:** Run snapshot creation as a scheduled Laravel job during low-traffic periods. `php artisan event-sourcing:create-snapshots --interval=1000` for high-volume aggregates.
- **Indexing for temporal queries:** Index `stored_events` on `(aggregate_uuid, version)` for fast aggregate replay. Also index `(aggregate_uuid, created_at)` for as-of queries.
- **Monitoring replay speed:** Track events-per-second during replay. Degraded speed may indicate hardware constraints or schema issues.
- **Event store backup strategy:** The event store is the source of truth for temporal queries. It must be backed up with point-in-time recovery capability. Without the event store, temporal queries are impossible.
- **Pruning/compaction policy:** Define retention for raw events beyond the snapshot horizon. If snapshots cover the last 90 days, events older than 6 months can be archived to cold storage.

## Common Mistakes
- **No snapshots:** Temporal queries replay from the beginning of time every time. Query gets slower as data grows, until users abandon the dashboard.
- **Snapshot but no cleanup:** Snapshots are created but old ones are never pruned. Snapshot table grows without bound, slowing query time.
- **Mutable event store:** Deleting or updating events compromises temporal query integrity. Events are immutable. Corrections are new events.
- **Temporal queries on non-temporal data:** Querying a `users` table (which has UPDATEs) with `WHERE created_at <= $date` — this shows users that existed at that date but with their CURRENT attributes. Not a true temporal query.

## Failure Modes
- **Snapshot corruption:** A bug creates a snapshot with incorrect state → temporal queries from that snapshot return wrong results. Mitigation: validate snapshots by comparing to full replay periodically.
- **Event store data loss:** A truncated `stored_events` table makes temporal queries impossible beyond surviving events. Mitigation: read replica for event store, regular backups.
- **Replay timeout:** A temporal query on an aggregate with 1M events (no snapshot) times out the HTTP request. Mitigation: always enforce snapshots for aggregates above 1000 events.

## Ecosystem Usage
- **spatie/laravel-event-sourcing:** Provides `SnapshotRepository` with configurable snapshot interval per aggregate. `AggregateRoot::retrieve()` automatically loads from the nearest snapshot.
- **alireza-aminzadeh/laravel-eventsource:** Alternative implementation with built-in temporal query support and PIT-style query methods.
- **Laravel Business Metrics:** Uses scheduled incremental snapshots (daily aggregates) rather than event replay. This is the pragmatic approach: pre-compute daily summaries from events, enabling "as of yesterday" queries without replay.

## Related Knowledge Units
- K008 (CQRS Read Models): Read models updated by projectors are the "current state" counterpart of temporal queries
- K044 (Data Vault 2.0): Data Vault's PIT tables serve the same purpose — pre-computed temporal snapshots
- K030 (SCD Type 1/2): Temporal queries vs Slowly Changing Dimensions — different approaches to tracking history

## Research Notes
- Temporal queries are the "killer feature" of event sourcing but also the most operationally demanding. Many teams adopt event sourcing for the current-state projection and never use temporal queries until an audit or historical-reporting requirement forces them to.
- For analytics-first temporal queries (not audit), the pre-computed daily snapshot approach is more practical than on-demand replay. Daily snapshots are fast, simple, and add < 100MB/day for a typical SaaS application.
- The emerging hybrid pattern: store events for replay capability, pre-compute daily PIT snapshots for dashboard queries, and delete raw events after 90 days (retaining snapshots indefinitely). This balances temporal query performance with storage cost.
