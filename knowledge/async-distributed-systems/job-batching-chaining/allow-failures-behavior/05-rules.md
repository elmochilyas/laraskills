# Rule Card: K012 — `allowFailures()` Behavior and Callback Semantics

---

## Rule 1

**Rule Name:** always-pair-allowfailures-with-catch

**Category:** Always

**Rule:** Always pair `allowFailures()` with a `catch()` callback.

**Reason:** Without `catch()`, failures are silently absorbed — the batch completes but no code knows failures occurred.

**Bad Example:**
```php
Bus::batch($jobs)->allowFailures()->then(fn($b) => notify())->dispatch();
// Failures silently absorbed — no alerting
```

**Good Example:**
```php
Bus::batch($jobs)
    ->allowFailures()
    ->then(fn($b) => notify())
    ->catch(fn($b, $e) => Log::warning('Batch had failures', ['count' => $b->failedJobs]))
    ->dispatch();
```

**Exceptions:** When failures are acceptable without any action (e.g., best-effort analytics), the catch can be omitted.

**Consequences Of Violation:** A batch with 50% failure rate completes, `then()` fires (because not all jobs failed — wait, no, `then()` fires only if failed_jobs === 0), actually `catch()` fires... no wait, `then()`/`catch()` are mutually exclusive. Without `catch()`, neither fires properly for failure notification. Batch looks successful at a glance.

---

## Rule 2

**Rule Name:** no-allowfailures-for-chain-abort

**Category:** Never

**Rule:** Never assume `allowFailures()` prevents chain abort within a batch.

**Reason:** `allowFailures()` is batch-scoped — chain abort is chain-internal and unaffected by batch failure tolerance.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->allowFailures() // Doesn't fix chain abort on mid-chain failure
    ->dispatch();
```

**Good Example:**
```php
// Replace chains with individual flat jobs instead
Bus::batch([$a1, $a2, $b1, $b2])
    ->allowFailures()
    ->dispatch();
```

**Exceptions:** None — chain abort behavior is independent of `allowFailures()`.

**Consequences Of Violation:** A chain inside a batch aborts mid-execution — remaining chain jobs are never dispatched. `allowFailures()` doesn't help, and `finally()` may never fire.

---

## Rule 3

**Rule Name:** check-failedjobs-in-finally

**Category:** Always

**Rule:** Always check `$batch->failedJobs` in `finally()` for failure-aware decisions.

**Reason:** `then()` and `catch()` are mutually exclusive — `finally()` always runs and provides a unified place for state-aware cleanup.

**Bad Example:**
```php
Bus::batch($jobs)
    ->allowFailures()
    ->finally(fn($b) => cleanup()) // Same cleanup regardless of failures
    ->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)
    ->allowFailures()
    ->finally(function (Batch $batch) {
        if ($batch->failedJobs > 0) {
            // Partial failure path
            Log::warning('Batch completed with failures');
        }
        cleanup(); // Always runs
    })
    ->dispatch();
```

**Exceptions:** When cleanup is truly identical regardless of failure state, the check is unnecessary.

**Consequences Of Violation:** Successful and partially-failed batches get the same post-processing — downstream logic may incorrectly treat partial failures as full success.

---

## Rule 4

**Rule Name:** no-then-on-partial-failure

**Category:** Never

**Rule:** Never assume `then()` fires when some jobs have failed.

**Reason:** `then()` only fires when `failed_jobs === 0` — it is mutually exclusive with `catch()`.

**Bad Example:**
```php
Bus::batch($jobs)
    ->allowFailures()
    ->then(fn($b) => success()) // Expects this to run with some failures
    ->dispatch();
```

**Good Example:**
```php
Bus::batch($jobs)
    ->allowFailures()
    ->then(fn($b) => success())
    ->catch(fn($b, $e) => failure())
    ->dispatch();
```

**Exceptions:** None — this behavior is by design in Laravel's batch callback system.

**Consequences Of Violation:** Post-batch processing that assumes "batch completed" = "all succeeded" runs after partial failures — downstream systems see incomplete data as "processed successfully."
