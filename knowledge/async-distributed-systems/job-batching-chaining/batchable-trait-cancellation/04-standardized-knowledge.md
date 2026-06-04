# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K010 — Batchable Trait and Cancellation
- **Knowledge ID:** K010
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching (Batchable)
  - Laravel Source — `Illuminate\Bus\Batchable`

---

# Overview

The `Batchable` trait provides a batched job with awareness of its parent batch, enabling cancellation checks, access to batch metadata, and self-cancellation. When a batch is cancelled, already-queued jobs can still run unless they check `$this->bail()` or use `SkipIfBatchCancelled` middleware. The trait bridges job execution context with batch state.

---

# Core Concepts

- **`batch()` method:** Returns the `Batch` object from the repository by `batchId`.
- **`cancelled()` method:** Checks if `cancelled_at` is non-null on the batch row.
- **`bail()` method:** Calls `delete()` on the job if batch is cancelled, returns true.
- **`SkipIfBatchCancelled` middleware:** Calls `bail()` before job executes.
- **`$batch->cancel()`:** Sets `cancelled_at` — does NOT delete queued jobs.

---

# When To Use

- Long-running batched jobs that should abort on cancellation (media processing, API calls)
- Jobs that need access to batch metadata (total count, progress, name)
- Self-cancellation patterns — a job cancels its batch on detecting unrecoverable state

---

# When NOT To Use

- Idempotent jobs that should run even if cancelled (logging, cleanup)
- Jobs outside a batch context — `batch()` returns null

---

# Best Practices

- **Use `SkipIfBatchCancelled` middleware over manual `bail()` checks.** Centralizes logic and reduces boilerplate. *Why: Applying the middleware via `middleware()` method ensures all instances of the job respect cancellation without duplicating code.*
- **Always `return` after `bail()`.** `bail()` returns true if cancelled, but the job continues unless you explicitly return. *Why: `bail()` only sets a flag and deletes the job — the `handle()` method continues executing unless you return early.*
- **Check cancellation mid-execution for very long jobs.** A job processing 10K items should periodically check `cancelled()`. *Why: Cancellation is cooperative — the batch may be cancelled while the job is running, and only the job can stop itself.*

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not returning after bail() | Calling `bail()` without `return` | Job continues executing despite cancellation | `if ($this->bail()) { return; }` |
| Assuming cancellation stops queued jobs | Cancellation only sets DB flag | Already-queued jobs still run | Apply `SkipIfBatchCancelled` middleware |
| batch() returns null | Batch pruned before job runs | Null method call error | Guard `$this->batch()?->cancelled()` |

---

# Examples

```php
class ProcessOrder implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        if ($this->bail()) { return; } // early abort if cancelled

        // Process the order...
        $this->batch()?->progress(50); // report progress
    }

    public function middleware(): array
    {
        return [new SkipIfBatchCancelled];
    }
}
```
