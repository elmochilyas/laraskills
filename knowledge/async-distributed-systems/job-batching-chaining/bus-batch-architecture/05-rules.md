# Rule Card: K008 — Bus::batch Architecture

---

## Rule 1

**Rule Name:** keep-batch-sizes-manageable

**Category:** Prefer

**Rule:** Prefer keeping batch sizes under 10,000 jobs.

**Reason:** Above this threshold, the `failed_job_ids` JSON column grows large and row lock contention increases significantly.

**Bad Example:**
```php
Bus::batch($hugeArrayOfJobs)->dispatch(); // 50,000 jobs — high lock contention
```

**Good Example:**
```php
// Split into multiple batches
foreach ($hugeArrayOfJobs->chunk(5000) as $chunk) {
    Bus::batch($chunk)->dispatch();
}
```

**Exceptions:** When job completion is very fast (< 100ms), higher counts may be acceptable.

**Consequences Of Violation:** Each job completion acquires a row lock — at high concurrency, workers serialize on a single DB row, dramatically slowing batch completion.

---

## Rule 2

**Rule Name:** use-allowfailures-for-partial-success

**Category:** Always

**Rule:** Always call `allowFailures()` when partial success is acceptable.

**Reason:** Without it, a single job failure cancels the entire batch — remaining jobs never run.

**Bad Example:**
```php
Bus::batch($jobs)->then(fn($b) => notify())->dispatch();
// First failure cancels all remaining work
```

**Good Example:**
```php
Bus::batch($jobs)->allowFailures()->then(fn($b) => notify())->dispatch();
// Remaining jobs continue despite individual failures
```

**Exceptions:** Financial reconciliation and atomic migrations must fail on any error.

**Consequences Of Violation:** One transient failure in a batch of 10,000 independent jobs cancels every job that hasn't started — massive wasted work.

---

## Rule 3

**Rule Name:** avoid-large-objects-in-callbacks

**Category:** Avoid

**Rule:** Avoid serializing large objects in batch callback closures.

**Reason:** Callbacks are serialized closures stored in the `options` column — large captured variables bloat storage and risk deserialization failure.

**Bad Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($request, $largeObject) {
    // Large objects serialized into options column
})->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId) {
    ProcessBatchCompletion::dispatch($orderId);
})->dispatch();
```

**Exceptions:** Callbacks capturing only small primitive values are fine.

**Consequences Of Violation:** The `options` column grows with each large serialized payload — deserialization time increases and failures from class-version mismatches become more likely.

---

## Rule 4

**Rule Name:** prune-old-batches-regularly

**Category:** Always

**Rule:** Always prune old batch records regularly.

**Reason:** The `job_batches` table grows unbounded — batch records are not automatically cleaned up.

**Bad Example:**
```php
// No scheduled cleanup — job_batches grows indefinitely
```

**Good Example:**
```php
// Schedule daily pruning
$schedule->command('queue:prune-batches --hours=48')->daily();
```

**Exceptions:** None — always prune batches. Even low-volume systems accumulate records over time.

**Consequences Of Violation:** The `job_batches` table grows indefinitely — queries slow down, storage costs increase, and `prune-batches` takes progressively longer to run.

---

## Rule 5

**Rule Name:** always-fresh-batch-for-current-state

**Category:** Always

**Rule:** Always call `$batch->fresh()` to get the current batch state.

**Reason:** The `Batch` object is immutable after creation — it reflects the state at read time, not current state.

**Bad Example:**
```php
$batch = Bus::batch($jobs)->dispatch();
sleep(5);
$batch->pendingJobs; // Stale — may be incorrect
```

**Good Example:**
```php
$batch = Bus::batch($jobs)->dispatch();
sleep(5);
$batch = $batch->fresh(); // Current state from DB
$batch->pendingJobs; // Accurate
```

**Exceptions:** Within callbacks (`then`, `catch`, `finally`), the passed `Batch` object is already fresh.

**Consequences Of Violation:** Code makes decisions based on stale pending/completed counts — progress bars show wrong percentages, conditional logic fires incorrectly.
