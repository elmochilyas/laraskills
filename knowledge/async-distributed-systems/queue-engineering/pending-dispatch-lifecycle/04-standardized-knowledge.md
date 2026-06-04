# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K007 — `PendingDispatch` Lifecycle
- **Knowledge ID:** K007
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Foundation\Bus\PendingDispatch`

---

# Overview

`PendingDispatch` is the fluent wrapper object returned by a job's `dispatch()` method. It holds the job instance and allows method chaining (`onQueue()`, `onConnection()`, `delay()`, `afterCommit()`) before the job is actually pushed to the queue. The critical behavior: dispatch happens in the **destructor** of `PendingDispatch` — not in the `dispatch()` call itself. This has implications for conditional dispatch, scope lifetime, and chaining order.

---

# Core Concepts

- **`PendingDispatch`:** Object returned by `dispatch()`. Holds the job and dispatch configuration.
- **Deferred dispatch:** The destructor calls `$bus->dispatchToQueue($this->job)` when the object goes out of scope.
- **Fluent chain:** `dispatch()->onQueue('high')->onConnection('sqs')` — each method returns `$this`.
- **Immediate dispatch:** `dispatchIf()` / `dispatchUnless()` bypass `PendingDispatch` and dispatch directly.
- **`afterCommit` integration:** If a transaction is active and `afterCommit` is true, the job registers a post-commit callback instead of dispatching now.

---

# When To Use

- **Standard `dispatch()`:** 95% of cases — fluent API works correctly.
- **`Bus::dispatchToQueue()`:** When you need to control exactly when the job gets queued, bypassing the destructor.
- **`dispatchIf()`/`dispatchUnless()`:** For conditional dispatch — immediate, no `PendingDispatch`.

---

# When NOT To Use

- Don't rely on destructor ordering — PHP destructor order is non-deterministic.
- Don't assign `dispatch()` to a variable without understanding scope — the job won't dispatch until the variable goes out of scope.

---

# Best Practices

- **Don't assign `dispatch()` to a variable unless you intend to delay dispatch.** `$pending = MyJob::dispatch()` keeps the `PendingDispatch` alive — the job doesn't dispatch until the destructor fires. *Why: The destructor fires when the variable goes out of scope. If you assign it at the top of a method and use it later, the job dispatches at method end, not at the `dispatch()` call.*
- **Use `dispatchIf()` / `dispatchUnless()` for conditional dispatch.** A conditional wrapping `dispatch()` still creates and destroys a `PendingDispatch`. *Why: `dispatchIf()` avoids the `PendingDispatch` overhead entirely and makes the conditional intent explicit.*
- **Handle exceptions inside the dispatch chain.** If a chained method (e.g., `onQueue()`) throws, the destructor never fires — the job is lost. *Why: An exception in the fluent chain prevents the `PendingDispatch` from being fully constructed. The destructor where dispatch happens never runs.*

---

# Performance Considerations

- `PendingDispatch` is a temporary object — microseconds of overhead.
- Destructor checks for active transaction — cheap.
- Multiple `PendingDispatch` objects in a loop: all destructors fire at end of iteration or scope.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assigning `dispatch()` and wondering why job didn't run | Destructor not yet called | Job dispatches later than expected | Don't assign result unless needed |
| Exception in chain prevents dispatch | Destructor never runs | Job silently lost | Validate inputs before chaining |
| Relying on destructor ordering | PHP non-deterministic GC | Jobs dispatch in unexpected order | Use `Bus::batch()` for ordering |

---

# Related Topics

- **K003 Queue Manager (K003)** — Where `dispatchToQueue` resolves
- **K064 afterCommit (K064)** — Transaction lifecycle interaction
