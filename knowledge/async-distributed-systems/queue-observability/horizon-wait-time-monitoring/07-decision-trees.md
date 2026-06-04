# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Observability
**Knowledge Unit:** horizon-wait-time-monitoring
**Generated:** 2026-06-03

---

# Decision Inventory

* Wait Time Alert Threshold Strategy

---

# Architecture-Level Decision Trees

---

## Wait Time Alert Threshold Strategy

---

### Decision Context

Setting appropriate wait time thresholds for queue monitoring alerts.

---

### Decision Criteria

* Job latency requirements (SLOs)
* Worker capacity relative to dispatch volume
* Queue priority tier
* Alert response time

---

### Decision Tree

Queue has user-facing SLO (e.g., password emails within 1 minute)?
YES → Set wait time threshold at 50% of SLO — alert before SLO is violated
NO → Queue is high-priority (critical tier)?
    YES → Set threshold at 1 minute — tight tolerance
NO → Queue is low-priority (bulk tier)?
    YES → Set threshold at 10-30 minutes — loose tolerance
NO → Default queue?
    YES → Set threshold at 5 minutes — balanced

---

### Rationale

Wait time is the gap between dispatch and processing. It's the leading indicator of worker capacity issues. Alert thresholds should reflect the job's latency SLO — alert before the SLO is breached, not after.

---

### Recommended Default

**Default:** Alert when wait time exceeds 5 minutes for default queues; 1 minute for critical; 30 minutes for bulk
**Reason:** Matches typical latency requirements per priority tier. Alerting before SLO breach gives time to respond.

---

### Risks Of Wrong Choice

- Threshold too tight: false alarms for normal processing delays
- Threshold too loose: alerts fire after SLO already violated
- No differentiation by priority: critical queue buried in bulk queue alerts

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Monitor Queue Health and Performance
- Configure Horizon Notifications
