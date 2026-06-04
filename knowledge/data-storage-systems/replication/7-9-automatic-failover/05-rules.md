# 7-9 Automatic Failover - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-9 |
| Knowledge Unit | 7-9 Automatic Failover |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Validate Health Checks Before Automatic Failover
---
## Category
Reliability
---
## Rule
Always validate that health checks accurately detect primary failure before enabling automatic failover.
---
## Reason
Misconfigured health checks cause false positive failovers, resulting in unnecessary downtime.
---
## Bad Example
Enabling automatic failover with a single connection check and no query validation.
---
## Good Example
Use multi-layer health checks: connection + query + lag, with consecutive failure threshold.
---
## Exceptions
Cloud-managed databases with provider-validated health checks.
---
## Consequences Of Violation
False failovers during network blips, causing unnecessary application downtime.

---

## 2. Never Allow Split-Brain In Automatic Failover
---
## Category
Architecture
---
## Rule
Never design an automatic failover system that allows both old and new primary to accept writes simultaneously.
---
## Reason
Split-brain causes irreversible data divergence that requires manual reconciliation.
---
## Bad Example
Failing over without fencing the old primary (no STONITH, no VIP revocation).
---
## Good Example
Implement STONITH to force-kill old primary, or use quorum-based fencing.
---
## Exceptions
None — split-brain is always unacceptable.
---
## Consequences Of Violation
Data divergence requiring point-in-time recovery and manual merge.

---

## 3. Always Test Automatic Failover Monthly
---
## Category
Operations
---
## Rule
Test the automatic failover mechanism at least monthly in a staging environment.
---
## Reason
Untested failover is likely to fail when needed due to configuration drift or software changes.
---
## Bad Example
Assuming automatic failover works because it was tested once during setup.
---
## Good Example
Monthly failover drills that simulate primary failure and measure RTO.
---
## Exceptions
Cloud-managed databases with provider SLA on failover.
---
## Consequences Of Violation
Failover fails in production, extending downtime.

---
