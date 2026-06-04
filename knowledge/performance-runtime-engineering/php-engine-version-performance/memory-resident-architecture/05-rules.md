---
## Rule Name

Profile Bootstrap Cost Before Migrating

## Category

Performance

## Rule

Never migrate to a memory-resident architecture (Octane, Swoole, RoadRunner, FrankenPHP) without first profiling that framework bootstrap accounts for more than 20% of total request time.

## Reason

Memory-resident architectures eliminate per-request bootstrap overhead. If bootstrap is less than 20% of request time, the throughput gain will be modest (less than 2x) and the complexity of state management is unjustified.

## Bad Example

```bash
# Migrated to Octane without profiling — 500ms API endpoints see 10% gain
# Bootstrap was only 15ms of 500ms total
```

## Good Example

```bash
# Fast API endpoint: 30ms total, 20ms bootstrap (67% of time)
# Octane target: eliminate 20ms bootstrap -> 10ms per request -> 3x throughput
```

## Exceptions

Greenfield projects where the architecture is chosen upfront and bootstrap cost is known to dominate for the expected workload profile.

## Consequences Of Violation

Disappointing performance results, wasted migration effort, added complexity without commensurate gain.

---

## Rule Name

Audit All Static Properties and Singletons Before Migration

## Category

Architecture

## Rule

Never deploy to a memory-resident architecture before auditing every static property, singleton, and global variable for cross-request state leakage.

## Reason

Unlike PHP-FPM where each request is isolated in a fresh process, memory-resident workers persist state across requests. Static properties that assume per-request freshness can leak user data between sessions.

## Bad Example

```php
class UserProvider {
    private static ?User $currentUser = null;
    
    public function setUser(User $user): void {
        self::$currentUser = $user;  // Leaks across requests!
    }
}
```

## Good Example

```php
class UserProvider {
    // No static state — use request-scoped dependency injection
    public function setUser(User $user): void {
        $this->currentUser = $user;
    }
}
```

## Exceptions

Stateless singletons (configuration objects, cache instances) that are initialized once and never modified per-request.

## Consequences Of Violation

User data leakage between requests, authentication mix-ups, subtle logic bugs that are hard to reproduce, security incidents.

---

## Rule Name

Configure Worker Recycling with max_requests

## Category

Reliability

## Rule

Always set a `max_requests` limit (1000-5000) on memory-resident workers to prevent unbounded memory drift.

## Reason

Even with proper state management, PHP processes accumulate memory over time due to fragmentation, persistent allocator behavior, and hard-to-track references. Recycling after a fixed number of requests prevents out-of-memory conditions.

## Bad Example

```php
// No worker recycling — RSS grows until OOM
'octane' => [
    'max_requests' => 0,  // Unlimited
]
```

## Good Example

```php
// Worker recycling configured
'octane' => [
    'max_requests' => 2000,  // Recycle after 2000 requests
]
```

## Exceptions

Short-lived containers in auto-scaling groups where the container is destroyed before memory drift becomes problematic.

## Consequences Of Violation

Worker RSS grows unbounded, eventually causing OOM kills, request failures, and degraded performance as the OS reclaims memory.

---

## Rule Name

Use Connection Pooling for Database and Redis

## Category

Architecture

## Rule

Always use connection pooling for database and Redis connections when running a memory-resident architecture.

## Reason

Without pooling, each request creates new connections that persist across requests (since the worker lives on), leading to connection exhaustion and stale connection state. Pooling reuses connections and manages their lifecycle.

## Bad Example

```php
// New connection every request — connections accumulate
DB::connection('mysql')->getPdo();
```

## Good Example

```php
// Octane connection pool manages lifecycle
'octane' => [
    'database' => true,  // Enable built-in connection pooling
]
```

## Exceptions

Serverless or auto-scaled deployments where connection limits are high enough that exhaustion is not a practical risk.

## Consequences Of Violation

Database connection exhaustion, stale connections after failover, port exhaustion on the application server.

---

## Rule Name

Deploy with Graceful Worker Reload

## Category

Reliability

## Rule

Never deploy new code to memory-resident workers without a graceful reload mechanism that finishes in-flight requests before recycling.

## Reason

Killing workers mid-request corrupts state and loses responses. Memory-resident workers serve multiple requests per process, so a rolling restart must drain active connections before terminating.

## Bad Example

```bash
# Hard kill — drops active requests
kill -9 <worker-pid>
```

## Good Example

```bash
# Octane graceful reload
php artisan octane:reload --server=roadrunner
# Workers finish current requests before restarting
```

## Exceptions

Development environments where request loss is acceptable.

## Consequences Of Violation

Dropped in-flight requests, corrupted responses, user-facing errors during deployment, inconsistent state in downstream services.
