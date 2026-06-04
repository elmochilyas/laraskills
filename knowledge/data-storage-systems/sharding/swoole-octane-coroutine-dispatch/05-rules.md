# 6-16 Swoole Octane Coroutine Dispatch - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | sharding |
| Knowledge Unit ID | 6-16 | |
| Knowledge Unit | 6-16 Swoole Octane Coroutine Dispatch |
| Total Rules | 4 |
| Generated | 2026-06-02 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Choose High-Cardinality Shard Key
---
## Category
Scalability
---
## Rule
Always choose a shard key with high cardinality included in most WHERE clauses.
---
## Reason
Low cardinality causes hot shards. Missing shard key causes fan-out.
---
## Bad Example
Sharding by status -- all active on one shard.
---
## Good Example
Sharding by user_id -- even distribution.
---
## Exceptions
Directory-based sharding.
---
## Consequences Of Violation
Hot shards, fan-out queries.

---

## 2. Never Rely On Cross-Shard Transactions
---
## Category
Scalability
---
## Rule
Design aggregates so all data lives within a single shard.
---
## Reason
Distributed XA transactions across shards have high failure rates.
---
## Bad Example
BEGIN shard1; INSERT ...; BEGIN shard2; INSERT ...; COMMIT both
---
## Good Example
Collocate User and Orders using same shard key.
---
## Exceptions
Compensation sagas for eventual consistency.
---
## Consequences Of Violation
Transaction failures.

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

