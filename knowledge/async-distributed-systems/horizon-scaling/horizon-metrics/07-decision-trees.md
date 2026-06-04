# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** horizon-metrics
**Generated:** 2026-06-03

---

# Decision Inventory

* Metric Collection Strategy for Queue Monitoring

---

# Architecture-Level Decision Trees

---

## Metric Collection Strategy for Queue Monitoring

---

### Decision Context

Which queue metrics to collect and how to use Horizon's built-in metrics.

---

### Decision Criteria

* Monitoring tool availability (Horizon vs Pulse vs third-party)
* Alerting requirements
* Capacity planning needs
* Team familiarity with monitoring

---

### Decision Tree

Using Horizon dashboard?
YES → Use built-in metrics — jobs per minute, queue depth, wait time
NO → Need custom metrics beyond Horizon defaults?
    YES → Use Pulse slow jobs recorder + custom Pulse recorders
NO → Need historical metric storage (>24h)?
    YES → Export Horizon metrics to external monitoring (Datadog, Grafana)
NO → Need alerting on queue anomalies?
    YES → Combine Horizon wait monitoring + custom Pulse alerts

---

### Rationale

Horizon provides real-time metrics on its dashboard (jobs processed, queue depth, wait times). For historical analysis and alerting, export metrics to an external monitoring system or use Laravel Pulse for aggregated views.

---

### Recommended Default

**Default:** Use Horizon dashboard for real-time monitoring; Pulse for historical trends; external monitoring for alerting and long-term capacity planning
**Reason:** Horizon gives real-time visibility. Pulse aggregates slow jobs and wait times. External monitoring enables alerting and capacity planning.

---

### Risks Of Wrong Choice

- Only Horizon: no historical data, no alerting
- No wait time monitoring: silent queue backlog
- No capacity planning: unexpected scaling needs

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Monitor Queue Health and Performance
- Configure Queue Observability
