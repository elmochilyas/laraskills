# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K078 — Closures as Queued Jobs
- **Knowledge ID:** K078
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Dispatching Closures
  - Laravel Source — `Illuminate\Queue\CallQueuedClosure`

---

# Overview

Laravel allows dispatching closures directly: `dispatch(function () { ... })`. The closure is serialized using `Laravel\SerializableClosure` (formerly `Opis\Closure`), captured as a `CallQueuedClosure` job. This enables lightweight inline async tasks without creating a dedicated job class. However, closure serialization has constraints: `$this` cannot be used, captured variables must be serializable, and the `catch()` callback does not receive the original closure's `$this` context.

---

# Core Concepts

- **Closure serialization:** PHP closures cannot be natively serialized. Laravel analyzes the closure's AST, extracts scope and bound variables, rebuilds on deserialization.
- **`CallQueuedClosure`:** Internal job class wrapping the serialized closure.
- **Variable capture:** Variables in `use (...)` are serialized by value — not by reference.
- **`catch()` callbacks:** Supported on closures, but `$this` is not available.

---

# When To Use

- Simple one-off async tasks (cache warm, log cleanup, notification dispatch)
- Prototyping before refactoring to a class job
- Lightweight batch operations with closures

---

# When NOT To Use

- Complex logic with multiple dependencies — use class jobs
- Jobs needing `$this->release()`, `$this->delete()`, or `$this->batch()`
- Jobs requiring explicit `failed()` method for error handling
- High-throughput jobs — closure serialization is 5-10x slower than class jobs

---

# Best Practices

- **Use class jobs for anything complex or reusable.** Closure serialization is slower, more fragile, and untestable in isolation. *Why: Closure serialization analyzes AST and captures scope — a process 5-10x slower than class serialization. Class jobs are testable, have stable serialization, and support the full job API (release, delete, batch).*
- **Avoid `$this` in closure bodies.** `$this` may not serialize or may reference an unexpected context on deserialization. *Why: The serialized closure reconstructs a new Closure instance — `$this` refers to the serialized scope, which may be stale or broken.*
- **Import classes explicitly in the closure.** The closure code runs in the worker's global scope — missing `use` imports cause class-not-found errors. *Why: The serialized closure stores source code, not namespaced references. The worker may not have the same auto-imports as the dispatch context.*

---

# Performance Considerations

- Closure serialization: ~5-10x slower than class job serialization (AST analysis + source extraction).
- Closure payloads are generally larger — serialized scope must be included.
- Deserialization is CPU-intensive — closure reconstruction is heavier than `unserialize()`.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `$this` in closure body | Assuming scope is preserved | Serialization failure or wrong context | Capture needed values via `use ($val)` |
| Pass-by-reference in `use (&$var)` | Expecting reference behavior | Value at serialization time is used, not reference | Pass values directly |
| Not importing classes in closure | Missing `use` statements | Class not found error in worker | Add explicit `use` imports |

---

# Examples

```php
// Closure job — simple one-off task
dispatch(function () {
    Cache::forget('expensive_report');
})->catch(function (Throwable $e) {
    Log::warning('Cache clear failed', ['error' => $e->getMessage()]);
});
```

---

# Related Topics

- **K004 Job Serialization (K004)** — Serialization mechanics
- **K005 SerializesModels (K005)** — Contrast with class jobs
