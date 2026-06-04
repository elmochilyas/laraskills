# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** GC Telemetry and Root Buffer
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | How to monitor GC activity | Operations | Monitor |
| 2 | When to alert on GC metrics | Operations | Alert |

---

# Architecture-Level Decision Trees

---

## Decision: Monitoring GC Telemetry

---

## Decision Context

gc_status() returns root buffer length, runs, threshold, and collected counts. These metrics reveal whether GC is running too frequently (too many cycles) or not enough (high root count).

---

## Decision Criteria

* **performance** — high root count = pending collection work
* **architectural** — persistent runtimes accumulate roots across requests
* **operations** — telemetry enables proactive tuning

---

## Decision Tree

Is this a persistent runtime (Octane)?
↓
**YES** — Monitor gc_status() root buffer across requests. Growing buffer indicates accumulating cycles.
**NO (FPM)** — GC resets per request. Less need for continuous monitoring.

---

Is root buffer count consistently high (>5000 average)?
↓
**YES** — Investigate circular reference patterns. Consider WeakReference.
**NO** — GC is keeping up.

---

Is the GC running count increasing rapidly (>1 per 10 requests)?
↓
**YES** — Too frequent collection. Raise gc_threshold or fix circular references.
**NO** — GC frequency is normal.

---

## Recommended Default

**Default:** Log gc_status() at request end in non-production environments. Alert on root buffer >8000 in production.
**Reason:** Root buffer growth is leading indicator of collection pressure.

---

## Risks Of Wrong Choice

* No GC monitoring: collection cost invisible until CPU spikes
* Over-alerting: GC naturally cycles; short bursts are normal

---

## Related Skills

* GC Telemetry and Root Buffer
