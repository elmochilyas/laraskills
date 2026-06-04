# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** SLO Definition and Error Budgets
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | SLO target definition | Operations | Define |
| 2 | Error budget policy | Operations | Govern |

---

# Architecture-Level Decision Trees

---

## Decision: SLO Definition

---

## Decision Context

SLOs define acceptable performance: p95 latency < 500ms, 99.9% availability. Error budget = 100% - SLO. Budget consumed by slow responses and errors.

---

## Decision Criteria

* **performance** — SLO must be achievable
* **business** — SLO should reflect user experience
* **operations** — error budget guides release velocity

---

## Decision Tree

What is the current p95 latency?
↓
Set SLO at current + 20% improvement. Incremental targets are achievable.

---

What is user perception of slowness?
↓
**Instant (<100ms)** — p95 SLO = 100ms.
**Fast (<500ms)** — p95 SLO = 300ms.
**Acceptable (<2s)** — p95 SLO = 1s.

---

Is the team mature enough for error budgets?
↓
**YES** — Define error budget (e.g., 0.1% of total requests can exceed SLO). Slow releases exhaust budget.
**NO** — Fixed SLO without budget. Simpler governance.

---

What is the measurement window?
↓
**30 days** — Standard rolling window.
**7 days** — Tight. Quickly reflects regressions.

---

## Recommended Default

**Default:** p95 latency SLO < 500ms for web, < 200ms for API. 30-day rolling error budget.
**Reason:** Realistic for most Laravel apps; error budget enables data-driven release decisions.

---

## Risks Of Wrong Choice

* Too aggressive SLO: constant budget exhaustion, ignored
* Too loose SLO: doesn't catch regressions until too late

---

## Related Skills

* SLO Definition and Error Budgets
