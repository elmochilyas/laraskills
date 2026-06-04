# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** Reverb Monitoring Metrics
**Generated:** 2026-06-03

---

# Decision Inventory

* Monitoring Approach: Laravel Pulse vs Custom Prometheus vs Combined
* Alert Threshold Configuration
* Metric Collection Scope: Four Categories vs Connection-Only

---

# Architecture-Level Decision Trees

---

## Monitoring Approach: Laravel Pulse vs Custom Prometheus vs Combined

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb must be monitored to detect connection anomalies, resource exhaustion, and reconnection storms. The engineer must choose between Laravel Pulse (first-party), custom Prometheus metrics, or both.

---

## Decision Criteria

* performance considerations — monitoring overhead on Reverb server
* architectural considerations — existing monitoring infrastructure
* security considerations — metrics endpoint access control
* maintainability considerations — setup effort vs customization needs

---

## Decision Tree

What monitoring approach should be used?
↓
Is Laravel Pulse already deployed for the application?
YES → Are advanced dashboards or Prometheus integration needed?
    YES → [Laravel Pulse + Custom Prometheus exporter — best of both]
    NO → [Laravel Pulse only — sufficient for most deployments]
NO → Is there existing Prometheus/Grafana infrastructure?
    YES → [Custom Prometheus metrics collection + Pulse (optional)]
    NO → [Install Laravel Pulse — quickest path to Reverb monitoring]

---

## Rationale

Laravel Pulse with the `ReverbConnections` recorder provides built-in Reverb monitoring with minimal setup—just enable the recorder and run `pulse:check` on the Reverb server. For most deployments, this is sufficient. Custom Prometheus integration is needed when (1) existing Grafana dashboards must be extended, (2) alerting rules in Prometheus are preferred over Pulse's notifications, or (3) detailed per-connection metrics beyond Pulse's aggregate views are required. Soketi has a built-in Prometheus endpoint; Reverb requires building a custom exporter.

---

## Recommended Default

**Default:** Laravel Pulse with `ReverbConnections` recorder for initial monitoring; add Prometheus if advanced dashboards are needed
**Reason:** Minimal setup; first-party support; sufficient for connection, message, and error monitoring

---

## Risks Of Wrong Choice

No monitoring leaves the deployment blind to connection anomalies. Pulse alone may lack the detail needed for deep performance debugging.

---

## Related Rules

Always Set Up Laravel Pulse with the Reverb Card (05-rules.md)

---

## Related Skills

Monitor Reverb Metrics with Laravel Pulse (06-skills.md)

---

## Alert Threshold Configuration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Alerts must distinguish between real incidents (crash, reconnection storm) and normal events (rolling deployment, planned maintenance). Incorrect thresholds cause alert fatigue or missed incidents.

---

## Decision Criteria

* performance considerations — alert response time requirements
* architectural considerations — deployment patterns (rolling vs all-at-once)
* security considerations — incident detection vs false alarm rate
* maintainability considerations — threshold tuning over time

---

## Decision Tree

What alert thresholds should be configured?
↓
Connection drop > 10% in 1 minute?
YES → Is a deployment or restart in progress?
    YES → [Suppress alert; deployment expected]
    NO → [Alert: potential crash or network partition]
Memory usage > 80% of PHP memory limit?
YES → [Alert: capacity warning — scale up or investigate leak]
Event loop lag > 500ms?
YES → [Alert: performance degradation — event loop blocked]
Auth endpoint P95 latency > 200ms?
YES → [Alert: auth endpoint slowing — potential scaling issue]

---

## Rationale

Thresholds must account for normal operational events. A 10% connection drop in 1 minute during a rolling deployment is expected (one instance being drained). The same drop outside a deployment signals a crash. Event loop lag >500ms indicates the event loop is blocked, which prevents Reverb from processing heartbeats and messages. Memory >80% of the PHP memory limit gives time to react before OOM. Auth endpoint P95 >200ms suggests the auth endpoint is struggling under load.

---

## Recommended Default

**Default:** Connection drop >10%/1min (outside deployments), memory >80%, event loop lag >500ms, auth P95 >200ms
**Reason:** Balances early detection with acceptable false alarm rate

---

## Risks Of Wrong Choice

Overly sensitive thresholds cause alert fatigue; overly permissive thresholds allow silent degradation. Not accounting for planned deployments causes false alarms.

---

## Related Rules

Always Alert on Connection Anomalies (05-rules.md)

---

## Related Skills

Monitor Reverb Metrics with Laravel Pulse (06-skills.md)

---

## Metric Collection Scope: Four Categories vs Connection-Only

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

It's tempting to only monitor connection counts (the most visible metric), but this misses critical signals like message rate drops or auth failure spikes. The engineer must decide how many metric dimensions to track.

---

## Decision Criteria

* performance considerations — overhead of collecting each metric category
* architectural considerations — available monitoring tools
* security considerations — auth failures as security signal
* maintainability considerations — dashboard complexity

---

## Decision Tree

What metric categories should be monitored?
↓
Is this a production deployment with > 500 concurrent connections?
YES → [Monitor all four categories: connections, messages, errors, resources]
NO → Is this a staging or QA environment?
    YES → [Monitor connections + errors — sufficient for QA]
    NO → Is this a development environment?
        YES → [Connection count only — minimal monitoring]
        NO → [All four categories — production best practice]

---

## Rationale

Four metric categories provide complete visibility: (1) Connections (active count, connection rate, peak concurrency) detect storms and capacity issues, (2) Messages (per-second, size distribution) indicate system usage, (3) Errors (auth failures, disconnection reasons, protocol errors) identify problems, and (4) Resources (memory, CPU, event loop lag, file descriptors) indicate capacity constraints. Monitoring only connections misses the other three categories entirely. For production, all four categories are essential—each provides a different early warning signal.

---

## Recommended Default

**Default:** All four metric categories for production; connections + errors for staging; connections only for dev
**Reason:** Each category provides unique signals that the others cannot replace

---

## Risks Of Wrong Choice

Connection-only monitoring misses auth failure spikes (security incident), message rate drops (broadcast failure), and resource warnings (impending crash).

---

## Related Rules

Always Monitor All Four Metric Categories (05-rules.md)

---

## Related Skills

Monitor Reverb Metrics with Laravel Pulse (06-skills.md)
