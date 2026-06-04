# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Job Batching & Chaining
**Knowledge Unit:** K011 — Batch Callbacks
**Generated:** 2026-06-03

---

# Decision Inventory

* then()+catch() vs finally() for Post-Batch Processing
* Inline Callback vs Dispatch Job from Callback

---

# Architecture-Level Decision Trees

---

## then()+catch() vs finally() for Post-Batch Processing

---

### Decision Context

Whether to use separate `then()` and `catch()` callbacks or a single `finally()` callback for post-batch processing.

---

### Decision Criteria

* Need for success vs failure branching
* finally() bug awareness (batch-of-chains)
* Code clarity preference

---

### Decision Tree

Batch contains chains (batch-of-chains pattern)?
YES → Use then() + catch() — finally() has known bug (never fires on mid-chain failure)
NO → Need different logic for success vs failure?
    YES → Use then() + catch() — explicit paths
NO → Same logic regardless of outcome?
    YES → Use finally() — single callback
NO → Default approach?
    YES → Use then() + catch() — more explicit

---

### Rationale

`then()` and `catch()` have clear semantics — success path and failure path. `finally()` has a subtle condition (`allJobsHaveRanExactlyOnce`) that may not fire as expected, especially in batch-of-chains patterns. Use `then()` + `catch()` for reliability.

---

### Recommended Default

**Default:** Use `then()` + `catch()` for explicit success/failure paths; avoid `finally()` for batch-of-chains
**Reason:** Clearer semantics and avoids the finally() bug in batch-of-chains patterns.

---

### Risks Of Wrong Choice

- finally() in batch-of-chains: never fires on mid-chain failure — cleanup skipped
- then() without catch(): silent failure, no error notification
- catch() without allowFailures(): batch cancels on first failure, catch fires, remaining jobs skipped

---

### Related Rules

- use-then-plus-catch-over-finally
- avoid-dollar-this-in-callbacks

---

### Related Skills

- Implement Job Batching and Chaining

---

## Inline Callback vs Dispatch Job from Callback

---

### Decision Context

Whether to put business logic directly in batch callbacks or dispatch a new job for complex work.

---

### Decision Criteria

* Callback complexity
* Callback execution time
* Error handling requirements
* Callback serialization constraints

---

### Decision Tree

Callback logic is complex (>5 lines) or slow (>100ms)?
YES → Dispatch a new job from the callback — keep callbacks thin
NO → Callback needs error handling with retries?
    YES → Dispatch a job — callback errors are not retried
NO → Simple action (log, cache clear, notification)?
    YES → Inline callback is acceptable
NO → Serialization concerns (captured variables)?
    YES → Dispatch a job — avoid closure serialization issues

---

### Rationale

Callbacks run in a worker and their completion is part of the batch finishing. Slow callbacks delay the batch's `finished_at` time. Callback exceptions are not retried. Complex logic should be delegated to a proper job class.

---

### Recommended Default

**Default:** Keep callbacks thin (<5 lines, simple operations); dispatch dedicated jobs for complex logic
**Reason:** Callbacks must be fast, serializable, and error-tolerant. Complex logic in a proper job gets retries, testing, and clean serialization.

---

### Risks Of Wrong Choice

- Complex inline callback: slow batch completion, no error retry
- $this in callbacks: serialization error or wrong context on deserialization
- Large captured variables in callback closures: payload bloat in options column

---

### Related Rules

- avoid-dollar-this-in-callbacks
- keep-callbacks-thin

---

### Related Skills

- Implement Job Batching and Chaining
