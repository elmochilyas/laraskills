# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Tideways Setup and Continuous Monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Tideways adoption for continuous profiling | Operations | Select |

---

# Architecture-Level Decision Trees

---

## Decision: Tideways Adoption

---

## Decision Context

Tideways provides always-on production profiling with low overhead (~1-3%). Includes APM-like dashboard with trend analysis. Free tier available.

---

## Decision Criteria

* **performance** — lowest overhead of mainstream profilers
* **operations** — always-on, no trigger needed
* **cost** — free tier for small deployments

---

## Decision Tree

Is continuous production profiling needed?
↓
**YES** — Tideways is the best choice. Always-on, low overhead.
**NO** — Trigger-based (Blackfire) or ad-hoc (SPX, Xdebug).

---

Is budget available?
↓
**YES** — Full Tideways subscription. All features.
**NO** — Free tier covers basic profiling.

---

Is PHP profiling the only need (no APM)?
↓
**YES** — Tideways profiling is excellent.
**NO** — Tideways also provides APM-like monitoring (error tracking, request tracing).

---

Is the server infrastructure simple?
↓
**YES** — Tideways extension + daemon. Easy setup.
**NO** — Tideways supports complex setups.

---

## Recommended Default

**Default:** Tideways for always-on production profiling. Best overhead-to-insight ratio.
**Reason:** Lowest overhead with continuous coverage catches issues Blackfire/SPX would miss.

---

## Risks Of Wrong Choice

* Always-on profiler without testing: rare compatibility issues
* Free tier limits: may outgrow on larger deployments

---

## Related Skills

* Tideways Setup and Continuous Monitoring
