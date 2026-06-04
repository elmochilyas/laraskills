# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 08-alerting-incident-response
**Knowledge Unit:** notification-routing-escalation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Alert severity levels defined (P1-P5) with response time SLAs
- [ ] Notification channels mapped to severity: PagerDuty for P1, Slack for P3, email for P5
- [ ] Escalation policy configured with level 1 and level 2 responders
- [ ] On-call schedule published and integrated with pager
- [ ] Alert fatigue mitigation strategy defined (grouping, suppression, graduated alerting)
- [ ] Laravel notification system used for application-level alert routing

---

# Architecture Checklist

- [ ] Alert source: health checks, error tracking, metrics threshold, log patterns
- [ ] Notification channel selection per alert type and severity
- [ ] Escalation policy: level 1 (primary), level 2 (senior), level 3 (manager)
- [ ] On-call schedule integration: PagerDuty, Opsgenie, or equivalent
- [ ] Graduated alerting: warning → critical → urgent with time-based escalation
- [ ] Notification deduplication configured to avoid alert storms

---

# Implementation Checklist

- [ ] Laravel notification classes created per alert type
- [ ] Notification channels configured: `mail`, `slack`, `nexmo` (SMS)
- [ ] On-call schedule maintained in external service (PagerDuty API)
- [ ] Escalation policy hard-coded or config-driven in `config/alerts.php`
- [ ] Alert deduplication window configured (e.g., 5-minute grouping)
- [ ] Alert silencing mechanism implemented (maintenance windows)

---

# Performance Checklist

- [ ] Alert-to-notification latency measured per channel
- [ ] SMS delivery latency assessed for critical P1 alerts
- [ ] Slack message rate limits understood and respected
- [ ] Mail notification volume balanced to avoid provider throttling
- [ ] On-call rotation query performance measured if self-managed
- [ ] Notification queue processed with appropriate priority

---

# Security Checklist

- [ ] Notification content does not contain PII, secrets, or internal topology
- [ ] Pager webhook URL stored in environment variables
- [ ] Slack webhook scopes limited to posting messages only
- [ ] SMS API keys stored securely (not hardcoded)
- [ ] On-call schedule privacy respected (team visible, personal numbers hidden)
- [ ] Maintenance window authentication enforced

---

# Reliability Checklist

- [ ] Notification delivery failure triggers escalation immediately
- [ ] Multiple notification channels configured per alert severity
- [ ] Escalation timeout configured per level (5min L1, 10min L2, 15min L3)
- [ ] Alert acknowledgment tracked and non-acknowledgement escalates
- [ ] Notification queue retries with backoff for transient failures
- [ ] On-call schedule availability verified before rotation start

---

# Testing Checklist

- [ ] Unit test: notification class renders correct content per channel
- [ ] Unit test: escalation policy returns next responder in sequence
- [ ] Integration test: alert triggers notification on configured channel
- [ ] Integration test: non-acknowledgment escalates after timeout
- [ ] Drill test: on-call engineer receives and acknowledges P1 alert
- [ ] Security test: notification content sanitized

---

# Maintainability Checklist

- [ ] Alert severity definitions documented and team-agreed
- [ ] Escalation policy version-controlled in `config/alerts.php`
- [ ] On-call schedule management documented in runbook
- [ ] Notification channel configuration reviewed quarterly
- [ ] Alert deduplication rules refined based on incident history
- [ ] Team trained on maintenance window procedure

---

# Anti-Pattern Prevention Checklist

- [ ] Not all alerts routed to highest severity channel (reduce fatigue)
- [ ] Escalation not triggered immediately on first failure without retry
- [ ] Deduplication window not set too long (delay critical alerts)
- [ ] Maintenance window not used as permanent alert silencing
- [ ] SMS not used for non-critical alerts (cost and desensitization)
- [ ] On-call rotation not overburdening single engineer

---

# Production Readiness Checklist

- [ ] Alert routing tested from each source (health, error, metric, log)
- [ ] Escalation policy tested end-to-end with simulated non-acknowledgment
- [ ] On-call schedule confirmed with current team coverage
- [ ] Maintenance window procedure documented and tested
- [ ] Alert fatigue metrics tracked (alerts per on-call shift)
- [ ] Post-incident review includes alert routing effectiveness assessment

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: severity levels, channel mapping, escalation policy, on-call integration, deduplication
- [ ] Security requirements satisfied: notification content sanitized, webhook URLs protected, schedule privacy respected
- [ ] Performance requirements satisfied: latency measured per channel, SMS assessed, rate limits respected
- [ ] Testing requirements satisfied: notification content correct, escalation works, drill acknowledged
- [ ] Anti-pattern checks passed: not all P1, escalation after retry, no permanent silencing, rotation balanced
- [ ] Production readiness verified: routing tested from all sources, escalation confirmed, coverage verified, fatigue tracked

---

# Related References

- Health Checks & System Health Modeling (health check alerts)
- Laravel Pulse (Pulse-based alerting triggers)
- Error Tracking Workflow (error-based alerting)
