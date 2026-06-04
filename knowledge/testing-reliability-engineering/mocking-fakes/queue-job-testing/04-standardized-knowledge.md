# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Queue/Job Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Queue configuration, Job development, Service container |
| Related KUs | Event testing, Mail/notification testing, Bus testing |
| Source | domain-analysis.md K034 |

# Overview

Queue/job testing verifies that jobs are dispatched with correct data, can be processed successfully, and handle failures gracefully. `Queue::fake()` records dispatched jobs without executing them, enabling assertions on what was queued. `Bus::fake()` does the same for command bus dispatches. Testing jobs is critical for any application using async processing — uncaught job failures silently degrade application functionality without immediate user feedback.

# Core Concepts

- **`Queue::fake()`**: Fakes the queue. Records pushed jobs. Assert with `assertPushed()`, `assertNotPushed()`, `assertPushedOn()`.
- **`Bus::fake()`**: Fakes the command bus. Records dispatched commands.
- **`assertPushed(Job::class)`**: Asserts a job was pushed to any queue.
- **`assertPushedOn('queue-name', Job::class)`**: Asserts a job was pushed on a specific queue.
- **Job execution testing**: Call `$job->handle()` directly or use `$this->app->call([$job, 'handle'])` for dependency injection.
- **Batch testing**: `Bus::assertBatched()` for batch job assertions.
- **Failed job handling**: Test `$job->failed($e)` for cleanup/retry logic.

# When To Use

- For every job class in the application (verifying dispatch and execution)
- For commands dispatched via the command bus
- For job batches (verify batch composition and processing)
- For testing job failure handling (retries, cleanup)
- For testing job middleware (rate limiting, unique jobs)

# When NOT To Use

- For testing queue infrastructure (connection configuration, worker processes)
- For jobs that execute synchronously (use `Queue::connection('sync')` and test directly)
- When the job is a simple wrapper with no custom logic (test the underlying service)
- For testing queue monitoring/management tools

# Best Practices (WHY)

- **Test both dispatch and execution**: `Queue::fake()` tests what was queued. Manual `$job->handle()` tests the job runs correctly. Missing either means incomplete coverage.
- **Test the `failed()` method**: Job failures can leave the system in an inconsistent state. The `failed()` method handles cleanup. Test it explicitly by calling `$job->failed($e)`.
- **Use `assertPushedOn()` for queue routing**: Jobs pushed to the wrong queue may not be processed by the correct worker. Verify the queue name.
- **For sync execution, test with `Bus::fake()` and manual `handle()`**: `Queue::fake()` prevents even sync queue execution. Test dispatch with fake, then test execution by calling `handle()`.
- **Test job serialization**: Jobs are serialized to the queue. Non-serializable properties (closures, live connections) cause runtime failures. `serialize($job)` and `unserialize()` in tests.

# Architecture Guidelines

- **`Queue::fake()` vs `Bus::fake()`**: Use `Queue::fake()` for async jobs. Use `Bus::fake()` for sync commands. Convention: commands = synchronous, jobs = asynchronous.
- **Dispatch test vs execution test**: Dispatch tests verify the right jobs are queued with correct data. Execution tests verify job correctness. Both are needed.
- **Job middleware**: Test middleware effects separately (e.g., test rate limiter behavior without the job).
- **Unique jobs**: `shouldBeUnique()` jobs should not be dispatchable twice. Test with `assertPushed()` and `assertNotPushed()`.

# Performance Considerations

- Fake registration: <0.5ms.
- Job push via fake: <0.1ms per job.
- Dispatch assertion: <0.1ms per assertion.
- Job execution test: 1-50ms depending on complexity.
- Batch assertions: <0.5ms.

# Security Considerations

- Jobs handling sensitive data should not log that data. Test job execution with data isolation.
- Test that failed jobs don't leak sensitive information in error reports.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing dispatch, not execution | `Queue::fake()` makes dispatch testing easy | Job may fail at execution time (dependency resolution, business logic errors) | Test both dispatch and execution paths |
| Not testing the `failed()` method | Focus on happy path execution | Job failure may leave system in inconsistent state | Always test `failed()` for critical jobs |
| Using `Queue::fake()` for sync-only jobs | Jobs configured for sync connection | `Queue::fake()` prevents execution even on sync | Use real sync queue or test `handle()` directly |
| Testing job with real third-party services | Job's `handle()` makes real API calls | Slow, unreliable, may have side effects | Fake external services in job execution tests |
| Not testing job serialization | Jobs work in tests (sync) but fail in production (queue) | Non-serializable properties cause runtime failures | Test `serialize()` and `unserialize()` in tests |

# Anti-Patterns

- **Dispatch-only testing**: Only asserting the job was pushed, never testing its `handle()` method. Job may be broken at execution time.
- **No failure path**: No test for `failed()` method. Cleanup logic is dead code until a job fails in production.
- **Real API calls in job tests**: Job's `handle()` makes real HTTP calls. Use `Http::fake()` in execution tests.
- **Non-serializable job properties**: Jobs that work in tests (sync) but fail in production (serialized to Redis). Always test serialization.

# Examples

```php
// Dispatch assertion with data
public function test_order_processing_job_is_dispatched()
{
    Queue::fake();
    $order = Order::factory()->create();

    $this->actingAs($user)->post('/orders', $data);

    Queue::assertPushed(
        ProcessOrder::class,
        fn ($job) => $job->order->id === $order->id
    );
}

// Queue-specific dispatch
public function test_high_priority_job_on_correct_queue()
{
    Queue::fake();

    $this->actingAs($user)->post('/priority-order', $data);

    Queue::assertPushedOn('high', ProcessOrder::class);
}

// Job execution test
public function test_process_order_job_handles_correctly()
{
    Mail::fake();
    $order = Order::factory()->create();
    $job = new ProcessOrder($order);

    $job->handle();

    $this->assertTrue($order->fresh()->processed);
    Mail::assertSent(OrderConfirmation::class);
}

// Failed job handling
public function test_process_order_job_cleanup_on_failure()
{
    $order = Order::factory()->create();
    $job = new ProcessOrder($order);

    $job->failed(new \Exception('Payment failed'));

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'status' => 'failed',
    ]);
}

// Bus batch testing
public function test_order_processing_batch()
{
    Bus::fake();

    $this->actingAs($user)->post('/batch-orders', $orders);

    Bus::assertBatched(function ($batch) {
        return $batch->jobs->count() === 3;
    });
}
```

# Related Topics

- **Prerequisites**: Queue configuration, Job development, Service container
- **Related**: Event testing, Mail/notification testing, Bus testing
- **Advanced**: Job middleware development, Batch job processing, Queue worker configuration testing

# AI Agent Notes

- Always test both dispatch and execution for every job. Dispatch testing with `Queue::fake()` is easy to forget the execution test.
- The `failed()` method is critical — test it by calling `$job->failed($e)` and asserting cleanup actions.
- For job serialization testing, add a simple test: `serialize($job); unserialize($serialized);` — this catches non-serializable properties early.

# Verification

- [ ] Every job has both a dispatch test and an execution test
- [ ] The `failed()` method is tested for all critical jobs
- [ ] Queue routing is verified with `assertPushedOn()`
- [ ] Job data is verified in dispatch assertions
- [ ] External services are faked in job execution tests
- [ ] Job serialization is tested (`serialize()`/`unserialize()`)
- [ ] Unique jobs are tested (can't dispatch duplicate)
- [ ] Job batches are tested where used
