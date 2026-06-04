# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Memory Layout and Fragmentation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | How to handle JIT buffer fragmentation | Performance | Tune |
| 2 | When to increase buffer vs switch JIT mode | Configuration | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: Handling JIT Buffer Fragmentation

---

## Decision Context

Fragmentation reduces effective buffer capacity by 15-30% over 24h. Choosing between switching JIT mode, increasing buffer size, or enabling compaction.

---

## Decision Criteria

* **performance** — fragmentation causes eviction of hot code
* **architectural** — Tracing JIT fragments less than Function JIT
* **maintainability** — monitoring needed to detect fragmentation pressure

---

## Decision Tree

Is the eviction rate near zero at steady state?
↓
**YES** → Fragmentation is not an issue; no action needed
**NO (evictions occurring)** → Fragmentation is reducing effective capacity

---

What JIT mode is currently configured?
↓
**Function JIT (1205)** → Switch to Tracing JIT (1254) — 40-50% less fragmentation
**Tracing JIT (1254)** → Fragmentation still an issue; increase buffer size

---

What is the buffer size?
↓
**< 128MB** → Increase to 128MB first; small buffers fragment faster
**128MB+** → Increase to 256MB or optimize fragmentation via JIT mode switch

---

What is the compaction frequency?
↓
**Frequent (multiple times per hour)** → Buffer is too small; increase size
**Infrequent (once per day or less)** → Fragmentation is well-managed by compaction

---

## Rationale

Fragmentation reduces effective capacity. The primary fix is switching from Function JIT to Tracing JIT (40-50% less fragmentation) or increasing buffer size. PHP 8.4+ compaction helps but doesn't eliminate the need for adequate buffer sizing.

---

## Recommended Default

**Default:** Monitor eviction rate and compaction frequency. Switch to Tracing JIT for long-running processes.
**Reason:** Tracing JIT fragments less, reducing fragmentation-driven eviction.

---

## Risks Of Wrong Choice

* Not monitoring evictions: unnoticed performance degradation over time
* Function JIT in 24h+ process: 15-30% capacity loss
* Relying only on compaction: pauses and doesn't prevent fragmentation root cause

---

## Related Rules

* Use Tracing JIT for Long-Running Processes
* Monitor Eviction Rate
* Increase Buffer If Compaction Is Frequent

---

## Related Skills

* JIT Memory Layout and Fragmentation
