# Rule Card: K014 — Batch of Chains Pattern and `finally()` Edge Case

---

## Rule 1

**Rule Name:** use-then-catch-not-finally

**Category:** Always

**Rule:** Always use `then()` + `catch()` instead of `finally()` for batch-of-chains.

**Reason:** `finally()` has the abandoned-jobs bug — it never fires if mid-chain failure leaves jobs undispatched.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->finally(fn($b) => cleanup()) // NEVER FIRES on mid-chain failure
    ->dispatch();
```

**Good Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->then(fn($b) => success())
    ->catch(fn($b, $e) => Log::warning('Chain had failures'))
    ->dispatch();
```

**Exceptions:** Flat batches (no chains inside) can safely use `finally()`.

**Consequences Of Violation:** Post-batch cleanup never runs — cache flags stay set, locks remain held, and the application believes the batch is still running forever.

---

## Rule 2

**Rule Name:** implement-stuck-batch-watchdog

**Category:** Always

**Rule:** Always implement a watchdog for stuck batches.

**Reason:** Stuck batches from mid-chain failures accumulate in `job_batches` with no automatic cleanup.

**Bad Example:**
```php
// No watchdog — stuck batches accumulate indefinitely
```

**Good Example:**
```php
// Scheduled watchdog
$schedule->call(function () {
    DB::table('job_batches')
        ->whereNull('finished_at')
        ->where('created_at', '<', now()->subHours(2))
        ->update(['cancelled_at' => now(), 'finished_at' => now()]);
})->hourly();
```

**Exceptions:** None — always monitor for stuck batches in production.

**Consequences Of Violation:** Stuck batches accumulate silently — the `job_batches` table grows with orphaned records, and downstream operations waiting for batch completion never proceed.

---

## Rule 3

**Rule Name:** prefer-separate-batches-over-chains

**Category:** Prefer

**Rule:** Prefer separate batches per chain instead of batch-of-chains.

**Reason:** Each batch tracks its own chain independently — no shared `finally()` issue, no cross-chain interference.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])->finally(fn($b) => cleanup())->dispatch();
```

**Good Example:**
```php
$batchA = Bus::batch([$a1, $a2])->then(fn() => cleanupA())->dispatch();
$batchB = Bus::batch([$b1, $b2])->then(fn() => cleanupB())->dispatch();
```

**Exceptions:** When all chains must complete before a single post-processing action runs, batch-of-chains with `then()` may be appropriate.

**Consequences Of Violation:** Complex and unreliable callback behavior — separate batches are simpler to reason about, test, and monitor.

---

## Rule 4

**Rule Name:** limit-chain-length-in-batches

**Category:** Prefer

**Rule:** Prefer limiting chain length within a batch to 2-3 jobs.

**Reason:** Shorter chains reduce the probability of mid-chain failure, which is the root cause of the `finally()` bug.

**Bad Example:**
```php
Bus::batch([[$a, $b, $c, $d, $e], [$f, $g, $h, $i, $j]])->dispatch();
// Long chains — high mid-chain failure probability
```

**Good Example:**
```php
Bus::batch([[$a, $b], [$c, $d]])->dispatch();
// Short chains — lower mid-chain failure probability
```

**Exceptions:** When chain jobs are fast and deterministic (no external I/O), longer chains are safer.

**Consequences Of Violation:** As chain length increases, the probability of at least one chain experiencing a mid-chain failure approaches certainty — the `finally()` bug becomes a production problem.
