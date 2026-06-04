# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Pulse Cards Custom Development
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Built-in cards vs custom cards? | Coverage, business needs | Start with built-in; add custom for uncovered business metrics |

---

# Architecture-Level Decision Trees

---

## Decision 1: When to Build Custom Pulse Cards?

---

## Decision Context

Pulse has 8+ built-in cards covering common metrics. Custom cards add business-specific metrics but require development and maintenance.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do the built-in Pulse cards already cover the metrics you need?
↓
YES → Use built-in cards; no custom development needed
NO → ↓
Is the metric business-critical (revenue, registrations, orders)?
↓
NO → Consider if a dedicated dashboard is better than Pulse
YES → ↓
Can the metric be captured with simple `Pulse::record()` calls?
↓
NO → Pulse may not be the right tool; use dedicated dashboard
YES → **Build custom Pulse card** — Livewire component + recorder
Additional:
- Use unique metric name prefix to avoid collisions
- Handle empty state in card render
- Record aggregated data, not raw entries
- Keep card as simple widget (at-a-glance only)

---

## Recommended Default

**Default:** Start with built-in cards; add custom cards only for uncovered business-critical metrics
**Reason:** Custom cards add maintenance burden; built-in cards cover most technical metrics

---

## Risks Of Wrong Choice

- **Too many custom cards:** Dashboard clutter; maintenance burden; cards break on Pulse updates
- **Missing custom cards:** Business-critical metrics not visible on team dashboard

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

