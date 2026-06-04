# Metadata

**Domain:** real-time-systems
**Subdomain:** security
**Knowledge Unit:** reverb-monitoring-metrics
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `/apps/{appId}/connections` monitored (polling interval 5-10s)
- [ ] `pulse:check` running on the Reverb server
- [ ] Alerts configured for: connection drop >10%, memory >80%, event loop lag >500ms
- [ ] Always Alert on Connection Anomalies
- [ ] Always Monitor All Four Metric Categories
- [ ] Always Monitor Redis Pub/Sub Subscriber Count
- [ ] Always Run pulse:check on the Reverb Server
- [ ] Always Secure the /apps/{appId}/connections Endpoint
- [ ] `/apps/{appId}/connections` monitored (5-10s interval)
- [ ] `pulse:check` running on the Reverb server
- [ ] Alerts configured for connection drop, memory, event loop lag
- [ ] Create dashboards for active connections, messages/s, auth failures, reconnection rate
- [ ] Enable `ReverbConnections` recorder in `config/pulse.php`
- [ ] Implement event loop lag monitoring (periodic timer measuring timestamp offset)
- [ ] Alerts fire on connection drops, high memory, and event loop lag
- [ ] All metric categories (connections, messages, errors, resources) are tracked
- [ ] Connections endpoint is secured against public access

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Create dashboards for active connections, messages/s, auth failures, reconnection rate
- [ ] Enable `ReverbConnections` recorder in `config/pulse.php`
- [ ] Implement event loop lag monitoring (periodic timer measuring timestamp offset)
- [ ] Monitor all four metric categories: connections, messages, errors, resources
- [ ] Monitor Redis pub/sub subscriber count for Reverb-Redis health
- [ ] Poll `/apps/{appId}/connections` every 5-10s for programmatic connection counts
- [ ] Run `pulse:check` daemon on the Reverb server (not just app servers)
- [ ] Secure the connections endpoint via `allowed_origins` and/or firewall
- [ ] Set alerts: connection drop >10% in 1min, memory >80%, event loop lag >500ms
- [ ] Set up log aggregation for Reverb logs (stdout from Supervisor)
- [ ] Always Alert on Connection Anomalies
- [ ] Always Monitor All Four Metric Categories

---

# Performance Checklist

- [ ] `/apps/{appId}/connections` endpoint is lightweight; poll every 5-10s without significant impact
- [ ] Custom Prometheus metric collection should use pull (scrape) over push
- [ ] Monitoring should not significantly impact the monitored systemâ€”<1% overhead target
- [ ] Pulse's Redis storage for metrics adds minimal overhead
- [ ] `/apps/{appId}/connections` is lightweight â€” polling every 5-10s has <1% overhead
- [ ] Monitoring overhead should be <1% of system resources
- [ ] Secure connections endpoint: restrict `allowed_origins`, use firewall rules

---

# Security Checklist

- [ ] `/apps/{appId}/connections` endpoint is unauthenticated by default (protected only by allowed_origins)
- [ ] Ensure monitoring endpoints are not exposed to the public internet
- [ ] Pulse dashboards containing Reverb metrics should require authentication
- [ ] Pulse dashboards should require authentication
- [ ] Secure connections endpoint: restrict `allowed_origins`, use firewall rules

---

# Reliability Checklist

- [ ] `/apps/connections` publicly accessible
- [ ] Connection anomalies undetected
- [ ] False alerts during deployments
- [ ] Pulse shows empty Reverb card
- [ ] Reverb-Redis disconnect invisible
- [ ] Always Alert on Connection Anomalies
- [ ] Always Monitor All Four Metric Categories
- [ ] Always Monitor Redis Pub/Sub Subscriber Count
- [ ] Always Run pulse:check on the Reverb Server
- [ ] Always Secure the /apps/{appId}/connections Endpoint

---

# Testing Checklist

- [ ] `/apps/{appId}/connections` monitored (5-10s interval)
- [ ] `/apps/{appId}/connections` monitored (polling interval 5-10s)
- [ ] `pulse:check` running on the Reverb server
- [ ] Alerts configured for connection drop, memory, event loop lag
- [ ] Alerts configured for: connection drop >10%, memory >80%, event loop lag >500ms
- [ ] Alerts fire on connection drops, high memory, and event loop lag
- [ ] All metric categories (connections, messages, errors, resources) are tracked
- [ ] Connections endpoint is secured against public access
- [ ] Connections endpoint secured via `allowed_origins`
- [ ] Dashboards created for connections, messages, errors, resources

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Only Monitoring Connection Count (Missing Other Metrics)]
- [ ] [pulse:check Not Running on the Reverb Server]
- [ ] [No Alerts on Connection Anomalies]
- [ ] [No Alerting on Connection Anomalies]
- [ ] [/apps/{appId}/connections Endpoint Unrestricted]
- [ ] No alerting on connection anomalies
- [ ] Not monitoring Redis pub/sub subscriber count
- [ ] Setting alerts without proper thresholds

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitoring overhead should be <1% of system resources

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


