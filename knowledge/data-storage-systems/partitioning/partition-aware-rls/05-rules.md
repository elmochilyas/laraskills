# 8-17 Partition Aware Rls - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | partitioning |
| Knowledge Unit ID | 8-17 | |
| Knowledge Unit | 8-17 Partition Aware Rls |
| Total Rules | 4 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Include Partition Key In WHERE
---
## Category
Performance
---
## Rule
Always include the partition key in WHERE clauses for partition pruning.
---
## Reason
Without partition key, all partitions are scanned.
---
## Bad Example
SELECT FROM orders WHERE status = active // no partition key
---
## Good Example
SELECT FROM orders WHERE created_at > 2024-01-01 AND status = active
---
## Exceptions
Full-table reporting scans.
---
## Consequences Of Violation
Full partition scan.

---

## 2. Automate Partition Lifecycle
---
## Category
Reliability
---
## Rule
Always automate partition creation and archiving with scheduled jobs.
---
## Reason
Manual management leads to missed partitions or unbounded growth.
---
## Bad Example
CREATE PARTITION p2024_05 manually each month
---
## Good Example
Monthly cron: CREATE PARTITION for next period, DROP old
---
## Exceptions
Fixed small partition counts.
---
## Consequences Of Violation
Missed partitions, unbounded table growth.

---

## 3. Review And Apply Core Concepts
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

## 4. Consider Architecture Guidelines
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

