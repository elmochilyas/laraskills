# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Queue/Job Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Queue/job testing verifies that jobs are dispatched with correct data, can be processed successfully, and handle failures gracefully. `Queue::fake()` records dispatched jobs without executing them, enabling assertions on what was queued. `Bus::fake()` does the same for command bus dispatches. Testing jobs is critical for any application using async processing—uncaught job failures silently degrade application functionality without immediate user feedback.

# Core Concepts
- **`Queue::fake()`**: Fakes the queue. Records pushed jobs. Assert with `assertPushed()`, `assertNotPushed()`, `assertPushedOn()`.
- **`Bus::fake()`**: Fakes the command bus. Records dispatched commands. Assert with `assertDispatched()`, `assertNotDispatched()`.
- **`assertPushed(Job::class)`**: Asserts a job was pushed to any queue.
- **`assertPushedOn('queue-name', Job::class)`**: Asserts a job was pushed on a specific queue connection.
- **`assertDispatched(Command::class)`**: Asserts a command was dispatched.
- **Job execution testing**: Use `Queue::fake()` + manual `$job->handle()` or test job directly with `$this->app->call([$job, 'handle'])`.
- **Batch testing**: `Bus::assertBatched()` for batch job assertions.
- **Job middleware testing**: Test that middleware (throttle, rate limit, unique) execute correctly.

# Mental Models
- **Queue fake as job inbox**: All dispatched jobs are captured. Assertions search this inbox.
- **Dispatch vs execution**: `Queue::fake()` tests the dispatch contract (what jobs, with what data, on which queue). Job execution (handle logic) is tested separately.
- **Job as self-contained unit**: A job has `handle()` method with dependencies injected. Test this method directly without the queue.
- **Queue as routing concern**: The queue name (high, default, low) and connection (redis, database, sqs) are configuration concerns. Test these separately from job logic.

# Internal Mechanics
- **`QueueFake::push()`**: Implements `Queue::push()`. Stores the job in an internal array with queue name and connection.
- **`assertPushed($job, $callback)`**: Filters by job class. If callback provided, applies it to each match. Asserts matches found.
- **`BusFake::dispatch()`**: Implements `Bus::dispatch()`. Stores the command in an internal array. Does NOT execute command handlers.
- **Job `handle()` resolution**: When called via `$job->handle()`, the container resolves method dependencies. Test like a service class.
- **Batch support**: `QueueFake::batch()` creates a `PendingBatch` that is also stored for assertion via `assertBatched()`.
- **Job middleware execution**: `Queue::fake()` does NOT execute middleware. Test middleware separately or manually call `$job->middleware()`.

# Patterns
- **Pattern: Dispatch assertion**
  - Purpose: Verify a job was queued with correct data
  - Benefits: Tests the dispatch contract without executing the job
  - Tradeoffs: Doesn't verify job execution correctness
  - Implementation: `Queue::fake(); $this->performAction(); Queue::assertPushed(ProcessOrder::class, fn ($job) => $job->order->id === $order->id)`

- **Pattern: Job execution test**
  - Purpose: Test the job's handle() method directly
  - Benefits: Full execution test without queue infrastructure
  - Tradeoffs: Manual dependency injection setup
  - Implementation: `$job = new ProcessOrder($order); $job->handle($service, $mailer); // assert side effects`

- **Pattern: Job on specific queue**
  - Purpose: Verify job is routed to the correct queue
  - Benefits: Ensures priority/processing order
  - Tradeoffs: Queue name is stringly-typed
  - Implementation: `Queue::assertPushedOn('high', ProcessOrder::class)`

- **Pattern: Failed job handling**
  - Purpose: Test job failure and `failed()` method
  - Benefits: Ensures cleanup/retry logic runs on failure
  - Tradeoffs: Must trigger actual failure (exception)
  - Implementation: `$job->failed($e); // assert cleanup actions`

# Architectural Decisions
- **`Queue::fake()` vs `Bus::fake()`**: Use `Queue::fake()` for async jobs (e.g., `ProcessPodcast`). Use `Bus::fake()` for sync commands (e.g., `CreateOrder`). Convention: commands = synchronous, jobs = asynchronous.
- **Dispatch test vs execution test**: Test both. Dispatch tests verify the right jobs are queued. Execution tests verify job correctness.
- **Job middleware testing**: Test middleware effects separately (e.g., test rate limiter behavior without the job).
- **Queue configuration testing**: Test that jobs are pushed to correct queues. Test that queue workers are configured correctly in CI.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Queue fake prevents real queue processing | Doesn't verify job execution | Layer execution tests |
| Dispatch assertions are fast and clear | Callback matching can be complex | Keep callbacks focused; extract helpers |
| Job execution tests are isolated | Must manually inject dependencies | Use `$this->app->call()` for auto-injection |
| Batch assertions cover grouped jobs | Batch configuration is complex | Test individual jobs and batch independently |

# Performance Considerations
- Fake registration: <0.5ms.
- Job push via fake: <0.1ms per job.
- Dispatch assertion: <0.1ms per assertion.
- Job execution test: Same as any service class test. 1-50ms depending on complexity.
- Batch assertions: <0.5ms.

# Production Considerations
- **Job retries**: Test that failed jobs are retried with `backoff()` and `maxAttempts()` configuration.
- **Job rate limiting**: `RateLimiter` middleware for jobs prevents worker saturation. Test with rate limiter fakes.
- **Job idempotency**: Jobs should be safe to retry (duplicate processing doesn't cause errors). Test with `Queue::fake()` and manual execution.
- **Job serialization**: Jobs are serialized to queue. Ensure all job properties are serializable (no closures, no live connections).
- **Job tag/uniqueness**: Unique jobs (same data = same job ID) should not be dispatched twice. Test with `shouldBeUnique()`.

# Common Mistakes
- **Mistake: Only testing dispatch, not execution**
  - Why: Queue::fake() makes dispatch testing easy
  - Why harmful: Job may fail at execution time (dependency resolution, business logic errors)
  - Better: Test both dispatch and execution paths

- **Mistake: Not testing the `failed()` method**
  - Why: Focus on happy path execution
  - Why harmful: Job failure may leave the system in inconsistent state
  - Better: Always test `failed()` for critical jobs

- **Mistake: Using `Queue::fake()` for jobs that must run synchronously**
  - Why: Some jobs should be sync (Queue::sync() connection)
  - Why harmful: `Queue::fake()` prevents execution even on sync connection
  - Better: Use environment-specific queue config; test sync path with real sync queue

- **Mistake: Testing job with real third-party services**
  - Why: Job's handle() makes real API calls
  - Why harmful: Slow, unreliable, may have side effects
  - Better: Fake external services (Http::fake()) in job execution tests

# Failure Modes
- **Job serialization failure**: Properties that can't be serialized (Closures, resources). Test serialization with `serialize($job)` and `unserialize()`.
- **Queue connection configuration**: Job dispatched to `redis` but tests use `sync`. Use `QUEUE_CONNECTION=sync` in `.env.testing` for execution tests.
- **Batch job failure in mid-batch**: A job in the middle of a batch fails. Ensure batch catch/allowed method handles partial failures.
- **Job `displayName()` changes**: Job display name change doesn't affect functionality but may affect monitoring. Keep stable.

# Ecosystem Usage
- **Laravel core**: Queue system tests cover dispatch, execution, retries, and failure handling extensively.
- **Laravel Horizon**: Horizon's queue monitoring and management tools are tested with `Queue::fake()` and manual job execution.
- **Laravel Spark**: Subscription-related jobs (metered billing updates, plan synchronization) use `Queue::fake()` and execution tests.
- **Laravel Vapor**: Vapor's queue integration for serverless environments is tested with job dispatch and execution patterns.

# Related Knowledge Units
- **Prerequisites**: Queue configuration, Job development, Service container
- **Related Topics**: Event testing, Mail/notification testing, Bus testing
- **Advanced Follow-up**: Job middleware development, Batch job processing, Queue worker configuration testing

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
