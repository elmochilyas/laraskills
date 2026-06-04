# Rule Card: K015 — Batch Deployment Hazard — Callback Serialization Across Deploys

---

## Rule 1

**Rule Name:** thin-callbacks-dispatch-jobs

**Category:** Always

**Rule:** Always use thin callbacks that only dispatch a dedicated job class.

**Reason:** The job class name string is stable across deploys — inline closure logic changes with every code update and breaks deserialization.

**Bad Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($request) {
    (new CompletionService())->process($request->all());
})->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId) {
    ProcessBatchCompletion::dispatch($orderId);
})->dispatch();
```

**Exceptions:** Development environments where batch callbacks don't need to survive deploys.

**Consequences Of Violation:** After the next deploy, in-flight batch callbacks fail to deserialize — post-batch processing silently never runs.

---

## Rule 2

**Rule Name:** no-complex-captures-in-callbacks

**Category:** Never

**Rule:** Never capture `$this` or framework objects in batch callback `use()` clauses.

**Reason:** Complex objects have large object graphs that serialize poorly and change unpredictably between versions.

**Bad Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($this, $request) {
    $this->service->process($request->input('data'));
})->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId, $type) {
    ProcessBatchCompletion::dispatch($orderId, $type);
})->dispatch();
```

**Exceptions:** None — always pass only primitive values (strings, ints, arrays, simple DTOs).

**Consequences Of Violation:** Callback serialization captures the entire `$this` object graph — if any referenced class changes between deploys, deserialization fails silently.

---

## Rule 3

**Rule Name:** drain-batches-before-critical-deploys

**Category:** Prefer

**Rule:** Prefer draining all in-flight batches before deploying critical changes.

**Reason:** Even thin callbacks can fail if the dispatched job class signatures change between versions.

**Bad Example:**
```php
// Deploy mid-batch — callback references old class structure
```

**Good Example:**
```php
// Wait for in-flight batches to complete
while (DB::table('job_batches')->whereNull('finished_at')->exists()) {
    sleep(5);
}
// Then deploy
```

**Exceptions:** Frequent deployments where waiting for batches would block the deploy pipeline.

**Consequences Of Violation:** In-flight callbacks reference classes that were renamed or had signature changes — deserialization fails, callbacks are lost.

---

## Rule 4

**Rule Name:** monitor-callback-failures-post-deploy

**Category:** Always

**Rule:** Always monitor `failed_jobs` for `BatchCallbackJob` failures after deploys.

**Reason:** Batch callback failures are silent — the only signal is a `failed_jobs` entry for a batch-callback job.

**Bad Example:**
```php
// No post-deploy monitoring — callback failures invisible
```

**Good Example:**
```php
// Alert on batch callback failures
DB::table('failed_jobs')
    ->where('payload', 'like', '%BatchCallbackJob%')
    ->where('failed_at', '>', now()->subMinutes(30))
    ->count();
```

**Exceptions:** None — always monitor after deploys.

**Consequences Of Violation:** Callbacks fail silently — post-batch cleanup, notifications, and status updates never happen, and no one knows.

---

## Rule 5

**Rule Name:** test-callback-serialization-in-ci

**Category:** Always

**Rule:** Always test callback serialization across deploys in CI.

**Reason:** The serialization library can change encoding between versions — catching failures in CI prevents production incidents.

**Bad Example:**
```php
// No serialization test — discover failure after deploy
```

**Good Example:**
```php
// Test: serialize and unserialize the callback
$serialized = serialize(fn() => ProcessCompletion::dispatch(1));
$unserialized = unserialize($serialized);
$this->assertInstanceOf(\Closure::class, $unserialized);
```

**Exceptions:** None — this is a low-effort test that prevents a high-impact production issue.

**Consequences Of Violation:** A Composer update of `laravel/serializable-closure` changes the serialization format — all in-flight callbacks fail to deserialize simultaneously.
