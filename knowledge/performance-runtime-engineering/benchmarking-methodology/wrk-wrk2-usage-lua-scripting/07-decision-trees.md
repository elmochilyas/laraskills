# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** wrk/wrk2 Usage and Lua Scripting
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | wrk vs wrk2 for benchmarking | Performance | Select |
| 2 | Lua scripting for custom scenarios | Performance | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: wrk vs wrk2

---

## Decision Context

wrk: open-loop, coordinated omission. wrk2: constant rate, coordinated omission protection. For accurate tail latency, wrk2 is preferred.

---

## Decision Criteria

* **performance** — coordinated omission distorts tail latency
* **operations** — wrk2 is wrk fork; similar usage
* **statistics** — wrk2 provides accurate latency distribution

---

## Decision Tree

Is tail latency (p99) accuracy important?
↓
**YES** — wrk2. Constant rate prevents coordinated omission.
**NO** — wrk. Simpler.

---

Is Lua scripting needed for custom requests?
↓
**YES** — Both support Lua. wrk2 preferred for accurate metrics.
**NO** — Default GET/POST.

---

What is the target throughput?
↓
**Know it** → wrk2 (specify rate with -R).
**Don't know** → wrk first to find max throughput, then wrk2 at that rate.

---

## Recommended Default

**Default:** wrk2 with -R at target throughput. 60s duration, 10s warmup.
**Reason:** Accurate tail latency measurement.

---

## Risks Of Wrong Choice

* wrk without coordinated omission protection: p99 looks better than reality
* Wrong rate in wrk2: under/over loading target

---

## Related Skills

* wrk/wrk2 Usage and Lua Scripting
