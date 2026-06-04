# 8-18 Partitioning Vs Sharding Framework - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | partitioning |
| Knowledge Unit ID | 8-18 | |
| Knowledge Unit | 8-18 Partitioning Vs Sharding Framework |
| Total Rules | 5 |
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

## 3. Always Include Partition Key In WHERE
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

## 4. Automate Partition Lifecycle
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

## 5. Review And Apply Core Concepts
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

