# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Tool Selection by Layer
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Benchmarking tool selection | Performance | Select |

---

# Architecture-Level Decision Trees

---

## Decision: Tool Selection

---

## Decision Context

Different tools for different layers: wrk/wrk2 (HTTP), k6 (scriptable), ab (basic), hey (Go). Selection depends on what you're measuring.

---

## Decision Criteria

* **performance** — tool must support required metrics
* **operations** — tool must be available in CI
* **maintainability** — scriptable tools support complex scenarios

---

## Decision Tree

What is being measured?
↓
**Simple HTTP endpoint** → wrk2 (constant rate, coordinated omission protection).
**Complex scenario (multi-step)** → k6 (scriptable with thresholds).
**Single URL, quick test** → hey or ab.

---

Is coordinated omission a concern?
↓
**YES** — wrk2. Constant rate avoids coordinated omission.
**NO** — wrk, k6, ab.

---

Is CI integration needed?
↓
**YES** — k6 (OCI container, Grafana Cloud) or wrk2 (binary).
**NO** — Any tool works.

---

Are custom metrics needed (time to first byte, custom timing)?
↓
**YES** — k6 with custom metrics.
**NO** — wrk2 standard metrics.

---

## Recommended Default

**Default:** wrk2 for HTTP benchmarks. k6 for complex scenarios and CI.
**Reason:** wrk2 protects against coordinated omission; k6 covers complex use cases.

---

## Risks Of Wrong Choice

* wrk (not wrk2): coordinated omission inflates throughput, hides tail latency
* ab: too basic for production-relevant benchmarks

---

## Related Skills

* Tool Selection by Layer
