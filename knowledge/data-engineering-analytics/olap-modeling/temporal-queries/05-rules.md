# Event Sourcing Temporal Queries (Point-in-Time State Reconstruction)

## Rule 1: Periodic Snapshots to Bound Replay

### Category
Performance

### Rule
Always create periodic snapshots (every 100 events per aggregate) to bound temporal query replay to at most 1000 events — never replay from the beginning of time.

### Reason
Replaying from the event store's start gets progressively slower as the store grows. After 6 months, a temporal query on a high-volume aggregate takes 30+ seconds. Snapshots allow loading the nearest snapshot before the target timestamp and replaying only events after it, keeping query time under 10ms.

### Bad Example
```php
public function stateAsOf(string $orderId, Carbon $timestamp): array
{
    $events = StoredEvent::where('aggregate_uuid', $orderId)
        ->where('created_at', '<=', $timestamp)
        ->orderBy('version')
        ->get(); // Replays from beginning — gets slower over time
    // ...
}
```

### Good Example
```php
$snapshot = Snapshot::where('aggregate_uuid', $orderId)
    ->where('created_at', '<=', $timestamp)
    ->latest('version')
    ->first();

$events = StoredEvent::where('aggregate_uuid', $orderId)
    ->where('version', '>', $snapshot?->last_event_version ?? 0)
    ->where('created_at', '<=', $timestamp)
    ->orderBy('version')
    ->get(); // Replays only events after snapshot — bounded time
```

### Exceptions
Low-volume aggregates (< 100 total events) where full replay is always fast.

### Consequences Of Violation
Progressive performance degradation as event store grows, eventual dashboard timeouts, inability to serve temporal queries on high-volume aggregates.

---

## Rule 2: Pre-Computed Daily PIT Tables for Dashboard Queries

### Category
Architecture

### Rule
Always pre-compute daily point-in-time snapshots for dashboard queries — never use on-demand replay for interactive dashboards.

### Reason
On-demand temporal replay reconstructs state for each aggregate individually. A dashboard displaying 100 rows requires 100 replays, each taking 10-100ms, totaling 1-10 seconds. Pre-computed daily PIT tables store state as of midnight in a simple indexed table — queries complete in milliseconds.

### Bad Example
```php
// Dashboard controller replays for each row
$orders = Order::all()->map(fn($order) =>
    TemporalQuery::stateAsOf($order->id, $request->date)
);
```

### Good Example
```php
// Pre-computed nightly — dashboard query is a simple SELECT
$state = DailyAggregateSnapshot::where('snapshot_date', $request->date)
    ->where('aggregate_type', 'Order')
    ->get();
```

### Exceptions
Audit-trail features that query individual aggregates on-demand (low volume, < 5 queries per request).

### Consequences Of Violation
Slow dashboard load times (5-30 seconds), poor user experience, database load spikes during business hours.

---

## Rule 3: Index `stored_events` on `(aggregate_uuid, created_at)`

### Category
Performance

### Rule
Always add a composite index on `stored_events(aggregate_uuid, created_at)` — never rely solely on the `(aggregate_uuid, version)` index for temporal queries.

### Reason
Temporal queries filter by timestamp (`created_at`), not just event version. The standard `(aggregate_uuid, version)` index handles sequential replay but cannot efficiently locate events within a time range. The timestamp index enables jumping to the correct range without scanning irrelevant events.

### Bad Example
```php
Schema::create('stored_events', function ($table) {
    $table->index(['aggregate_uuid', 'version']); // Missing timestamp index
});
```

### Good Example
```php
Schema::create('stored_events', function ($table) {
    $table->index(['aggregate_uuid', 'version']);
    $table->index(['aggregate_uuid', 'created_at']); // Required for temporal queries
});
```

### Exceptions
Systems with < 10K total events where full scan is acceptable.

### Consequences Of Violation
Slow temporal queries (10x+ degradation), inability to serve as-of queries within acceptable time, excessive I/O from sequence scans.

---

## Rule 4: Never Mutate the Event Store

### Category
Reliability

### Rule
Never DELETE or UPDATE rows in the `stored_events` table — corrections must be new events (e.g., `EmailAddressCorrected`).

### Reason
Temporal queries depend on the complete, immutable event history to reconstruct accurate past state. Mutating stored events produces incorrect state on replay, compromising audit integrity. Correction events preserve both the original event and the correction timeline.

### Bad Example
```php
DB::table('stored_events')
    ->where('aggregate_uuid', $orderId)
    ->where('event_type', 'OrderCreated')
    ->update(['payload->amount' => 200]); // Destroys temporal integrity
```

### Good Example
```php
// Correct via new event — preserves history
StoredEvent::create([
    'aggregate_uuid' => $orderId,
    'event_type' => 'OrderAmountCorrected',
    'payload' => ['new_amount' => 200, 'reason' => 'coupon_applied'],
]);
```

### Exceptions
GDPR erasure requests where entire aggregate event streams must be deleted by law — document the erasure and break temporal query capability.

### Consequences Of Violation
Incorrect temporal query results, broken audit trail, non-compliance with audit requirements, undebuggable data discrepancies.

---

## Rule 5: Retained Event and Snapshot Retention Policy

### Category
Maintainability

### Rule
Always define and enforce a retention policy — keep full events for 90 days, daily snapshots for 3 years, yearly snapshots beyond.

### Reason
Keeping all events forever grows the event store to terabytes, making snapshot creation slow and storage costs high. A defined policy bounds the data while preserving the ability to answer "what was the state on any date" via daily snapshots.

### Bad Example
```php
// No retention pruning
public function prune(): void
{
    // Nothing — events kept forever
}
```

### Good Example
```php
public function prune(): void
{
    StoredEvent::where('created_at', '<', now()->subDays(90))->delete();
    Snapshot::where('snapshot_date', '<', now()->subYears(3))->delete();
}
```

### Exceptions
Regulatory requirements (finance, healthcare) may mandate longer retention — adjust TTLs to match legal obligations.

### Consequences Of Violation
Unbounded storage growth, slow snapshot creation over full history, increased backup costs, eventual disk-full failures.

---

## Rule 6: Validate Snapshots Periodically

### Category
Reliability

### Rule
Always schedule weekly snapshot validation — compare a random sample of snapshots against full replay and recreate all snapshots if any mismatch is found.

### Reason
Buggy snapshot logic produces incorrect temporal queries silently. A corrupted snapshot makes all temporal queries that use it return wrong state. Weekly validation catches corruption early and limits the damage window.

### Bad Example
```php
// No validation — assume snapshots are always correct
```

### Good Example
```php
$samples = Snapshot::inRandomOrder()->limit(100)->get();
foreach ($samples as $snapshot) {
    $fromSnapshot = TemporalQuery::stateAsOf($snapshot->aggregate_uuid, $snapshot->snapshot_date);
    $fromFullReplay = TemporalQuery::stateAsOfFullReplay($snapshot->aggregate_uuid, $snapshot->snapshot_date);
    if ($fromSnapshot !== $fromFullReplay) {
        Snapshot::truncate(); // Recreate all snapshots
        break;
    }
}
```

### Exceptions
No common exceptions. Snapshot validation is essential for data integrity.

### Consequences Of Violation
Silent data corruption in temporal queries, incorrect historical reports, undetected bugs that compound over time, loss of trust in analytics.
