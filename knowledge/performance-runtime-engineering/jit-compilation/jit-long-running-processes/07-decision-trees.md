# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT for Long-Running Processes
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | JIT strategy for long-running workers | Performance | Configure |
| 2 | Pre-warming strategy for JIT | Performance | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: JIT Strategy for Long-Running Workers (Octane/Swoole/FrankenPHP)

---

## Decision Context

In persistent-worker architectures, JIT compilation cost is amortized over thousands of requests. This makes JIT more valuable but requires fragmentation management.

---

## Decision Criteria

* **performance** — compilation amortization makes JIT more attractive than FPM
* **architectural** — buffer fragmentation accumulates over process lifetime
* **maintainability** — pre-warming and fragmentation monitoring needed

---

## Decision Tree

What runtime is being used?
↓
**Octane/RoadRunner** → JIT buffer persists per worker; enable with Tracing JIT for less fragmentation
**FrankenPHP** → JIT buffer shared across threads; Tracing JIT preferred (fragmentation affects all threads)
**PHP-FPM** → JIT benefit lower due to worker recycling; still enable but tune less aggressively

---

Is the process expected to run 24h+ without restart?
↓
**YES** → Use Tracing JIT (1254) — 40-50% less fragmentation than Function JIT
**NO (< 8h)** → Either mode; fragmentation won't accumulate significantly

---

Has pre-warming been configured?
↓
**NO** → Configure warm-up requests after worker start to trigger JIT compilation
**YES** → Monitor buffer fragmentation over process lifetime

---

What is the worker recycling interval?
↓
**5000-10000 requests** → JIT benefits fully amortized; optimal
**< 1000 requests** → JIT benefit reduced; lower thresholds to accelerate warm-up
**Not recycling** → Monitor fragmentation; consider setting max_requests to prevent unbounded growth

---

## Rationale

JIT benefit amplifies in long-running processes because compilation cost is paid once per function per worker lifetime. Tracing JIT is preferred due to 40-50% less fragmentation. Pre-warming reduces cold-start latency variance.

---

## Recommended Default

**Default:** Tracing JIT (1254) with 256MB buffer, pre-warming configured, worker recycling at 5000-10000 requests.
**Reason:** Balances JIT benefit with fragmentation management in long-running processes.

---

## Risks Of Wrong Choice

* Function JIT in 24h+ process: 15-30% capacity loss from fragmentation
* No pre-warming: first 100+ requests run un-optimized
* Frequent recycling (<1000): JIT never reaches steady state

---

## Related Rules

* Use Tracing JIT for Long-Running Processes
* Pre-warm JIT After Worker Start
* Monitor Buffer Fragmentation Over Process Lifetime

---

## Related Skills

* JIT for Long-Running Processes
