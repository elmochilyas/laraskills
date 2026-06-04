# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Observability
**Knowledge Unit:** custom-pulse-recorders
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Pulse Recorder vs Built-in Horizon Metrics

---

# Architecture-Level Decision Trees

---

## Custom Pulse Recorder vs Built-in Horizon Metrics

---

### Decision Context

Whether to implement custom Pulse recorders for queue metrics or rely on Horizon's built-in metrics.

---

### Decision Criteria

* Metric granularity requirements
* Historical data needs
* Dashboard customization needs
* Horizon vs Pulse ecosystem preference

---

### Decision Tree

Need metrics beyond Horizon's built-in (throughput, wait time)?
YES → Implement custom Pulse recorders
NO → Need historical metric aggregation (daily, weekly trends)?
    YES → Pulse provides historical view — implement recorder if metric isn't built-in
NO → Need custom dashboard layout?
    YES → Pulse customizable dashboard — build custom recorder + card
NO → Standard queue monitoring sufficient?
    YES → Horizon metrics are sufficient — no custom recorders needed

---

### Rationale

Horizon provides real-time queue metrics on its dashboard. Pulse provides historical aggregation and customizable dashboards. Custom Pulse recorders fill gaps where Horizon metrics don't cover specific needs (per-job metrics, custom KPIs).

---

### Recommended Default

**Default:** Use Horizon for real-time monitoring; add Pulse recorders for historical aggregation of custom metrics
**Reason:** Horizon gives real-time visibility. Pulse provides the historical view that Horizon lacks. Custom recorders fill specific gaps.

---

### Risks Of Wrong Choice

- Only Horizon: no historical trends, no capacity planning data
- Custom recorders without need: development overhead, no clear benefit
- No monitoring at all: queue issues go undetected until users report

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Configure Custom Pulse Recorders
- Monitor Queue Health and Performance
