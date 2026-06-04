# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K005 — `SerializesModels` Trait and Model Restoration
- **Knowledge ID:** K005
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Serializing Models
  - Laravel Source — `Illuminate\Queue\SerializesModels`

---

# Overview

`SerializesModels` replaces Eloquent model and collection properties with lightweight `ModelIdentifier` objects at serialization time, then re-fetches them from the database at deserialization time. This prevents job payloads from containing stale, memory-heavy model copies. However, it introduces timing dependencies — the model must still exist when the job processes. The trait uses PHP's `__sleep`/`__wakeup` magic and has specific edge cases with pivot models, loaded relations, and soft-deleted records.

---

# Core Concepts

- **Serialization mechanism:** `__sleep` replaces Model properties with `ModelIdentifier` (class, id, connection). `__wakeup` calls `Model::find($id)` to restore.
- **Collections:** Serialized as arrays of `ModelIdentifier`, then re-hydrated via individual `find()` calls.
- **Loaded relations:** NOT restored after deserialization — only the model itself is re-fetched.
- **Pivot data:** NOT automatically restored. `BelongsToMany->pivot` attributes are lost.
- **Deleted models:** `find()` returns `null` on deleted records — the job proceeds with null.

---

# When To Use

- Jobs that need the latest model state at processing time
- Minimizing payload size when models are passed to jobs
- Standard job classes with `Dispatchable` trait (applied automatically)

---

# When NOT To Use

- Need exact dispatch-time model state — pass IDs and serialize manually
- Jobs with many model properties (each triggers a `find()` on wakeup)
- Jobs that need pivot attributes — manually serialize pivot data

---

# Best Practices

- **Guard against null models.** If a model is deleted between dispatch and processing, the restored property is `null`. Any method call on it crashes. *Why: `find()` returns null for deleted records — the job silently gets null instead of the model, causing confusing "call to a member function on null" errors.*
- **Avoid passing models with loaded relations.** Each relation triggers a cascading `find()` on deserialization. *Why: A model with 3 loaded relations deserializes into 4 `find()` queries — the job hasn't started `handle()` yet but already made 4 DB calls.*
- **For collections > 100 items, pass IDs instead.** Each collection item triggers one `find()` — 1000 items = 1000 queries on wakeup. *Why: Each `find()` is a separate DB query — large collections cause N+1 deserialization before `handle()` even starts.*
- **Don't modify restored models expecting the change to persist in the serialized payload.** The restored model is in-memory only — the queue payload is never updated. *Why: The payload is immutable — the serialized `ModelIdentifier` is fixed at dispatch. Calling `save()` on the restored model writes to the database, but retries will re-fetch the original (unchanged) model.*

---

# Performance Considerations

- Each model property = one `find()` query on deserialization. 10 models = 10 queries before `handle()`.
- Each collection item = one `find()` — large collections cause significant deserialization overhead.
- `find()` calls use the model's configured connection — adds connection resolution overhead.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Passing models with loaded relations | Convenience | Cascading find() queries on wakeup | Pass IDs only |
| Not guarding against null models | Assuming model still exists | `Call to a member function on null` | Check `if ($this->model)` before use |
| Expecting pivot data to persist | Pivot serialized on model | Pivot attributes lost on deserialization | Manually serialize pivot data |

---

# Examples

```php
class ProcessOrder implements ShouldQueue
{
    use SerializesModels;

    public function __construct(
        public Order $order, // serialized as ModelIdentifier
    ) {}

    public function handle(): void
    {
        if (! $this->order) {
            // Model was deleted — handle gracefully
            return;
        }
        // $this->order is a fresh DB fetch
    }
}
```

---

# Related Topics

- **K004 Job Serialization (K004)** — Envelope structure
- **K078 Closures as Queued Jobs (K078)** — Alternative serialization
