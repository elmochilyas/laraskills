# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Laravel Nightwatch
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Nightwatch vs Pulse for production monitoring? | Budget, retention needs | Pulse for free/self-hosted; Nightwatch for managed APM |

---

# Architecture-Level Decision Trees

---

## Decision 1: Nightwatch vs Pulse for Production Monitoring?

---

## Decision Context

Both tools monitor production Laravel applications. Pulse is free, self-hosted, real-time. Nightwatch is a paid SaaS with historical retention, alerting, and deployment correlation.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is there budget for a paid APM service?
↓
NO → **Pulse** — free, self-hosted, real-time dashboard
YES → ↓
Do you need:
- Historical performance data (7+ days)?
- Deployment-to-performance correlation?
- Proactive alerting on thresholds?
↓
YES to any → **Nightwatch** — purpose-built for these needs
NO → **Pulse** — built-in cards cover most real-time monitoring needs
Best practice: **Use both** — Pulse for live dashboard, Nightwatch for historical analysis

---

## Recommended Default

**Default:** Pulse for free/real-time; add Nightwatch when historical analysis is needed
**Reason:** Pulse covers real-time monitoring; Nightwatch adds historical and alerting value

---

## Risks Of Wrong Choice

- **Nightwatch only:** No live dashboard on own infrastructure; subscription cost
- **Pulse only (at scale):** No historical analysis; no proactive alerting; limited retention

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

