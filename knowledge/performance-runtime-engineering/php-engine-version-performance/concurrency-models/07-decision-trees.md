# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Concurrency Models
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Which concurrency model to select | Architecture | Architect |
| 2 | Coroutine-based vs process-based for workload | Technology | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Concurrency Model Selection

---

## Decision Context

Choosing among process-based (FPM), thread-based (FrankenPHP), coroutine-based (Swoole), and goroutine-based (RoadRunner) concurrency models.

---

## Decision Criteria

* **performance** — context switch cost and memory per concurrent unit
* **architectural** — isolation guarantees vs efficiency
* **security** — process isolation prevents data leakage between requests
* **maintainability** — team expertise required for each model

---

## Decision Tree

What is the primary workload characteristic?
↓
**CPU-bound (computation-heavy)** → Process-based (FPM); coroutines don't parallelize CPU work
**I/O-bound (database/API calls)** → Evaluate sub-questions below

---

Is per-request process isolation a hard requirement?
↓
**YES** → Process-based (FPM) — complete isolation, no shared state
**NO** → Evaluate thread/coroutine/goroutine options

---

What is the average I/O wait time per operation?
↓
**<1ms** → Stay on FPM (process-based); async overhead > benefit
**1-50ms** → RoadRunner (goroutine) or FrankenPHP (thread)
**>50ms** → Swoole (coroutine) provides highest gain

---

What is the team's experience with async programming?
↓
**No async experience** → FPM or FrankenPHP (simpler mental model)
**Some async experience** → RoadRunner (familiar Go concepts)
**Experienced** → Swoole (most powerful, most complex)

---

Is maximum concurrency (>10K simultaneous) needed?
↓
**YES** → Coroutine (Swoole) or goroutine (RoadRunner)
**NO** → FPM or FrankenPHP sufficient

---

## Rationale

Each concurrency model trades isolation for efficiency differently. Process-based provides maximum isolation with highest overhead. Coroutines provide maximum efficiency with lowest isolation. The choice must match workload characteristics.

---

## Recommended Default

**Default:** Process-based (FPM) for most deployments; RoadRunner for high-throughput API workloads.
**Reason:** FPM is universally understood and provides complete isolation. RoadRunner offers the best balance for Laravel Octane.

---

## Risks Of Wrong Choice

* Coroutines for CPU-bound: no benefit, added complexity
* FPM for sub-50ms APIs: 3-15x slower than memory-resident alternatives
* Swoole for fast queries: slower than FPM due to coroutine overhead

---

## Related Rules

* Match Concurrency Model to Workload Type
* Do Not Use Coroutines for CPU-Bound Work
* Consider Memory Per Concurrent Unit When Sizing

---

## Related Skills

* Select the Appropriate Concurrency Model for a PHP Workload

---

---

## Decision: Coroutine-Based vs Process-Based for Given Workload

---

## Decision Context

Should a specific request path use coroutine-based concurrency (Swoole) or remain on process-based (FPM)?

---

## Decision Criteria

* **performance** — async benefit proportional to I/O wait time
* **architectural** — coroutines share memory within a thread
* **maintainability** — coroutine debugging is more complex

---

## Decision Tree

What is the total I/O wait time per request?
↓
**<20% of wall time** → Process-based (FPM) is sufficient; coroutines add complexity
**20-50%** → Coroutines provide moderate benefit (15-40% throughput gain)
**>50%** → Coroutines provide significant benefit (2-5x throughput gain)

---

Does the request use blocking PHP functions (PDO, cURL)?
↓
**YES** → Swoole auto-hooks these transparently; minimal code changes needed
**NO** → Coroutine benefit depends on manual async wrapping

---

## Rationale

Coroutines excel when I/O wait time is significant. For fast queries, coroutine overhead outweighs benefit. The decision depends on the specific I/O profile.

---

## Recommended Default

**Default:** Use process-based unless I/O wait exceeds 20% of wall time.
**Reason:** Process-based is simpler and universally compatible; coroutines are justified only when I/O wait is significant.

---

## Risks Of Wrong Choice

* Coroutines for fast I/O: 10% slower than FPM
* Process-based for slow I/O: poor resource utilization, pool exhaustion

---

## Related Rules

* Match Concurrency Model to Workload Type
* Do Not Use Coroutines for CPU-Bound Work

---

## Related Skills

* Select the Appropriate Concurrency Model for a PHP Workload
