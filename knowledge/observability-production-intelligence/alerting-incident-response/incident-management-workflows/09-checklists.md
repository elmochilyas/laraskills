# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 08-alerting-incident-response
**Knowledge Unit:** incident-management-workflows
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Incident lifecycle understood: detection, notification, response, mitigation, resolution, postmortem
- [ ] Automated detection sources configured: Pulse, Sentry, health checks
- [ ] Pager notification system integrated (PagerDuty, Opsgenie)
- [ ] War room collaboration channel created (Slack, Teams)
- [ ] Status page updated during incidents (e.g., Statuspage.io)
- [ ] Blameless postmortem process established

---

# Architecture Checklist

- [ ] Detection layer: alerts from Pulse, error spikes from Sentry, health check failures
- [ ] Notification layer: graded alerting based on severity (P1-P5)
- [ ] Response layer: war room auto-creation, runbook assignment
- [ ] Mitigation layer: rollback, feature flag toggling, scaling actions
- [ ] Resolution layer: root cause documented, fix deployed, monitor verified
- [ ] Postmortem layer: template defined, timeline reconstructed, action items tracked

---

# Implementation Checklist

- [ ] Incident commander role assigned per shift rotation
- [ ] Runbooks created for common incident types (deploy failure, DB outage, queue backlog)
- [ ] War room Slack channel auto-generated via webhook
- [ ] Status page template prepared with severity-based messaging
- [ ] Postmortem template created with timeline, root cause, action items
- [ ] Incident severity definitions documented (P1: service down, P5: cosmetic)

---

# Performance Checklist

- [ ] Alert-to-notification latency measured (target < 60 seconds)
- [ ] War room creation time measured (target < 30 seconds)
- [ ] Status page update time automated (< 5 minutes)
- [ ] MTTR tracked per incident type and reviewed monthly
- [ ] Postmortem action item closure rate monitored
- [ ] Incident response drill frequency established (quarterly)

---

# Security Checklist

- [ ] Incident response runbook does not contain production secrets
- [ ] War room access controlled (invite-only during active incident)
- [ ] Status page information sanitized (no internal details)
- [ ] Postmortem draft access restricted to incident responders
- [ ] Incident communication does not reveal security vulnerabilities publicly
- [ ] Pager notification routing respects on-call schedule privacy

---

# Reliability Checklist

- [ ] Pager notification acknowledged or escalated workflow defined
- [ ] Missed acknowledgment escalation configured (level 1 → level 2)
- [ ] War room created automatically when P1 declared
- [ ] Status page auto-updates on incident severity change
- [ ] Postmortem action items tracked to completion with owners
- [ ] Incident metrics (MTTR, time-to-ack) monitored for degradation

---

# Testing Checklist

- [ ] Game day test: simulated incident flows through entire lifecycle
- [ ] Alert test: notification reaches on-call engineer within SLA
- [ ] War room test: collaboration channel created with correct members
- [ ] Status page test: page updated with correct severity
- [ ] Postmortem test: template used after game day exercise
- [ ] Regression test: incident workflow not broken by tool changes

---

# Maintainability Checklist

- [ ] Runbooks version-controlled in repository with application code
- [ ] Incident severity definitions reviewed quarterly
- [ ] Postmortem action items tracked in project management tool
- [ ] On-call schedule reviewed monthly for coverage gaps
- [ ] Incident response playbook documented for new team members
- [ ] Regular incident response drills scheduled and debriefed

---

# Anti-Pattern Prevention Checklist

- [ ] Incident not declared too late due to alert fatigue
- [ ] Postmortem not skipped for minor incidents (blame culture)
- [ ] War room not used for non-incident collaboration (notification fatigue)
- [ ] Runbook not outdated without review cycle
- [ ] Status page not neglected during major incident
- [ ] Incident commander not wearing multiple roles during active incident

---

# Production Readiness Checklist

- [ ] On-call schedule published and team members confirmed
- [ ] Pager notification tested end-to-end with acknowledgment
- [ ] War room channel created and verified
- [ ] Status page visible at expected URL
- [ ] Postmortem template available to all team members
- [ ] Incident metrics dashboard created: MTTR, time-to-ack, incidents/week

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: detection, notification, response, mitigation, resolution, postmortem layers defined
- [ ] Security requirements satisfied: runbook secrets-free, war room controlled, status page sanitized
- [ ] Performance requirements satisfied: alert latency < 60s, time-to-ack tracked, drill frequency set
- [ ] Testing requirements satisfied: game day passed, alert tested, war room verified, status page confirmed
- [ ] Anti-pattern checks passed: early declaration, blameless culture, runbook reviewed, commander single-role
- [ ] Production readiness verified: on-call schedule active, pager tested, metrics dashboard created, postmortem ready

---

# Related References

- Notification Routing & Escalation (alerting as incident trigger)
- Error Tracking Workflow (incident detection via error spikes)
- Health Checks & System Health Modeling (prevention via proactive detection)
