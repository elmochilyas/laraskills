# Rule Card: K088 — Job Faking and Testing

---

## Rule 1

**Rule Name:** queue-fake-before-action

**Category:** Always

**Rule:** Always call `Queue::fake()` before the action under test.

**Reason:** Without `Queue::fake()`, jobs go to the real queue and assertions miss them.

**Bad Example:**
```php
public function test_order_dispatches_job(): void
{
    ProcessOrder::dispatch($order);
    Queue::assertPushed(ProcessOrder::class); // Fails — jobs went to real queue
}
```

**Good Example:**
```php
public function test_order_dispatches_job(): void
{
    Queue::fake();
    ProcessOrder::dispatch($order);
    Queue::assertPushed(ProcessOrder::class);
}
```

**Exceptions:** Integration tests that need the full pipeline should not use `Queue::fake()`.

**Consequences Of Violation:** Assertions pass vacuously or tests depend on having a real queue backend running.

---

## Rule 2

**Rule Name:** prefer-callback-assertions

**Category:** Prefer

**Rule:** Prefer callback assertions over class-name-only assertions for precise job matching.

**Reason:** Class name matching catches the wrong job if multiple instances of the same class are dispatched with different data.

**Bad Example:**
```php
Queue::assertPushed(ProcessOrder::class); // Passes even if order ID is wrong
```

**Good Example:**
```php
Queue::assertPushed(function (ProcessOrder $job) use ($order) {
    return $job->orderId === $order->id;
});
```

**Exceptions:** When the job class has no distinguishing properties, class-name matching is sufficient.

**Consequences Of Violation:** False-positive test passes that miss data-specific bugs in dispatch logic.

---

## Rule 3

**Rule Name:** never-test-logic-with-fake

**Category:** Never

**Rule:** Never test job logic with `Queue::fake()` active.

**Reason:** `Queue::fake()` blocks execution — the job never runs, and the test passes vacuously.

**Bad Example:**
```php
Queue::fake();
ProcessOrder::dispatch($order);
// No assertion on side effects — job never executed
```

**Good Example:**
```php
$job = new ProcessOrder($order);
$job->handle(); // Test logic directly
```

**Exceptions:** When testing dispatch behavior only (not job execution), `Queue::fake()` is correct.

**Consequences Of Violation:** Job logic is never actually tested — bugs in `handle()` go undetected.

---

## Rule 4

**Rule Name:** use-bus-fake-for-batches

**Category:** Always

**Rule:** Always use `Bus::fake()` to test batches and chains.

**Reason:** `Queue::fake()` only captures individual dispatches — batch and chain dispatches use a different path through `BusFake`.

**Bad Example:**
```php
Queue::fake();
Bus::batch([...])->dispatch();
Bus::assertBatchDispatched(...); // Fails — QueueFake doesn't capture Bus
```

**Good Example:**
```php
Bus::fake();
Bus::batch([...])->dispatch();
Bus::assertBatchDispatched(...);
```

**Exceptions:** When testing only individual job dispatches, `Queue::fake()` is sufficient.

**Consequences Of Violation:** Batch and chain assertions fail, creating false negatives in tests.

---

## Rule 5

**Rule Name:** cleanup-fakes-between-tests

**Category:** Always

**Rule:** Always clean up fakes between tests in `setUp()` or `tearDown()`.

**Reason:** `QueueFake` accumulates jobs in memory across tests — a later test sees jobs from an earlier test.

**Bad Example:**
```php
public function test_one(): void { Queue::fake(); ... }
public function test_two(): void { Queue::fake(); ... } // Sees jobs from test_one
```

**Good Example:**
```php
protected function tearDown(): void
{
    $this->app->forgetInstance('queue');
    parent::tearDown();
}
```

**Exceptions:** When using PHPUnit's `@depends` to chain tests intentionally, shared state may be desired.

**Consequences Of Violation:** False-positive test passes due to leaked job state across tests.

---

## Rule 6

**Rule Name:** assert-pushed-on-queue

**Category:** Prefer

**Rule:** Prefer `assertPushedOn('queue', Job::class)` over `assertPushed(Job::class)` when queue routing matters.

**Reason:** The queue name is part of the routing contract — `assertPushedOn` verifies the job is on the expected queue.

**Bad Example:**
```php
Queue::assertPushed(ProcessOrder::class); // Passes even if on wrong queue
```

**Good Example:**
```php
Queue::assertPushedOn('orders', ProcessOrder::class);
```

**Exceptions:** When queue routing is not part of the contract under test, `assertPushed` is sufficient.

**Consequences Of Violation:** Jobs dispatched to the wrong queue go undetected until production routing issues surface.
