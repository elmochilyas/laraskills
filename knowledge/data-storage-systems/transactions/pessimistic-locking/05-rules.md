# 9-15 Pessimistic Locking - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | transactions |
| Knowledge Unit ID | 9-15 | |
| Knowledge Unit | 9-15 Pessimistic Locking |
| Total Rules | 5 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Keep Transactions Short
---
## Category
Performance
---
## Rule
Never include external API calls, file uploads, or user input waits inside a database transaction.
---
## Reason
Long transactions hold locks for extended periods, increasing contention and MVCC bloat.
---
## Bad Example
DB::transaction function $order.save; Http::post ...  -- API call inside transaction
---
## Good Example
Http::post first, then DB::transaction for database work only
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Lock contention, deadlocks, MVCC bloat, replication lag.

---

## 2. Always Use DB::transaction Closure
---
## Category
Framework Usage
---
## Rule
Always use DB::transaction closure instead of manual beginTransaction/commit/rollback.
---
## Reason
The closure auto-commits on success and rolls back on exception, preventing orphaned transactions.
---
## Bad Example
Manual transaction management: DB::beginTransaction; try ... catch ... rollBack
---
## Good Example
DB::transaction function doThings  -- auto commit on success, rollback on exception
---
## Exceptions
Distributed transactions across multiple databases.
---
## Consequences Of Violation
Unreleased locks from unhandled exceptions.

---

## 3. Prefer Optimistic Locking For Low Contention
---
## Category
Performance
---
## Rule
Use optimistic locking when concurrent writes to the same row are rare.
---
## Reason
Optimistic locking has zero read overhead and only fails on commit in case of conflict.
---
## Bad Example
Using lockForUpdate on every order update in low-traffic app
---
## Good Example
Add a version column and catch exception on version mismatch
---
## Exceptions
High-contention resources where pessimistic locking is better.
---
## Consequences Of Violation
Unnecessary lock overhead and reduced concurrency.

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

