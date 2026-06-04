# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Queue/Job Testing

---

### Rule 1: Test both dispatch and execution for every job

| Field | Value |
|-------|-------|
| **Name** | Test dispatch and execution |
| **Category** | Job Testing |
| **Rule** | For every job class, write two tests: one that verifies the job is dispatched with correct data (`Queue::fake()` + `assertPushed()`), and one that verifies the job executes correctly (`$job->handle()`). |
| **Reason** | `Queue::fake()` only tests that the job was queued — it doesn't execute the job's `handle()` method. The job may dispatch correctly but fail at execution time due to dependency resolution, business logic errors, or missing data. |
| **Bad Example** | `Queue::fake(); $this->post('/order'); Queue::assertPushed(ProcessOrder::class);` — no execution test. |
| **Good Example** | Dispatch test + execution test: `$job = new ProcessOrder($order); $job->handle(); $this->assertDatabaseHas(...)`. |
| **Exceptions** | Jobs that are trivial wrappers around existing tested services. |
| **Consequences Of Violation** | Jobs dispatch apparently successfully but fail silently at execution time. |

---

### Rule 2: Test the `failed()` method for all critical jobs

| Field | Value |
|-------|-------|
| **Name** | Always test failure handling |
| **Category** | Job Testing |
| **Rule** | Call `$job->failed(new Exception(...))` in a test and verify cleanup actions are performed (database state updates, notifications, logging). |
| **Reason** | Job failures can leave the system in an inconsistent state — incomplete orders, stuck processing flags, missing records. The `failed()` method handles these edge cases. Without explicit testing, failure handling is dead code. |
| **Bad Example** | `$job->handle()` tested but `$job->failed($e)` never called in tests. |
| **Good Example** | `$job = new ProcessOrder($order); $job->failed(new \Exception('Payment failed')); $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'failed']);`. |
| **Exceptions** | Jobs that have no cleanup logic (trivially simple operations). |
| **Consequences Of Violation** | Job failures leave production data in an inconsistent state with no automated recovery. |

---

### Rule 3: Test job data in dispatch assertions

| Field | Value |
|-------|-------|
| **Name** | Verify job payload data |
| **Category** | Job Testing |
| **Rule** | Use the callback argument of `Queue::assertPushed(fn ($job) => $job->order->id === $order->id)` to verify the job carries the correct data. |
| **Reason** | Asserting only the class name (`Queue::assertPushed(ProcessOrder::class)`) tells you the job was queued, but not that it carries the correct payload. The job may be dispatched with the wrong order ID or missing data. |
| **Bad Example** | `Queue::assertPushed(ProcessOrder::class)` — doesn't verify which order. |
| **Good Example** | `Queue::assertPushed(fn (ProcessOrder $job) => $job->order->id === $order->id)`. |
| **Exceptions** | Jobs that carry no data (parameter-less jobs). |
| **Consequences Of Violation** | Jobs dispatched with wrong data. Wrong records processed in production. |

---

### Rule 4: Test job serialization

| Field | Value |
|-------|-------|
| **Name** | Verify job serializability |
| **Category** | Job Testing |
| **Rule** | Add a test that calls `serialize($job)` and `unserialize($serialized)` to verify all job properties are serializable. |
| **Reason** | Jobs work in tests (which run synchronously) but fail in production when a queue worker deserializes them. Non-serializable properties (Closures, live connections, resources) cause `SerializationException` at runtime. |
| **Bad Example** | Job passes all tests but crashes in production with "SerializationException". |
| **Good Example** | `$serialized = serialize($job); $restored = unserialize($serialized); $this->assertEquals($job->order->id, $restored->order->id);`. |
| **Exceptions** | Jobs configured for the `sync` driver only. |
| **Consequences Of Violation** | Jobs fail at production runtime. Queue worker logs serialization errors without processing the job. |

---

### Rule 5: Use `assertPushedOn()` to verify queue routing

| Field | Value |
|-------|-------|
| **Name** | Verify correct queue assignment |
| **Category** | Job Testing |
| **Rule** | Use `Queue::assertPushedOn('high', ProcessOrder::class)` to verify jobs are dispatched to the correct queue. |
| **Reason** | Jobs dispatched to the wrong queue may not be processed by the correct worker. High-priority jobs sent to the default queue may sit behind low-priority work. Queue routing is a configuration detail that is easily overlooked. |
| **Bad Example** | `Queue::assertPushed(ProcessOrder::class)` — doesn't verify which queue. |
| **Good Example** | `Queue::assertPushedOn('high', ProcessOrder::class)` — verifies correct queue. |
| **Exceptions** | Applications using the default queue only (no queue routing). |
| **Consequences Of Violation** | Jobs processed on wrong queue. Priority inversion: urgent jobs processed after routine work. |

---

### Rule 6: Fake external services in job execution tests

| Field | Value |
|-------|-------|
| **Name** | Fake external dependencies in job handler |
| **Category** | Test Isolation |
| **Rule** | When testing `$job->handle()`, call `Http::fake()`, `Mail::fake()`, `Storage::fake()`, etc. to prevent real external calls during job execution. |
| **Reason** | Jobs often interact with external services (APIs, mail, storage) during `handle()`. Without fakes, the job test makes real calls — slow, unreliable, potentially costly. The same principles apply as for HTTP tests. |
| **Bad Example** | `$job->handle()` — makes real HTTP calls to external APIs during test. |
| **Good Example** | `Http::fake(); $job->handle(); Http::assertSent(fn ($r) => $r->url() === 'https://api.example.com/orders');`. |
| **Exceptions** | Integration tests for a dedicated job testing suite. |
| **Consequences Of Violation** | Job tests make real API calls. Tests are slow, network-dependent, and may incur costs. |
