# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Benchmark and Performance
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Expected performance gain from RoadRunner | Architecture | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Expected Performance Gain

---

## Decision Context

RoadRunner eliminates per-request bootstrap. Typical gain: 2-4x throughput over FPM. Gain depends on how much of request time is bootstrap vs actual work.

---

## Decision Criteria

* **performance** — throughput gain proportional to bootstrapping time
* **architectural** — more gain when app has heavy autoloading/service registration
* **operations** — gain must justify migration effort

---

## Decision Tree

What % of request time is bootstrap (profiled)?
↓
**<10%** → 1-1.5x gain. Low benefit. Stay on FPM.
**10-30%** → 2-3x gain. Migration worthwhile.
**>30%** → 3-5x gain. Strong candidate.

---

What is current throughput?
↓
**<50 req/s per worker** — Small absolute gain. Queue may be bottleneck instead.
**50-500 req/s** — Good candidate.
**>500 req/s** — Excellent candidate. Absolute gain is large.

---

Is the team prepared for state management changes?
↓
**YES** — Migration will be smooth.
**NO** — Start with Octane (abstraction layer) for gradual migration.

---

## Recommended Default

**Default:** Target 2-4x throughput gain. Measure bootstrap % before deciding.
**Reason:** Gain is directly proportional to bootstrap time; don't assume without profiling.

---

## Risks Of Wrong Choice

* Expecting 5x gain when bootstrap is <10%: disappointing result
* Migrating without profiling: may not address actual bottleneck

---

## Related Skills

* RoadRunner Benchmark and Performance
