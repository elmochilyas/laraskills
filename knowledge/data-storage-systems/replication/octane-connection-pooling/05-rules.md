# 7-14 Octane Connection Pooling - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-14 | |
| Knowledge Unit | 7-14 Octane Connection Pooling |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Monitor Replica Lag
---
## Category
Reliability
---
## Rule
Always monitor replica lag with an explicit alert threshold.
---
## Reason
Unmonitored replica lag causes stale reads.
---
## Bad Example
Not monitoring replication lag.
---
## Good Example
Alert when lag exceeds 5 seconds.
---
## Exceptions
Analytics tolerant of hours-old data.
---
## Consequences Of Violation
Stale data served to users.

---

## 2. Deploy Server-Side Pooler For PHP-FPM
---
## Category
Architecture
---
## Rule
Always deploy PgBouncer or ProxySQL for PHP-FPM deployments.
---
## Reason
PHP-FPM can't pool connections. 200 workers = 200 direct connections.
---
## Bad Example
200 PHP-FPM workers directly connecting to PostgreSQL
---
## Good Example
PgBouncer 50 backend connections serving 200 workers via transaction pooling
---
## Exceptions
Octane-only apps.
---
## Consequences Of Violation
Connection exhaustion.

---

## 3. Configure Octane Connection Pool
---
## Category
Performance
---
## Rule
Always configure pool settings for database connections in Octane.
---
## Reason
Without pool config, each Octane request creates a new connection.
---
## Bad Example
No pool config in Octane
---
## Good Example
pool min=2 max=10 ttl=60
---
## Exceptions
PHP-FPM deployments.
---
## Consequences Of Violation
Connection overhead.

---

## 4. Review And Apply Core Concepts
---
## Category
Design
---
## Rule
Always understand and apply the core concepts documented in this knowledge unit before making implementation decisions.
---
## Reason
Core concepts define the foundational principles that correct implementation depends on.
---
## Bad Example
Implementing without understanding core concepts.
---
## Good Example
Reviewing core concepts before implementation.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Implementation errors, unexpected behavior.

---

## 5. Consider Architecture Guidelines
---
## Category
Architecture
---
## Rule
Always review the architecture guidelines section when designing systems that involve this knowledge area.
---
## Reason
Architecture guidelines provide decision frameworks for selecting between approaches.
---
## Bad Example
Choosing an approach without comparing alternatives.
---
## Good Example
Using the architecture decision table to make informed choices.
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Suboptimal architectural decisions.

---

