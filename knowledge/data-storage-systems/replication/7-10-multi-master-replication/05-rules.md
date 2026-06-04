# 7-10 Multi-Master Replication - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-10 |
| Knowledge Unit | 7-10 Multi-Master Replication |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Test Conflict Resolution Before Production
---
## Category
Reliability
---
## Rule
Always verify conflict resolution behavior with concurrent write tests before enabling multi-master in production.
---
## Reason
Unexpected conflict resolution behavior can cause silent data loss or application errors under concurrent writes.
---
## Bad Example
Deploying Galera without testing concurrent updates to the same row.
---
## Good Example
Write the same row from two nodes simultaneously and verify the expected resolution outcome.
---
## Exceptions
Single-master topology (no conflicts possible).
---
## Consequences Of Violation
Silent data corruption when conflicts resolve unpredictably.

---

## 2. Never Assume All Nodes Are Consistent
---
## Category
Design
---
## Rule
Never assume that all multi-master nodes have identical data at any point in time when using asynchronous replication.
---
## Reason
Asynchronous replication introduces a window where nodes have different data states.
---
## Bad Example
Reading from node A after writing to node B and expecting to see the write immediately.
---
## Good Example
Design application for eventual consistency. Use read-after-write consistency fixes if needed.
---
## Exceptions
Synchronous multi-master (Galera) guarantees consistency at commit time.
---
## Consequences Of Violation
Application reads stale data and makes decisions based on incomplete state.

---

## 3. Always Use Odd Number of Multi-Master Nodes
---
## Architecture
---
## Rule
Always deploy an odd number of multi-master nodes to prevent split-brain during network partitions.
---
## Reason
Even-numbered clusters can split into two equal halves, both unable to form a write quorum.
---
## Bad Example
Deploying 4 Galera nodes (can split 2-2, both sides reject writes).
---
## Good Example
Deploying 3 or 5 nodes. After a partition, one side has majority and continues writes.
---
## Exceptions
Arbiter/witness node provides quorum for even-numbered clusters.
---
## Consequences Of Violation
Cluster-wide write unavailability during network partitions.

---
