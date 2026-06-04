# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Laravel Pulse
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Pulse vs dedicated APM? | Scale, budget, retention needs | Pulse for most; add APM at scale |
| 2 | Which built-in cards to enable? | Monitoring priorities, performance | Enable all; disable irrelevant cards |

---

# Architecture-Level Decision Trees

---

## Decision 1: Pulse vs Dedicated APM?

---

## Decision Context

Pulse provides real-time monitoring built into Laravel. For high-traffic apps or long retention needs, dedicated APM (Nightwatch, DataDog, New Relic) may be needed.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the application high-traffic (> 1000 req/s)?
↓
YES → Pulse may struggle with storage; add dedicated APM in parallel
NO → ↓
Do you need historical analysis beyond 24 hours?
↓
YES → Pulse + Nightwatch or external APM for historical
NO → **Pulse is sufficient** — real-time dashboard covers monitoring needs
Regardless:
- Secure `/pulse` route with authentication
- Schedule `pulse:check` every minute
- Configure retention: 1 hour raw, 1 week aggregated

---

## Recommended Default

**Default:** Pulse for real-time monitoring; add external APM for historical/retention needs
**Reason:** Pulse covers real-time at zero cost; APM adds historical and alerting

---

## Risks Of Wrong Choice

- **Pulse only at scale:** Storage growth for high-traffic; no long-term trend analysis
- **No Pulse:** Missing free, built-in real-time monitoring; over-relying on paid APM

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Which Built-in Cards to Enable?

---

## Decision Context

Pulse has 8+ built-in cards. All are enabled by default but some add overhead. Selection depends on monitoring priorities.

---

## Decision Criteria

* performance

---

## Decision Tree

What is the primary monitoring need?
↓
**Performance** → Enable: Servers, Application, Slow Queries, Slow Jobs
**Operations** → Enable: Queues, Exceptions, Cache, HTTP Clients
**All of the above** → Enable all built-in cards; add custom cards for business metrics
Regardless:
- Disable cards that show no useful data (e.g., HTTP Clients if no outbound calls)
- Order cards by priority in `config/pulse.php`
- Start with all enabled; remove if dashboard is cluttered

---

## Recommended Default

**Default:** Enable all built-in cards; add custom cards only for business-critical metrics
**Reason:** Built-in cards have minimal overhead; disable only if they add no value

---

## Risks Of Wrong Choice

- **Too many cards:** Dashboard clutter; harder to find important metrics
- **Too few cards:** Missing critical signals (queue backlogs, slow queries)

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

