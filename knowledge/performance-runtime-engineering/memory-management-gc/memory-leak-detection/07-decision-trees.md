# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Memory Leak Detection
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Detecting and diagnosing memory leaks | Debug | Detect |

---

# Architecture-Level Decision Trees

---

## Decision: Diagnosing Memory Leaks

---

## Decision Context

Memory leaks in PHP are usually from growing arrays (unbounded collections), circular references (not collected by refcounting), or retained references in closures/callbacks.

---

## Decision Criteria

* **performance** — leaks cause OOM
* **architectural** — persistent runtimes expose leaks that FPM hides
* **maintainability** — leak detection requires systematic approach

---

## Decision Tree

Is memory growing unbounded over time?
↓
**YES** — Likely a leak. Start diagnosis.
**NO** — Normal behavior.

---

Is this FPM or persistent runtime?
↓
**FPM** — Run single request in isolation with memory_get_peak_usage(true). Compare start vs end. If delta grows with repeated same request, there's a per-request leak.
**Persistent** — Monitor RSS over time. Steady growth confirms leak.

---

Can the growth be linked to specific endpoints or operations?
↓
**YES** — Profile those endpoints with memory_get_usage() at request start/end.
**NO** — Add memory logging to all requests and correlate with growth periods.

---

Use memory_get_usage(true) vs memory_get_usage(false)?
↓
**Real (false)** — Tracks application allocs. Good for finding specific allocations.
**Real+emalloc (true)** — Shows actual system memory. Better for detecting fragmentation.

---

## Recommended Default

**Default:** Use memory_get_peak_usage(true) at request end. Log endpoints with >20MB peak.
**Reason:** Identifies candidates for memory optimization.

---

## Risks Of Wrong Choice

* Using only memory_get_usage(false): misses fragmentation
* No logging at all: leaks invisible until OOM

---

## Related Skills

* Memory Leak Detection
