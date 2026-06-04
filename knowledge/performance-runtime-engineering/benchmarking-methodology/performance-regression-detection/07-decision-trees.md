# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Performance Regression Detection
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Regression detection approach | Operations | CI/CD |

---

# Architecture-Level Decision Trees

---

## Decision: Regression Detection

---

## Decision Context

Performance regressions must be detected automatically in CI. Statistical methods (t-test, Mann-Whitney) handle noise. Simple thresholds work when noise is low.

---

## Decision Criteria

* **operations** — automated detection prevents shipping slowdowns
* **performance** — detection must balance sensitivity vs false positives
* **maintainability** — detection is only useful if it alerts on real regressions

---

## Decision Tree

Is the benchmark environment stable?
↓
**YES** — Fixed threshold (e.g., p95 > 5% slower). Simple and clear.
**NO** — Statistical comparison (e.g., 2-sample t-test, p < 0.05). Accounts for variance.

---

What metric to compare?
↓
**p50** — Low variance. Good for detection.
**p95/p99** — Higher variance. Needs more samples or statistical comparison.

---

Is the regression immediate or gradual?
↓
**Immediate (single commit)** — Compare to previous commit.
**Gradual** — Track trendline over 10+ commits. Alert on break of trend.

---

What action on detection?
↓
**Block CI** (strict) — Prevents merges. High false-positive cost.
**Notify only** (flexible) — Report but allow merge. Manual review.

---

## Recommended Default

**Default:** Fixed 5% threshold on p50 latency. Notify-only action. Compare to previous commit.
**Reason:** Simple, low false-positive, enables human review.

---

## Risks Of Wrong Choice

* Blocking CI: false positives block all development
* No detection at all: predictable performance degradation

---

## Related Skills

* Performance Regression Detection
