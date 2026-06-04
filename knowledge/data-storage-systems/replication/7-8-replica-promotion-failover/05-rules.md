# 7-8 Replica Promotion Failover - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-8 |
| Knowledge Unit | 7-8 Replica Promotion Failover |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Check Lag Before Promoting Replica
---
## Category
Reliability
---
## Rule
Always verify replication lag is within RPO before promoting a replica to primary.
---
## Reason
Promoting a lagging replica causes data loss equal to unreplicated transactions.
---
## Bad Example
Promoting replica without checking lag during an emergency failover.
---
## Good Example
Check lag, verify it's below RPO threshold, then promote.
---
## Exceptions
Primary is completely destroyed and no other replica is available.
---
## Consequences Of Violation
Data loss of all transactions not yet replicated to the promoted replica.

---

## 2. Never Promote A Replica With Lag > RPO
---
## Category
Design
---
## Rule
Never promote a replica if its lag exceeds the defined Recovery Point Objective.
---
## Reason
Violating RPO means accepting more data loss than the business requires.
---
## Bad Example
Promoting a replica with 60 seconds of lag when RPO is 5 seconds.
---
## Good Example
Wait for lag to drop below RPO, or accept data loss with documented exception.
---
## Exceptions
Business has explicitly accepted higher data loss for availability.
---
## Consequences Of Violation
Unacceptable data loss, compliance violations, audit findings.

---

## 3. Always Test Failover In Staging
---
## Category
Operations
---
## Rule
Always test the full failover procedure in a staging environment before production use.
---
## Reason
Untested failover procedures fail under real incident pressure.
---
## Bad Example
Documenting a failover procedure but never executing it.
---
## Good Example
Monthly failover drills that simulate primary failure and verify application recovery.
---
## Exceptions
Cloud-managed databases with provider-tested failover.
---
## Consequences Of Violation
Failover fails in production, extending downtime beyond acceptable RTO.

---
