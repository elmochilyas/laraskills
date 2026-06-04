# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Concepts and Terminology
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to enable JIT for a given workload | Performance | Evaluate |
| 2 | Tracing vs Function JIT mode selection | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Whether to Enable JIT

---

## Decision Context

JIT provides 61-95% gain for CPU-bound workloads but 0-5% for I/O-bound typical web apps. The decision depends on workload CPU proportion.

---

## Decision Criteria

* **performance** — JIT benefit proportional to CPU-bound time
* **architectural** — requires OpCache foundation
* **maintainability** — set-and-forget after initial tuning

---

## Decision Tree

Is OpCache already enabled?
↓
**NO** → Enable OpCache first. JIT requires OpCache.
**YES** → Proceed to assess workload.

---

What is the CPU-bound proportion of request time?
↓
**<15%** → JIT benefit minimal (0-2%); enable anyway (harmless overhead)
**15-30%** → Moderate benefit (5-20%); enable and measure
**>30%** → Significant benefit (20-95%); enable and tune

---

Are there CPU-bound background jobs (cron, queues)?
↓
**YES** → Enable JIT universally; background jobs benefit significantly
**NO** → Enable JIT anyway (0-2% overhead on web traffic is acceptable)

---

Is memory severely constrained (<512MB available)?
↓
**YES** → Use Tracing JIT (1254) with 64MB buffer
**NO** → Use default (1254, 128MB)

---

## Rationale

JIT is harmless on I/O-bound paths (0-2% overhead) and beneficial for any CPU-bound code. Enable universally, then evaluate benefit. The 128MB buffer cost is negligible compared to potential gains.

---

## Recommended Default

**Default:** Enable JIT universally with opcache.jit=1254 and jit_buffer_size=128M.
**Reason:** Harmless overhead, significant gains for CPU-bound paths, and background job acceleration.

---

## Risks Of Wrong Choice

* Not enabling: missed optimization for CPU-bound paths and background jobs
* Enabling without OpCache: JIT has nothing to compile
* Too small buffer: compilation thrashing, no JIT benefit

---

## Related Rules

* Enable JIT Universally, Then Benchmark
* Configure OpCache Before JIT

---

## Related Skills

* Assess Whether JIT Native Code Compilation Benefits a Given Code Path

---

---

## Decision: Tracing vs Function JIT Mode

---

## Decision Context

Choosing between tracing JIT (1254) which compiles loop paths, and function JIT (1205) which compiles entire functions.

---

## Decision Criteria

* **performance** — each mode favors different workload patterns
* **architectural** — tracing produces less fragmentation
* **maintainability** — tracing is the safer default

---

## Decision Tree

What is the dominant code pattern?
↓
**Loop-heavy (templating, data processing, algorithms)** → Tracing JIT (1254)
**Function-call-heavy (ORM, domain logic, API controllers)** → Function JIT (1205)
**Mixed** → Tracing JIT (1254) as default

---

Is the process long-running (24h+)?
↓
**YES** → Tracing JIT (1254) — 40-50% less fragmentation
**NO** → Either mode; fragmentation is less of a concern

---

Is memory constrained?
↓
**YES** → Tracing JIT (1254) — produces more uniform segments, less fragmentation
**NO** → Either; test both and compare

---

## Rationale

Tracing JIT is the best general-purpose default. It produces less fragmentation and handles most workloads well. Function JIT only benefits function-call-heavy code with predictable call patterns.

---

## Recommended Default

**Default:** Tracing JIT (opcache.jit=1254).
**Reason:** Best general-purpose setting with less fragmentation and broader compatibility.

---

## Risks Of Wrong Choice

* Function JIT for loops: lower throughput than tracing
* Tracing JIT for function-heavy: suboptimal but still good
* Function JIT in 24h+ processes: excessive fragmentation

---

## Related Rules

* Use Tracing (1254) as Default
* Match JIT Mode to Workload Pattern

---

## Related Skills

* Assess Whether JIT Native Code Compilation Benefits a Given Code Path
