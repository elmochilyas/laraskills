# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** k6 Scripting, Thresholds, and Stages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | k6 adoption for CI benchmarking | Performance | Select |
| 2 | Threshold definition | Performance | Define |

---

# Architecture-Level Decision Trees

---

## Decision: k6 Adoption

---

## Decision Context

k6 provides scriptable load testing with thresholds, stages (ramp-up), and CI integration. Supports HTTP, gRPC, WebSocket, browser testing.

---

## Decision Criteria

* **operations** — single binary, OCI image, Grafana Cloud integration
* **performance** — precise metrics with custom reporting
* **maintainability** — JavaScript scripting enables complex scenarios

---

## Decision Tree

Is CI integration needed?
↓
**YES** — k6 is the best option. OCI image, Grafana Cloud, threshold-based pass/fail.
**NO** — wrk2 may be simpler for ad-hoc testing.

---

Are complex scenarios needed (multi-step, auth, WebSocket)?
↓
**YES** — k6 scripting excels. Custom HTTP headers, bodies, assertions.
**NO** — wrk2 is simpler for single-endpoint.

---

Are thresholds (SLO checks) needed?
↓
**YES** — k6 thresholds define pass/fail: `http_req_duration{ p(95) < 500 }`.
**NO** — Manual analysis is fine.

---

What type of load pattern?
↓
**Ramp-up** → k6 stages: `[{ target: 100, duration: '30s' }]`.
**Constant** → k6 or wrk2.
**Spike** → k6 stages with rapid target change.

---

## Recommended Default

**Default:** k6 for CI pipelines. wrk2 for ad-hoc HTTP benchmarks.
**Reason:** k6's threshold and stage features are essential for automated testing.

---

## Risks Of Wrong Choice

* No thresholds in CI: benchmark runs but doesn't fail on regression
* Complex script for simple test: unnecessary overhead

---

## Related Skills

* k6 Scripting, Thresholds, and Stages
