# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Benchmarking vs Load Testing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Benchmark vs load testing approach | Testing | Measure |
| 2 | Open-loop vs closed-loop model | Methodology | Design |
| 3 | What to measure and report | Measurement | Evaluate |

---

# Architecture-Level Decision Trees

---

## Decision: Benchmark vs Load Testing

---

## Decision Context

Choosing between benchmarking (maximum throughput measurement) and load testing (realistic traffic simulation).

---

## Decision Criteria

* **performance** — benchmarking tells ceiling; load testing tells behavior under ceiling
* **architectural** — each requires different tooling and setup
* **maintainability** — load tests require more setup and maintenance

---

## Decision Tree

What is the goal of the test?
↓
**A/B comparison (PHP version, config, hardware)** → Benchmark (wrk2, ab) — quick, focused, repeatable
**Capacity planning ceiling** → Benchmark — measures max RPS
**Pre-release validation** → Load test (k6) — realistic user journeys
**SLA verification** → Load test — multi-stage, variable concurrency
**Regression detection** → Benchmark — automated, repeatable

---

Is the workload a single endpoint or multi-step user journey?
↓
**Single endpoint** → Benchmark (simpler, faster)
**Multi-step journey** → Load test (k6 script with think times)

---

Do you need tail latency (p95/p99) accuracy?
↓
**YES** → Use open-loop model (wrk2, constant-rate) to avoid coordinated omission
**NO** → Closed-loop (wrk, ab) is sufficient for max throughput

---

## Rationale

Benchmarking measures the ceiling under idealized conditions. Load testing simulates realistic conditions. Use benchmarking for quick comparisons and capacity ceiling estimation. Use load testing for production readiness validation.

---

## Recommended Default

**Default:** Use wrk2 (open-loop benchmark) for A/B comparisons; use k6 (load test) for pre-release validation.
**Reason:** wrk2 avoids coordinated omission bias; k6 supports realistic user journeys.

---

## Risks Of Wrong Choice

* Benchmarking alone for capacity planning: overestimates capacity by ignoring realistic conditions
* Load testing for quick A/B: too much setup, too slow
* Hello World endpoints: results 10-100x better than production

---

## Related Rules

* Warm Up Before Measuring
* Report Both p50 and p95/p99 Latency, Not Just Average
* Benchmark with Realistic Workloads, Not Synthetic Endpoints

---

## Related Skills

* Design and Execute a Benchmark vs Load Test Campaign
