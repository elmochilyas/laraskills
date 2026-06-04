## Calculate Octane connection budget before deploying: workers × connections ≤ database max_connections × 0.8
---
Category: Scalability
---
Compute the total persistent connection count as worker_count × connections_per_worker and ensure it leaves 20% headroom below database max_connections before deploying Octane.
---
Reason: Octane workers hold persistent database connections — unlike FPM where connections are created and destroyed per request, Octane connections persist for the worker's lifetime. An Octane deployment with 16 workers × 2 connections each = 32 persistent connections. If database max_connections is 40, that's 80% utilization — one extra connection-hungry operation exhausts the pool. The 20% safety margin reserves capacity for administrative queries, migrations, and background jobs.
---
Bad Example:
```bash
# No connection budget calculated — exhaustion inevitable
# 16 workers × 3 connections each = 48 persistent connections
# Database max_connections = 40 — pool exhausted immediately
```

Good Example:
```bash
# Connection budget calculated with safety margin
# 8 workers × 2 connections each = 16 persistent connections
# Database max_connections = 40 → 16 < 32 (40 × 0.8) — safe
```
---
Exceptions: When a connection pooler (PgBouncer, ProxySQL) decouples web workers from database connections, the constraint is relaxed but should still be monitored.
---
Consequences Of Violation: Database connection exhaustion, connection refused errors, cascading application failures under peak load.

## Always commit or rollback transactions in a finally block within Octane workers
---
Category: Reliability
---
Ensure every database transaction is committed or rolled back in a finally block (or equivalent cleanup) so that no open transaction persists across requests within the same worker.
---
Reason: In Octane's persistent worker model, an uncommitted transaction left open at request end carries into the next request. All subsequent queries in that worker execute within the stale transaction context, potentially causing data corruption, phantom reads, or deadlocks. Octane's sandbox reset handles Eloquent-level cleanup, but raw PDO queries and manual DB::beginTransaction() calls bypass this.
---
Bad Example:
```php
DB::beginTransaction();
$user = User::find($id);
$user->update(['name' => 'New']);
// Forgot to commit — next request's queries run inside this transaction
```

Good Example:
```php
DB::beginTransaction();
try {
    $user = User::find($id);
    $user->update(['name' => 'New']);
    DB::commit();
} catch (Throwable $e) {
    DB::rollBack();
    throw $e;
}
```
---
Exceptions: Read-only queries that never open a transaction do not need this handling.
---
Consequences Of Violation: Stale transaction context leaks across requests, data corruption, deadlocks, difficult-to-diagnose intermittent failures.

## Set connection pool timeout in database configuration for all Octane environments
---
Category: Configuration
---
Configure PDO::ATTR_TIMEOUT (or equivalent) in the database connection configuration to prevent workers from hanging indefinitely when the connection pool is exhausted.
---
Reason: When all database connections are checked out by other workers, a request attempting to acquire a new connection blocks indefinitely by default. This causes the entire worker to hang, making it unresponsive for all subsequent requests until the connection timeout fires. A 5-second timeout ensures the worker fails fast and can return an error response rather than hanging forever.
---
Bad Example:
```php
// No timeout — worker hangs forever when pool is exhausted
'mysql' => [
    'driver' => 'mysql',
    // options not configured — indefinite wait
]
```

Good Example:
```php
'mysql' => [
    'driver' => 'mysql',
    'options' => [
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ],
]
```
---
Exceptions: Applications that prefer queuing over failing may use longer timeouts but must implement worker-level health checks to detect hung workers.
---
Consequences Of Violation: Workers hang indefinitely when connection pool is exhausted, unresponsive workers accumulate, cascading degradation across all workers.

## Monitor database connection utilization per Octane worker and alert at 80%
---
Category: Monitoring
---
Track the number of open database connections per Octane worker and alert when total utilization exceeds 80% of max_connections.
---
Reason: Octane's persistent connections make connection exhaustion a gradual rather than instantaneous event. Unlike FPM where connections are released after each request, Octane connections accumulate as workers start and never decrease. A slow connection leak (0.5 connections per hour) will exhaust the pool over 24 hours. Monitoring the utilization trend catches this days before a crash.
---
Bad Example:
```bash
# No connection monitoring — exhaustion comes as a surprise
# Database connection refused at 2 AM, no trend data to analyze
```

Good Example:
```bash
# Connection utilization trended and alerted
# Monday: 45% — OK
# Tuesday: 52% — OK
# Wednesday: 78% — warning threshold hit, investigation triggered
```
---
Exceptions: Environments with connection poolers (PgBouncer, ProxySQL) should monitor the pooler's utilization instead of direct database connections.
---
Consequences Of Violation: Undetected connection creep, sudden connection exhaustion under peak traffic, emergency capacity scrambling during incident.

## Separate read and write database connections for Octane workloads
---
Category: Architecture
---
Configure distinct read and write database hosts in config/database.php to route SELECT queries to read replicas, preserving write-primary connections for mutations.
---
Reason: Octane workers maintain persistent connections to both read and write endpoints. In a typical application, 80%+ of queries are reads. If all queries hit the write primary, connection consumption is 5x higher than necessary. Read replicas scale connection capacity independently and prevent read-heavy operations (reporting, dashboard) from exhausting the write-primary connection pool.
---
Bad Example:
```php
// All queries hit write-primary — wastes connection capacity on reads
'mysql' => [
    'host' => 'primary.example.com',
]
```

Good Example:
```php
'mysql' => [
    'read' => ['host' => ['replica1.example.com']],
    'write' => ['host' => ['primary.example.com']],
]
```
---
Exceptions: Applications with read-after-write consistency requirements must verify the replica lag is acceptable for the read workload.
---
Consequences Of Violation: Write-primary connection pool exhausted by read queries, write operations blocked, database connection errors under peak load.
