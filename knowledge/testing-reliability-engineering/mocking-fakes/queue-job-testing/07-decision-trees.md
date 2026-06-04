# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Queue/Job Testing

---

### Tree 1: Dispatch vs Execution — Which Test to Write

```mermaid
flowchart TD
    A[Write job test] --> B{What aspect of the<br>job to verify?}
    B -->|Job was queued correctly| C[Write dispatch test]
    B -->|Job runs correctly| D[Write execution test]
    B -->|Both — recommended| E[Write both dispatch and execution tests]
    C --> F[Queue::fake + assertPushed with data callback]
    D --> G[new Job($data) + $job->handle() + assert database/side effects]
    E --> H[Two separate tests: dispatch + execution]
    F --> I{Does routing<br>matter?}
    I -->|Yes| J[Also assertPushedOn('queue-name')]
    I -->|No| K[assertPushed is sufficient]
    G --> L{External services<br>called?}
    L -->|Yes| M[Fake them: Http::fake, Mail::fake, etc.]
    L -->|No| N[Execute directly]
```

**Key decision points:**
- **Dispatch vs execution**: Both are needed. Dispatch tests verify the job is queued with correct data. Execution tests verify the job's `handle()` logic.
- **Queue routing**: Add `assertPushedOn()` when the job targets a specific queue.
- **External fakes**: Always fake external services in execution tests.

---

### Tree 2: How to Test Job Failure Handling

```mermaid
flowchart TD
    A[Test job failure path] --> B{Does the job have<br>a failed() method?}
    B -->|Yes| C[Write failure test]
    B -->|No| D{Should it have one?}
    D -->|Yes — critical job| E[Add failed() method + write test]
    D -->|No — trivial job| F[Skip — no cleanup needed]
    C --> G[Call $job->failed(new Exception(...))]
    G --> H[Assert cleanup: database state, notifications, logging]
    H --> I{Job has retry<br>logic?}
    I -->|Yes| J[Also test retryUntil and maxAttempts behavior]
    I -->|No| K[Failure test is complete]
    J --> L[Assert job is released back to queue or marked as failed]
```

**Key decision points:**
- **Critical vs trivial**: Critical jobs (payments, orders) need `failed()` testing. Trivial jobs may skip.
- **Retry behavior**: Jobs with `retryUntil()` or `$tries` need additional assertions on retry timing and max attempts.

---

### Tree 3: Serialization Testing — Is It Needed?

```mermaid
flowchart TD
    A[Decide serialization testing] --> B{Is the job using<br>sync driver?}
    B -->|Yes — sync only| C[Skip serialization test — never serialized]
    B -->|No — async queue| D[Write serialization test]
    D --> E[serialize($job) + unserialize($serialized)]
    E --> F{Serialization<br>succeeds?}
    F -->|Yes| G[Assert deserialized job has same data]
    F -->|No| H{What caused the<br>failure?}
    H -->|Closure property| I[Replace closure with serializable callback class]
    H -->|Live connection/resource| J[Recreate connection in handle() — don't store in property]
    H -->|Non-serializable model| K[Store only the ID, not the whole model]
    G --> L[Test passes — job will survive queue serialization]
```

**Key decision points:**
- **Sync vs async**: Only jobs dispatched to async queues (Redis, SQS, DB) need serialization tests.
- **Common serialization failures**: Closures, resources, and full Eloquent models with loaded relations cause serialization errors.

---

### Tree 4: Queue::fake vs Bus::fake — Which to Use

```mermaid
flowchart TD
    A[Choose fake for dispatch testing] --> B{How is the job<br>dispatched?}
    B -->|dispatch(new Job)| C[Use Queue::fake]
    B -->|Bus::dispatch(new Command)| D[Use Bus::fake]
    B -->|dispatchIf / dispatchUnless| E[Use Queue::fake — conditional dispatch]
    B -->|Bus::batch / Bus::chain| F[Use Bus::fake — batch/chain assertions]
    C --> G[Queue::assertPushed, assertPushedOn, assertPushedCount]
    D --> H[Bus::assertDispatched, assertBatched, assertChained]
    E --> I[Test both conditions: dispatchIf(true) should push, dispatchIf(false) should not]
    F --> J[Bus::assertBatched for batches; Bus::assertChained for chains]
```

**Key decision points:**
- **Queue vs Bus**: `Queue::fake()` for jobs dispatched with `dispatch()`. `Bus::fake()` for command bus dispatches and batch/chain assertions.
- **Conditional dispatch**: Test both the truthy and falsy conditions of `dispatchIf`/`dispatchUnless`.
