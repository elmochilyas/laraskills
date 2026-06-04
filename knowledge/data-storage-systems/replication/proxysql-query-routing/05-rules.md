# 7-17 Proxysql Query Routing - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-17 | |
| Knowledge Unit | 7-17 Proxysql Query Routing |
| Total Rules | 3 |
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

## 2. Review And Apply Core Concepts
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

## 3. Consider Architecture Guidelines
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

