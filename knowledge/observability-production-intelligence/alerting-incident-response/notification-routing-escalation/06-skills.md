```yaml
name: alert-routing-escalation-setup
description: >
  Guide an AI agent through configuring alert routing and escalation for a
  Laravel application's observability stack — Alertmanager routes, grouping,
  inhibition, on-call schedules, and escalation chains.
workflow:
  steps:
    - name: identify-services-and-severities
      description: >
        List all services that generate alerts: api, worker, payments,
        notifications, database, cache. Define severity levels:
        critical, warning, info. Document which services map to
        which on-call teams.

    - name: define-routes
      description: >
        Create Alertmanager routes:
        - Critical payments route → payments-team on-call
        - Critical infrastructure route → infra-team on-call
        - Warning route → Slack #alerts-warning channel
        - Info route → email digest
        Place specific routes first, catch-all last.

    - name: configure-grouping
      description: >
        Set grouping configuration:
        group_by: ['alertname', 'service']
        group_wait: 30s
        group_interval: 5m
        repeat_interval: 4h
        Adjust repeat_interval for critical alerts (10m).

    - name: configure-inhibition
      description: >
        Define inhibition rules:
        - Critical alert inhibits warnings for same service
        - SEV1 inhibits SEV3 for same service
        Test inhibition with alert simulation.

    - name: setup-escalation
      description: >
        Configure escalation in PagerDuty/Opsgenie:
        - Acknowledge timeout: 5 minutes for critical
        - Escalation level 1: primary on-call
        - Escalation level 2: secondary on-call
        - Escalation level 3: engineering manager
        Verify escalation by triggering test alert.

    - name: configure-silences
      description: >
        Create silence templates for common maintenance:
        - Database migration: service=database
        - Deployment: service=api, service=worker
        - Cache flush: service=cache
        Document silence creation process for all engineers.

    - name: test-end-to-end
      description: >
        Full end-to-end test:
        - Fire test alert from monitoring system
        - Verify route matches correctly
        - Verify notification delivery
        - Verify acknowledgment works
        - Verify escalation on non-acknowledgment

  triggers:
    - User asks "How do I configure alert routing?"
    - User asks "How do I set up on-call escalation?"
    - User reports "Alerts are going to the wrong person"
```
