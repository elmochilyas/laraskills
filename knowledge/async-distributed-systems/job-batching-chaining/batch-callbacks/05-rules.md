# Rule Card: K011 — Batch Callbacks

---

## Rule 1

**Rule Name:** no-dollar-this-in-callbacks

**Category:** Never

**Rule:** Never use `$this` inside batch callback closures.

**Reason:** Callbacks are serialized closures executed in a different context — `$this` serializes the entire object graph and may fail or produce unexpected behavior.

**Bad Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) {
    $this->notifyCompletion($batch); // $this serialized — fragile
})->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId) {
    ProcessBatchCompletion::dispatch($orderId);
})->dispatch();
```

**Exceptions:** None — always use `use ($specificVar)` with primitive values or simple DTOs.

**Consequences Of Violation:** Serialization failure at dispatch time (if `$this` can't serialize) or unexpected behavior at execution time (if `$this` deserializes incorrectly).

---

## Rule 2

**Rule Name:** keep-callbacks-thin

**Category:** Always

**Rule:** Always keep callbacks thin — dispatch a dedicated job for complex work.

**Reason:** Callbacks run in a worker and block the batch completion — slow callbacks delay the batch finish time.

**Bad Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) {
    // Complex logic: API calls, email sending, report generation
    $report = ReportGenerator::generate($batch->id);
    Mail::send(...);
    Cache::update(...);
})->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId) {
    PostBatchCompletion::dispatch($orderId); // Thin — dispatches and returns
})->dispatch();
```

**Exceptions:** Trivial callbacks (logging, setting a cache flag) are fine inline.

**Consequences Of Violation:** The batch stays in "running" state while the callback executes — monitoring shows batches as running longer than they should, and the next batch-dependent operation waits.

---

## Rule 3

**Rule Name:** prefer-then-catch-over-finally

**Category:** Prefer

**Rule:** Prefer `then()` + `catch()` over `finally()` for success/failure branching.

**Reason:** `finally()` may not fire in batch-of-chains patterns due to a known edge case where undispatched chain jobs prevent the condition from being met.

**Bad Example:**
```php
Bus::batch([$chainA, $chainB])
    ->finally(fn($b) => cleanup()) // May never fire
    ->dispatch();
```

**Good Example:**
```php
Bus::batch([$chainA, $chainB])
    ->then(fn($b) => success())
    ->catch(fn($b, $e) => failure())
    ->dispatch();
```

**Exceptions:** Simple flat batches (no chains inside) can safely use `finally()`.

**Consequences Of Violation:** `finally()` silently never fires — post-batch cleanup (cache invalidation, status updates) never happens, and no one is alerted.

---

## Rule 4

**Rule Name:** dont-rely-on-finally-for-chains

**Category:** Never

**Rule:** Never rely on `finally()` always running in batch-of-chains patterns.

**Reason:** `finally()` requires `allJobsHaveRanExactlyOnce` — mid-chain failures leave undispatched jobs that were counted but never run, preventing `finally()` from firing.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->finally(fn($b) => Cache::forget('processing')) // Never fires on mid-chain failure
    ->dispatch();
```

**Good Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->then(fn($b) => Cache::put('status', 'done'))
    ->catch(fn($b, $e) => Cache::put('status', 'failed'))
    ->dispatch();
```

**Exceptions:** None — this is a known limitation of the batch-of-chains pattern.

**Consequences Of Violation:** Cache keys, locks, and status flags remain set forever — the application believes the batch is still running when it actually terminated hours ago.
