# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane with RoadRunner Server
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Running Octane with RoadRunner driver | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: Octane + RoadRunner

---

## Decision Context

Octane with RoadRunner uses RoadRunner's Go daemon to manage PHP workers via Goridge. Provides broadest package compatibility.

---

## Decision Criteria

* **performance** — 2-4x gain over FPM
* **operations** — requires RoadRunner binary + .rr.yaml
* **compatibility** — best for existing Laravel packages

---

## Decision Tree

Is package compatibility the primary concern?
↓
**YES** — RoadRunner is the safest Octane driver.
**NO** — Other drivers may offer simpler operations.

---

Is the deployment containerized?
↓
**YES** — Include RoadRunner binary and .rr.yaml in Docker image. Run RoadRunner as entrypoint.
**NO** — Install RoadRunner via composer + rr get-binary.

---

Is health check configuration needed?
↓
**YES** — RoadRunner has built-in HTTP health endpoint. Configure in .rr.yaml.
**NO** — Standard config.

---

What worker count?
↓
RoadRunner workers = separate processes. Count = CPU_cores × 2 for IO-bound.

---

## Recommended Default

**Default:** Octane + RoadRunner for production. Proven, best compatibility.
**Reason:** RoadRunner is the most mature Octane driver with largest community.

---

## Risks Of Wrong Choice

* Missing .rr.yaml for worker config: defaults may not fit
* Goridge port not secured: inter-process communication exposed

---

## Related Skills

* Octane with RoadRunner Server
