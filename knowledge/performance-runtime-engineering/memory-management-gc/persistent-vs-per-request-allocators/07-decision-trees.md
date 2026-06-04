# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Persistent vs Per-Request Allocators
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Shared-nothing vs persistent memory runtime | Architecture | Select |
| 2 | State management strategy for persistent runtimes | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Shared-Nothing vs Persistent Memory

---

## Decision Context

PHP-FPM uses per-request allocation (shared-nothing). Octane/Swoole/FrankenPHP keep memory across requests. Each has tradeoffs in complexity and performance.

---

## Decision Criteria

* **performance** — persistent memory avoids repeated bootstrap (30-60% throughput gain)
* **architectural** — persistent state requires explicit lifecycle management
* **maintainability** — shared-nothing is simpler; persistent needs leak prevention

---

## Decision Tree

How much memory does one request use (peak RSS)?
↓
**<10MB** — Persistent runtime memory savings are good. Total RSS manageable.
**10-50MB** — Monitor closely in persistent runtime. Leaks add up.
**>50MB** — FPM may be safer. Leak detection in persistent runtime is critical.

---

Can the application tolerate state corruption from a single bad request?
↓
**YES (FPM)** — Each request is isolated. One leak doesn't affect others.
**NO (persistent)** — Need process recycling (max_requests) to recover from corruption.

---

Is application bootstrap overhead >20% of request time?
↓
**YES** — Persistent runtime provides major benefit.
**NO** — Shared-nothing is simpler with minimal performance gap.

---

## Recommended Default

**Default:** PHP-FPM for most apps (simple, safe). Octane for high-throughput apps where profiling confirms bootstrap >20%.
**Reason:** Shared-nothing is simpler; persistent runtime only justifies when throughput gain is meaningful.

---

## Risks Of Wrong Choice

* Persistent runtime without leak detection: OOM over time
* FPM for high-throughput API: wasted 30-60% throughput potential

---

## Related Skills

* Persistent vs Per-Request Allocators
