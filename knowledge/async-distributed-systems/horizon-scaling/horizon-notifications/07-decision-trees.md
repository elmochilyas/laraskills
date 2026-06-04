# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** horizon-notifications
**Generated:** 2026-06-03

---

# Decision Inventory

* Horizon Notification Channels and Alert Strategy

---

# Architecture-Level Decision Trees

---

## Horizon Notification Channels and Alert Strategy

---

### Decision Context

Configuring Horizon notifications for queue health alerts.

---

### Decision Criteria

* Team notification preferences (email, Slack, SMS)
* Alert severity levels
* Response time requirements
* Notification fatigue

---

### Decision Tree

Queue wait time exceeds threshold?
YES → Notify on-call via Slack (immediate) or email (lower priority)
NO → Long queue processing time detected?
    YES → Notify via Slack — may indicate stuck jobs or capacity issue
NO → Failed job count spikes?
    YES → Notify daily digest — not immediate unless critical
NO → Default?
    YES → Configure Slack notifications for wait time alerts; email for daily failed job summary

---

### Rationale

Horizon can send notifications when queue wait times exceed thresholds. Configure notification channels based on urgency: Slack for immediate attention, email for daily summaries, SMS for critical incidents.

---

### Recommended Default

**Default:** Slack notification for wait time alerts (immediate attention); email notification for daily failed job summary
**Reason:** Wait time alerts need immediate response. Failed job summaries can be reviewed daily to identify patterns.

---

### Risks Of Wrong Choice

- Too many notifications: alert fatigue, important alerts ignored
- Too few notifications: queue backlog grows without detection
- Wrong channel for severity: email for critical issue — delayed response

---

### Related Rules

- monitor-queue-depth-as-leading-indicator

---

### Related Skills

- Configure Horizon Notifications
- Monitor Queue Health and Performance
