# Decomposition: Billing Production Observability Metrics

## Topic Overview

Billing systems are the revenue backbone of SaaS applications. Production observability metrics for billing must go beyond generic application monitoring to track the complete lifecycle of every billing event: webhook receipt, processing, completion, failure, duplication, and latency. Key metrics include Stripe webhook counters, subscription drift detection, billing queue depth, failed job categorization, feature gate denial tracking, and permission denial anomaly detection. Combined with correlation ID tracing, Pulse dashboards, Sentry/Bugsnag exception tracking, and alert thresholds with escalation paths, this forms a complete billing monitoring system.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded observability domain with independent metric definitions, alert configurations, and operational procedures. No further decomposition is needed.

## Proposed Folder Structure

```
billing-production-metrics/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

## Knowledge Unit Inventory

### Billing Production Observability Metrics
- **Purpose:** Defines the complete set of production observability metrics required for a Laravel billing system. Covers Stripe webhook lifecycle metrics (received, processed, failed, duplicate, latency), subscription drift detection, billing queue health, failed job categorization, feature gate denial tracking, permission denial anomaly detection, correlation ID tracing, Pulse dashboard configuration, Sentry/Bugsnag exception tracking, alert thresholds with escalation, manual replay UI for failed events, and failed job recovery patterns.
- **Difficulty:** Advanced
- **Dependencies:** K062 Stripe Webhook Handling (webhook processing patterns), K046 `$tries` and `$maxExceptions` (retry behavior), K055 `ShouldBeUnique` (webhook deduplication), Pulse documentation.

## Dependency Graph

This KU depends on: K062 Stripe Webhook Handling, K046, K055, Pulse documentation
This KU is depended on by: Billing system architecture, revenue operations monitoring, financial compliance auditing.

## Boundary Analysis

**In scope:**
- Stripe webhook lifecycle metrics (received, processed, failed, duplicate, latency)
- Subscription drift detection and alerting
- Billing queue depth and health metrics
- Failed billing job categorization and recovery
- Feature gate denial metrics and anomaly detection
- Permission denial spike detection
- Correlation ID tracing across webhook→job→handler
- Pulse dashboard configuration for billing
- Sentry/Bugsnag exception tracking for billing
- Alert thresholds and escalation policies
- Manual replay UI for failed billing events
- Audit log integration for billing events
- Failed job recovery patterns

**Out of scope:** Stripe webhook signature verification implementation (K062), general application monitoring (covered in other Observability KUs), payment gateway integration details (Cashier/Spark), specific Stripe API usage.

## Future Expansion Opportunities

Potential for specialized sub-KUs on: Paddle/Braintree billing metrics (multi-provider), usage-based billing observability (metered), invoice lifecycle tracking.

---

## Success Criteria

This decomposition is complete when:

- [x] No Knowledge Unit is overloaded
- [x] No major concept is missing
- [x] Boundaries are clear
- [x] Future phases can operate on individual units
- [x] The structure can scale without reorganization
