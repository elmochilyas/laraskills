# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Job Faking and Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel provides `Queue::fake()` as the primary testing tool for queue interactions. It intercepts all queue push operations, storing jobs in an in-memory array for assertion without executing them. The faking mechanism binds a `FakeQueue` implementation over the real `QueueManager`, capturing dispatched jobs with their connection, queue, delay, and payload metadata. Testing patterns include asserting a job was pushed, asserting it was pushed to a specific queue/connection, asserting it was not dispatched, and asserting specific properties on the job instance.

# Core Concepts
- **`Queue::fake()`**: Swaps `QueueManager` with a `QueueFake` that captures dispatched jobs. Call before the action being tested.
- **`Bus::fake()`**: Similar but for job batches and chains. Captures batch/chain dispatches.
- **Assertions**: `assertPushed()`, `assertNotPushed()`, `assertPushedOn()`, `assertCount()`.
- **Job querying**: `pushed()` returns a `Collection` of `FakeJob` instances that can be filtered by class, closure, or callable.
- **Batch assertions**: `assertBatchDispatched()` for batch testing, `assertChained()` for chain testing.
- **Mail/Notification faking**: `Mail::fake()` and `Notification::fake()` have their own assertion methods, separate from `Queue::fake()`.

# Mental Models
- **Camera snapshots**: Instead of letting the job run (which would be asynchronous and untestable), `Queue::fake()` takes a snapshot of what was dispatched. Your test inspects the snapshot.
- **Flight recorder**: The fake records every dispatch event with full metadata. You query the recorder to verify the right jobs went to the right places with the right configuration.

# Internal Mechanics
- `Queue::fake()` calls `QueueManager::swap()` with a `QueueFake` instance.
- `QueueFake` creates a `FakeQueue` for each connection name on first access.
- When `FakeQueue::push()` is called, it stores the job in an in-memory `$this->jobs[]` array.
- The job is stored as a `FakeJob` object containing: class name, unserialized job instance, queue name, connection name, delay, middleware.
- `assertPushed(JobClass::class)` calls `$this->pushed(JobClass::class)` which filters `$this->jobs` by class name.
- For jobs dispatched with specific connection/queue, `assertPushedOn('queue-name')` filters by queue name.
- `Bus::fake()` works similarly: it creates a `BusFake` that replaces `Bus::dispatch()`, capturing batches and chains instead of individual jobs.

# Patterns
## Selective Faking
- **Purpose**: Fake only specific connections or queue names.
- **Benefit**: Some jobs dispatch to a different connection that you don't want to fake.
- **Tradeoff**: Increases test complexity; easy to accidentally leave a connection unfaked.

## Callback Assertions
- **Purpose**: Assert specific properties or state on the dispatched job.
- **Benefit**: Verify the job was configured correctly (queue, connection, delay, constructor args).
- **Tradeoff**: Tests are coupled to job implementation details.

## Fake + DispatchSync
- **Purpose**: Assert the job was dispatched, then execute it synchronously.
- **Benefit**: Verify both dispatch behavior and job logic in one test.
- **Tradeoff**: `dispatchSync` bypasses the fake if not careful.

## Batch/Chain Faking
- **Purpose**: Test batch and chain composition without executing jobs.
- **Benefit**: Verify batch structure, callbacks, and chain order.
- **Tradeoff**: Serialized closures in batch callbacks cannot be inspected directly.

# Architectural Decisions
- **Fake all dispatches in unit tests**: Prevents accidental async side effects in test isolation. Only integration tests should process real queues.
- **Test dispatch separately from job logic**: `Queue::fake()` to test dispatch behavior, `dispatchSync()` or `Bus::dispatchNow()` to test job logic.
- **Use `assertPushedWithChain()` for chain testing**: Asserts the job was pushed with specific chained jobs attached.

# Tradeoffs
Queue::fake() | Complete isolation, no side effects | Must mock by class name; can't test deserialization
dispatchSync() | Tests job logic inline | Not testing async behavior; can hide serialization issues
Integration test with real queue | Tests full pipeline, including serialization | Slower, infrastructure dependent

# Performance Considerations
- `Queue::fake()` stores all dispatched jobs in memory for test duration. For tests dispatching thousands of jobs, memory may be a concern.
- Each assertion filters the entire pushed job array. For very large dispatches, this could be slow.
- Fake assertions do NOT test serialization — the job is stored as an object, never serialized. Real serialization issues are not caught.

# Production Considerations
- `Queue::fake()` is for testing only. Never use in production or non-test environments.
- The fake does not persist — jobs are lost when the test finishes.
- Jobs dispatched via `dispatchAfterResponse()` are also captured by `Queue::fake()`.
- If your code dispatches jobs to multiple connections, `Queue::fake()` fakes all of them. Use `Queue::fake(['redis' => ...])` for selective faking.

# Common Mistakes
- **Asserting a job was dispatched without enabling the fake**: Without `Queue::fake()`, jobs are pushed to the real queue. Assertions fail because the real queue doesn't store for assertion.
- **Using `assertPushed()` with closures**: Closures dispatched directly don't have a class name. Use `assertPushed(CallQueuedClosure::class)` or `assertDispatched(function ($job) { ... })`.
- **Forgetting `Bus::fake()` for batch assertions**: Batches are dispatched via `Bus::batch()`, not `Queue::push()`. Use `Bus::fake()` and `assertBatchDispatched()`.
- **Testing job logic with `Queue::fake()` active**: `Queue::fake()` prevents execution. Test job logic separately with `dispatchSync()`.

# Failure Modes
- **False positive on class name**: If multiple jobs have similar names or aliases, `assertPushed()` may match the wrong class. Use callback assertions for precise matching.
- **Fake leaks between tests**: If `Queue::fake()` is not cleaned up in `setUp()` or `tearDown()`, faked jobs accumulate across tests.
- **Missing `Bus::fake()` for `Bus::dispatch()`**: `Queue::fake()` does NOT capture `Bus::dispatch()`. A job dispatched via `Bus::dispatch()` is not faked.

# Ecosystem Usage
- **Laravel framework**: Used extensively in core test suite for queue functionality.
- **Laravel Horizon**: Horizon's own test suite uses `Queue::fake()` for testing supervisor interactions.
- **Spatie packages**: Test suites use both `Queue::fake()` for dispatch assertions and `Bus::fake()` for batch-related webhook flows.

# Related Knowledge Units
- K006 ShouldQueue Contract and Queueable Types (what gets faked) | K007 PendingDispatch Lifecycle (dispatch timing)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
