# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K087 — Ignoring Missing Models
- **Knowledge ID:** K087
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: SerializesModels
  - Laravel Source — `Illuminate\Queue\ShouldDeleteMissing`

---

# Overview

When a job using `SerializesModels` processes a model deleted between dispatch and execution, deserialization sets the property to `null`. Subsequent method calls on null throw an error, causing the job to fail. `ShouldDeleteMissing` automatically deletes jobs whose models don't exist during deserialization, and `deleteWhenMissingModels` provides the same behavior via a property. This prevents jobs from exhausting retries on a permanent condition — the model is gone and will never come back.

---

# Core Concepts

- **`SerializesModels` behavior:** Models re-fetched via `Model::find($id)` — returns `null` for deleted records.
- **`ShouldDeleteMissing`:** Trait — auto-deletes the job if any serialized model returns `null` on deserialization.
- **`deleteWhenMissingModels`:** Property — when `true`, same behavior without importing the trait.
- **`ModelNotFoundException`:** Thrown by `findOrFail()` — jobs using it fail immediately on missing models.

---

# When To Use

- Jobs processing user-generated content (posts, comments, orders) — deletion is expected.
- Jobs where missing model should not trigger retries — it's a permanent condition.
- High-volume jobs where missing model failures would flood `failed_jobs`.

---

# When NOT To Use

- Missing model is always a bug and should alert immediately — let the job fail.
- Jobs with multiple models — one missing causes entire job to be deleted; partial is lost.

---

# Best Practices

- **Use `ShouldDeleteMissing` for jobs where model deletion is expected before processing.** The job can't do useful work without the model — retrying is futile. *Why: A job that references a deleted model will always fail with "call to a member function on null." Each retry consumes attempts, backoff delay, and worker time — all wasted because the condition is permanent.*
- **Log when `ShouldDeleteMissing` activates.** The trait silently deletes the job — no trace. *Why: Without logging, a spike in missing-model jobs goes undetected. It may indicate a race condition (jobs dispatched before model deletion completes) that needs fixing.*
- **Add null guards in `handle()` even with `ShouldDeleteMissing`.** The trait only protects deserialization — if the job re-fetches data in `handle()`, it's not covered. *Why: `ShouldDeleteMissing` checks at deserialization time. If the job re-queries the model in `handle()` (e.g., `Model::findOrFail($id)`), and it was deleted between deserialization and `handle()`, the trait doesn't help.*

---

# Performance Considerations

- `ShouldDeleteMissing` check is part of deserialization — no additional queries.
- Preventing retries saves worker time and queue capacity.
- No memory or storage overhead.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not using `ShouldDeleteMissing` for expected deletions | Overlooking trait | Job retries 3-10 times on missing model every time | Apply the trait |
| No logging when trait activates | Silent deletion | Missing model pattern goes undetected | Add logging in failed() |
| Assuming trait covers re-fetched data | Only protects deserialization | handle() queries that findOrFail still crash | Add null guards in handle() |

---

# Examples

```php
class ProcessPost implements ShouldQueue
{
    use ShouldDeleteMissing; // Auto-deletes if Post model is gone

    public function __construct(
        public Post $post,
    ) {}

    public function handle(): void
    {
        if (! $this->post) {
            return; // Extra safety — should never reach due to ShouldDeleteMissing
        }
        // Process post...
    }
}
```

---

# Related Topics

- **K005 SerializesModels (K005)** — The mechanism triggering this
- **K016 Failure Taxonomy (K016)** — Where missing models fit
