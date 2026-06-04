# Rule Card: K010 — Batchable Trait and Cancellation

---

## Rule 1

**Rule Name:** use-skipifbatchcancelled-middleware

**Category:** Prefer

**Rule:** Prefer `SkipIfBatchCancelled` middleware over manual `bail()` checks.

**Reason:** Middleware centralizes the cancellation check logic and reduces boilerplate across all jobs.

**Bad Example:**
```php
public function handle(): void
{
    if ($this->bail()) { return; }
    if ($this->bail()) { return; } // Duplicated logic
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [new SkipIfBatchCancelled];
}
// No manual bail() checks in handle()
```

**Exceptions:** When cancellation needs to be checked mid-execution (not just at start), manual `cancelled()` checks are still needed.

**Consequences Of Violation:** Every batched job class must remember to add `bail()` checks — missed checks mean cancelled batches continue processing work.

---

## Rule 2

**Rule Name:** always-return-after-bail

**Category:** Always

**Rule:** Always `return` immediately after calling `$this->bail()`.

**Reason:** `bail()` only sets a flag and deletes the job from the queue — the `handle()` method continues executing unless you return.

**Bad Example:**
```php
public function handle(): void
{
    $this->bail(); // Returns true if cancelled
    $this->processExpensiveOperation(); // Still runs even if batched cancelled!
}
```

**Good Example:**
```php
public function handle(): void
{
    if ($this->bail()) { return; } // Early return on cancellation
    $this->processExpensiveOperation();
}
```

**Exceptions:** When using `SkipIfBatchCancelled` middleware, the check happens before `handle()` — no manual return needed.

**Consequences Of Violation:** The entire job runs despite cancellation — expensive API calls, database writes, and processing time are wasted.

---

## Rule 3

**Rule Name:** check-cancellation-mid-execution

**Category:** Always

**Rule:** Always check cancellation mid-execution for very long batch jobs.

**Reason:** Cancellation is cooperative — only the job itself can stop mid-execution. A job processing 10K items should periodically check `cancelled()`.

**Bad Example:**
```php
public function handle(): void
{
    foreach ($this->items as $item) {
        $item->process(); // No cancellation check — runs all 10K even if cancelled
    }
}
```

**Good Example:**
```php
public function handle(): void
{
    foreach ($this->items as $i => $item) {
        if ($i % 100 === 0 && $this->batch()->cancelled()) {
            return; // Stop processing if batch cancelled
        }
        $item->process();
    }
}
```

**Exceptions:** Fast jobs (< 1 second total execution) don't need mid-execution checks.

**Consequences Of Violation:** A user cancels a batch but the already-started job continues processing for minutes — resources wasted on work the user intentionally aborted.

---

## Rule 4

**Rule Name:** no-auto-stop-on-cancellation

**Category:** Never

**Rule:** Never assume cancellation stops already-queued jobs.

**Reason:** `$batch->cancel()` only sets `cancelled_at` in the database — it does not delete queued job payloads from Redis or SQS.

**Bad Example:**
```php
$batch->cancel();
// Assumes no more jobs will run — but already-queued jobs are still in Redis
```

**Good Example:**
```php
// Apply SkipIfBatchCancelled to handle this
public function middleware(): array
{
    return [new SkipIfBatchCancelled]; // Checks cancelled_at before execution
}
```

**Exceptions:** None — always handle cancellation check at the job level.

**Consequences Of Violation:** Jobs that were queued before cancellation still execute — they consume worker time and produce side effects the user intended to stop.
