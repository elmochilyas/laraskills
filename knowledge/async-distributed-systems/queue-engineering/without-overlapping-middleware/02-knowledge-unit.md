# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `WithoutOverlapping` Middleware
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `WithoutOverlapping` middleware prevents concurrent execution of the same job by using a cache-based lock. When a job acquires the lock, subsequent dispatches of the same job key will release themselves back to the queue (or be deleted) until the lock expires or the current execution finishes. This is essential for jobs that must not run simultaneously — such as billing operations, file processing, or any job that works on shared mutable state without idempotency guarantees.

# Core Concepts
- **Lock mechanism**: Atomic cache lock (Redis, Memcached, Database) with a unique key based on the job class and optional identifier.
- **Key scoping**: `WithoutOverlapping::byKey('process-orders')` creates a lock scoped to the key. Jobs with the same key cannot overlap.
- **Release duration**: Jobs are released back to the queue (not failed) when the lock is held. `releaseAfter($seconds)` controls release delay.
- **Lock expiry**: The lock has a TTL, configurable via `expireAfter($seconds)`. If a job crashes, the lock expires automatically.
- **`SharedLock` vs `ExclusiveLock`**: By default, uses exclusive lock (one job at a time). Can be configured for shared lock (multiple readers).

# Mental Models
- **Single-occupancy bathroom**: Only one person (job) can be in the bathroom at a time. If someone else tries to enter while it's occupied, they wait (release) and try again later. If the first person doesn't come out (timeout), the lock auto-releases after X minutes.
- **Turnstile**: The job is a turnstile — only one person passes at a time. The cache lock is the mechanical interlock that prevents the next person from entering until the current one has passed.

# Internal Mechanics
- `WithoutOverlapping` middleware acquires a cache lock before `$next($job)`.
- The lock key is `laravel-queue-overlap:{job-class}:{key}`.
- `$job->release($releaseAfter)` is called if the lock cannot be acquired.
- The lock is released after the job completes (success or failure).
- If the job fails to release the lock (crash, timeout), the lock auto-expires via TTL (`expireAfter`).
- The middleware uses `Illuminate\Cache\Lock` — atomic operations via `Cache::lock($key)->get()`.
- If `releaseAfter` is not specified, the job is released immediately (tight loop).
- The `expireAfter` default is the job's `$timeout` property.

# Patterns
## Key-Scoped Exclusion
- **Purpose**: Prevent overlapping for a specific entity (e.g., a user, order, file).
- **Benefit**: Different entities can process in parallel; same entity serializes.
- **Tradeoff**: Each unique key creates a separate lock. Many keys = many lock entries.

## Timeout-Synced Expiry
- **Purpose**: Set `expireAfter` to match expected job execution time.
- **Benefit**: Lock auto-releases if job hangs or is killed.
- **Tradeoff**: If `expireAfter` is too short, overlapping occurs.

## Release on Failure via Middleware
- **Purpose**: Explicitly release lock even on job failure.
- **Benefit**: Other instances of the same job can proceed.
- **Tradeoff**: If the worker crashes mid-release, lock persists until TTL.

# Architectural Decisions
- **Use for jobs that mutate shared state**: Where two instances would corrupt each other's data.
- **Avoid for read-only jobs**: Overlapping reads are safe and don't need locking.
- **Key scoping is critical**: Without a key, the middleware locks the job class globally — one job instance blocks ALL instances.
- **Set `releaseAfter` to a meaningful backoff**: Immediate release creates hot loops. 5-10 seconds is standard.

# Tradeoffs
Globally scoped lock (no key) | Simple, one lock per job class | Serializes ALL executions; unnecessary blocking
Key-scoped lock | Entity-level serialization; parallel safe | More lock keys; key selection logic
Short release after (1s) | Job retries quickly | Hot loops; cache lock contention
Long release after (30s) | Cooldown, less contention | Delay for legitimate retry attempts

# Performance Considerations
- Cache lock acquisition: ~1-5ms per attempt.
- Lock TTL: `expireAfter` should be longer than the job's maximum execution time.
- If the job takes 30s and `expireAfter` is 30s, a second instance may acquire the lock before the first finishes (race condition).
- Multiple overlapping attempts on the same key: each attempt does a lock check → release. At high concurrency, this creates lock contention.

# Production Considerations
- Monitor "overlapping prevented" count — if it's high, the queue is dispatching more instances of the job than necessary.
- Lock entries in cache (Redis) persist for `expireAfter`. Monitor cache memory used by lock keys.
- If the cache driver doesn't support atomic locks (e.g., `file` driver), the middleware may incorrectly allow overlapping.
- On Redis restart, all locks are lost. Overlapping may occur until the first job acquires the lock.
- The lock is NOT re-entrant. If the same job instance tries to acquire the lock twice (e.g., in a loop within handle()), it will deadlock.

# Common Mistakes
- **Not setting `releaseAfter`**: Immediate release creates a tight retry loop — the job retries instantly, hits the lock, releases, retries, etc. CPU waste.
- **Not scoping the lock key**: `WithoutOverlapping` without `->byKey()` locks globally. All dispatches of that job class serialize.
- **Setting `expireAfter` too short**: If the job takes 60 seconds and `expireAfter` is 30 seconds, a second instance acquires the lock and runs in parallel — defeating the purpose.
- **Using without locking cache driver**: The `array` cache driver doesn't support atomic locks. Job appears to be locked but overlap still occurs.
- **Forgetting to clean up locks on job failure**: If the job fails (exception), does the lock release? The middleware's `failed()` should release the lock.

# Failure Modes
- **Lock expiration mid-execution**: Job takes longer than `expireAfter`. Lock auto-releases. A second instance starts and overlaps with the still-running first instance.
- **Deadlock on re-entrant call**: Job dispatches another instance of itself on the same key within `handle()`. It tries to acquire the already-held lock and fails — deadlock.
- **Cache driver doesn't support locks**: `array`, `file` cache drivers don't support atomic locks. The middleware appears to work but overlapping occurs silently.
- **Distributed clock skew**: If lock TTL is based on server time and servers have clock skew, locks may expire earlier than intended.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Queue\Middleware\WithoutOverlapping` built-in.
- **Laravel Horizon**: Overlapping-prevented jobs appear as released. No special handling.
- **Spatie packages**: Some Spatie packages use `WithoutOverlapping` internally for jobs that process shared files or records.

# Related Knowledge Units
- K055 `ShouldBeUnique` and Unique Job Locking (related uniqueness concept) | K076 `RateLimiter` Facade (underlying cache mechanism)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
