# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Coordinated Omission and Loop Models
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Closed-loop vs open-loop benchmark | Performance | Plan |

---

# Architecture-Level Decision Trees

---

## Decision: Closed-Loop vs Open-Loop

---

## Decision Context

Closed-loop (synchronous): client waits for response before next request. Open-loop: client fires requests at constant rate regardless of responses. Coordinated omission: closed-loop hides tail latency because slow responses reduce request rate.

---

## Decision Criteria

* **performance** — open-loop reveals true tail latency
* **statistics** — closed-loop underestimates tail latency
* **operations** — open-loop simulates real-world load better

---

## Decision Tree

Is accurate tail latency (p99) important?
↓
**YES** — Open-loop (wrk2, k6 with constant arrival rate). Avoids coordinated omission.
**NO** — Closed-loop (wrk, ab). Accepts latency distortion.

---

Is the goal to find max throughput?
↓
**YES** — Open-loop. Find breaking point.
**NO** — Fixed-rate benchmark.

---

Is the workload simulating real users?
↓
**YES** — Open-loop. Real users don't wait for previous response before sending next request.
**NO** — Closed-loop may be simpler for relative comparisons.

---

## Recommended Default

**Default:** Open-loop (constant rate) for accurate tail latency. wrk2 or k6 with arrival rate executors.
**Reason:** Closed-loop underestimates p99 by 2-5x in many workloads.

---

## Risks Of Wrong Choice

* Closed-loop benchmark claims low p99: doesn't reflect real-world
* Open-loop at too high rate: overloads server, unrealistic results

---

## Related Skills

* Coordinated Omission and Loop Models
