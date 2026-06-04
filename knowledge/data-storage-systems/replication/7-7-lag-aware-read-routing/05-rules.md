# 7-7 Lag-Aware Read Routing - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-7 |
| Knowledge Unit | 7-7 Lag-Aware Read Routing |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Check Lag Before Reading From Replica
---
## Category
Reliability
---
## Rule
Always check replication lag before routing a read query to a replica.
---
## Reason
Unchecked lag can serve stale data that violates application freshness requirements.
---
## Bad Example
Routing reads to replicas without any lag check.
---
## Good Example
Check lag via pt-heartbeat or SBM, compare to threshold, route to primary if exceeded.
---
## Exceptions
Replicas with synchronous replication (zero lag guaranteed).
---
## Consequences Of Violation
Stale data served to users, potentially causing data inconsistency errors.

---

## 2. Never Route Time-Sensitive Reads To Lagging Replicas
---
## Category
Design
---
## Rule
Never route reads that require fresh data (auth, session, payments) to replicas that may lag.
---
## Reason
Time-sensitive reads must see immediately consistent data that only the primary guarantees.
---
## Bad Example
Routing authentication checks to a replica that may be 2 seconds behind.
---
## Good Example
Always route session and payment reads to primary.
---
## Exceptions
Synchronous replication with verified zero lag.
---
## Consequences Of Violation
Users see stale session data, payment confirmation fails, authentication errors.

---

## 3. Always Define Per-Query-Type Lag Thresholds
---
## Architecture
---
## Rule
Define separate lag thresholds for different query types rather than using a single global value.
---
## Reason
Different query types have different staleness tolerance — a single threshold is either too strict or too loose.
---
## Bad Example
Using 5-second threshold for both user-facing dashboards and historical reports.
---
## Good Example
1-2 seconds for user-facing, 30-60 seconds for analytics, 0 for auth.
---
## Exceptions
Applications with uniform freshness requirements across all queries.
---
## Consequences Of Violation
Either defeated read scaling (too strict) or stale data served (too loose).

---
