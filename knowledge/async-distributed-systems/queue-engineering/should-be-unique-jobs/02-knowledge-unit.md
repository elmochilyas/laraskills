# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `ShouldBeUnique` and Unique Job Locking
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The `ShouldBeUnique` interface prevents duplicate instances of the same job from being dispatched while another instance of that job (with the same unique key) is still in the queue. Unlike `WithoutOverlapping` (which prevents concurrent EXECUTION), `ShouldBeUnique` prevents concurrent DISPATCH — the second dispatch is silently dropped if a job with the same key is already queued or processing. It uses a cache-based lock (typically Redis) with a configurable TTL via `uniqueFor`. The `uniqueVia()` method allows customizing how the unique key is generated.

# Core Concepts
- **`ShouldBeUnique`**: Marker interface. Implement on the job class. Prevents duplicate queued instances.
- **`uniqueId()`**: Returns the unique key for the job. Default is the job class name. Override for scoped uniqueness (e.g., per model).
- **`uniqueFor()`**: Duration (seconds) the job is considered unique. After this, another instance can be dispatched.
- **`uniqueVia()`**: Returns a `UniqueLock` instance (e.g., `RedisUniqueLock`) for custom locking implementation.
- **Cache lock**: The lock is stored in the cache (Requires atomic lock support: Redis, Memcached, DynamoDB, Database, File).
- **Dropped dispatch**: If the lock is held, `Bus::dispatchToQueue()` does NOT push the job to the queue. The dispatch is silently ignored.

# Mental Models
- **Membership list**: Only one person (job) with a given ID can be in the club at a time. If they're already inside (queued or processing), the bouncer (middleware) turns away the duplicate at the door.
- **School attendance**: Only one student (unique key) per seat. If the student is already in the classroom (queue), a duplicate enrollment is rejected.

# Internal Mechanics
- When a `ShouldBeUnique` job is dispatched, `Bus::dispatchToQueue()` checks the unique lock before pushing.
- If the lock is acquired: the job is pushed to the queue. The lock is released when the job completes (or expires via `uniqueFor`).
- If the lock is NOT acquired (another instance exists): the job is NOT pushed. `dispatch()` returns `null` instead of `PendingDispatch`.
- The lock key is `laravel_unique_job:{uniqueId()}`.
- `uniqueFor` defaults to 0 (lock never auto-releases unless job completes). Set to a value to avoid stale locks.
- `uniqueVia()` allows custom lock backends: cache, database, or custom mechanism.
- For testing: `Bus::assertNotDispatched()` can verify that duplicate jobs were suppressed.

# Patterns
## Model-Scoped Uniqueness
- **Purpose**: Only one job per model instance should be queued at a time.
- **Benefit**: Prevents duplicate processing for the same entity.
- **Tradeoff**: Unique key must be derived from model ID.

## Throttle-Stop for High-Dispatch Scenarios
- **Purpose**: Prevent rapid dispatches of the same job (e.g., webhook flood).
- **Benefit**: Only one instance processes; subsequent ones are dropped.
- **Tradeoff**: Some legitimate dispatches may be dropped.

## Unique with Timeout
- **Purpose**: Job is unique for N seconds, then another can dispatch.
- **Benefit**: Regular processing cadence for recurring tasks.
- **Tradeoff**: If the first job takes longer than N seconds, a second starts.

# Architectural Decisions
- **Use `ShouldBeUnique` when**: Duplicate dispatch of the same job (by key) is harmful. More restrictive than `WithoutOverlapping` because it prevents dispatch entirely.
- **Use `WithoutOverlapping` when**: Concurrency is the concern, not duplicate dispatch. `WithoutOverlapping` still pushes the job to the queue (and releases it).
- **Use both when**: You want to prevent both duplicate dispatch AND concurrent execution. The unique prevents the second dispatch; overlapping prevents the second execution if timing windows overlap.
- **Always set `uniqueFor`**: Without a timeout, a lock may persist forever if the job is deleted without completing.

# Tradeoffs
`ShouldBeUnique` with `uniqueFor` | Prevents duplicates with auto-expiry | TTL must be tuned; too short = duplicates, too long = blocks
`ShouldBeUnique` without `uniqueFor` | Never auto-releases | Stale lock blocks ALL future dispatches until cache expiry
`uniqueVia()` custom lock | Full control over locking mechanism | Additional code to maintain

# Performance Considerations
- Lock acquisition: cache operation (~1-5ms) per dispatch.
- Lock release: cache operation per job completion.
- Dropped dispatches: no job is created — saves queue storage and worker time.
- Cache TTL (`uniqueFor`) must be long enough to cover the job's maximum time in queue + execution time.

# Production Considerations
- The unique lock only prevents dispatch of a NEW job. If the same job is re-dispatched from `failed_jobs` (retry), it bypasses the unique check.
- If the cache driver doesn't support locks (`array`, `file`), the unique check silently fails — duplicates may be dispatched.
- Monitor the "unique suppression" rate. A high rate means many dispatches are being dropped — may indicate over-dispatching.
- On Redis restart, all unique locks are cleared. Previously suppressed jobs can be re-dispatched.
- The lock persists for `uniqueFor` seconds. If the cache is flushed, all locks are cleared.

# Common Mistakes
- **Not overriding `uniqueId()`**: The default is the class name. ALL instances of the job share the same lock. Only one instance can ever be queued.
- **Not setting `uniqueFor`**: Without a timeout, if a job is dispatched and then deleted (without completing), the lock persists forever. Future dispatches are blocked.
- **Using with non-locking cache drivers**: `array` cache doesn't support locks. The unique check is skipped; duplicates are dispatched.
- **Assuming unique prevents concurrent execution**: `ShouldBeUnique` prevents DISPATCH, not execution. Two workers CAN process the same unique job if both were dispatched before the second was suppressed.
- **Using unique for idempotency**: Unique prevents duplicate dispatch, not duplicate execution. For execution idempotency, use `SerializesModels` + deduplication.

# Failure Modes
- **Stale lock blocks future dispatches**: Job crashes after dispatch but before completion. Lock persists for `uniqueFor` seconds. No other instance can run.
- **`uniqueFor` expires mid-execution**: Job is still processing, but `uniqueFor` expires. A second instance is dispatched while the first is running.
- **Cache eviction of lock**: Redis evicts the unique lock key. Next dispatch succeeds — duplicate is created.
- **Race condition on lock acquisition**: Two dispatches at exactly the same time. Both may acquire the lock (rare with atomic Redis SETNX, but possible with weaker cache backends).

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Contracts\Queue\ShouldBeUnique` interface and `ShouldBeUniqueUntilProcessing` variant.
- **`ShouldBeUniqueUntilProcessing`**: Lock is released once the job STARTS processing (not after completion). Allows re-dispatch while the job runs.
- **Spatie packages**: Some packages use `ShouldBeUnique` for jobs that process external API data to prevent duplicate webhook processing.

# Related Knowledge Units
- K052 `WithoutOverlapping` Middleware (contrast) | K076 `RateLimiter` Facade (related locking mechanism)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
