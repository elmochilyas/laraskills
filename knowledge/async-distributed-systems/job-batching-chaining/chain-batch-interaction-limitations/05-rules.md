# Rule Card: K089 — Chain-Batch Interaction Limitations

---

## Rule 1

**Rule Name:** replace-batch-of-chains-with-separate

**Category:** Prefer

**Rule:** Prefer replacing batch-of-chains with separate per-chain batches.

**Reason:** Per-chain batches avoid the abandoned-jobs problem entirely — each batch tracks only the jobs that actually run.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])->dispatch();
// Abandoned jobs on mid-chain failure — batch state permanently skewed
```

**Good Example:**
```php
$batchA = Bus::batch([$a1, $a2])->finally(fn() => cleanupA())->dispatch();
$batchB = Bus::batch([$b1, $b2])->finally(fn() => cleanupB())->dispatch();
```

**Exceptions:** When atomic coordination across all chains is required, batch-of-chains with `then()` + `catch()` may be appropriate.

**Consequences Of Violation:** `total_jobs` never equals actual executions — batch monitoring shows incorrect progress, and `finally()` may never fire.

---

## Rule 2

**Rule Name:** check-inner-batch-state-explicitly

**Category:** Always

**Rule:** For chain-of-batches, always check inner batch state explicitly before the chain advances.

**Reason:** The outer chain only sees the batch job's success/failure status — it doesn't know about partial inner batch failures.

**Bad Example:**
```php
Bus::chain([Bus::batch([$a, $b]), $nextJob])->dispatch();
// If batch has partial failures, $nextJob still runs
```

**Good Example:**
```php
class ProcessBatchStep implements ShouldQueue
{
    public function handle(): void
    {
        $batch = Batch::find($this->batchId);
        if ($batch->failedJobs > 0) {
            $this->fail('Inner batch had failures');
            return;
        }
        // Proceed with next chain step
    }
}
```

**Exceptions:** When inner batch failures don't affect subsequent chain steps, explicit checks are unnecessary.

**Consequences Of Violation:** The chain advances even though the inner batch had partial failures — downstream jobs operate on incomplete data.

---

## Rule 3

**Rule Name:** prefer-flat-batches-for-short-sequences

**Category:** Prefer

**Rule:** Prefer flat batches over batch-of-chains for short sequences (2-3 jobs).

**Reason:** Flattening removes composition complexity — the batch tracks every job and callbacks work correctly.

**Bad Example:**
```php
Bus::batch([[$a1, $a2], [$b1, $b2]])->dispatch();
```

**Good Example:**
```php
Bus::batch([$a1, $a2, $b1, $b2])->dispatch();
// Set ordering constraints inside job code if needed
```

**Exceptions:** When ordering within each unit is strictly required and cannot be handled in job code.

**Consequences Of Violation:** All the limitations of batch-of-chains (abandoned jobs, `finally()` bug, skewed state) apply unnecessarily.

---

## Rule 4

**Rule Name:** watchdog-for-unfinished-batches

**Category:** Always

**Rule:** Always implement watchdog monitoring for unfinished batches.

**Reason:** Stuck batches from mid-chain failures are invisible in normal queue monitoring — only direct DB querying reveals them.

**Bad Example:**
```php
// No monitoring — stuck batches invisible
```

**Good Example:**
```php
$schedule->call(function () {
    $stuck = DB::table('job_batches')
        ->whereNull('finished_at')
        ->where('created_at', '<', now()->subHours(1))
        ->count();
    if ($stuck > 0) {
        Log::warning("$stuck stuck batches detected");
    }
})->everyFiveMinutes();
```

**Exceptions:** Small systems using only flat batches (no chains) have little risk of stuck batches.

**Consequences Of Violation:** Stuck batches silently accumulate — workers continue normally, but batch-dependent logic (callbacks, downstream operations) never fires.
