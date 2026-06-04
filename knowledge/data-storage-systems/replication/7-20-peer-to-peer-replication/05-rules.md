# 7-20 Peer-to-Peer Replication - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-20 |
| Knowledge Unit | 7-20 Peer-to-Peer Replication |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Use Odd Number of Nodes for Quorum
---
## Architecture
---
## Rule
Always deploy peer-to-peer replication with an odd number of nodes (3, 5, or 7) for proper quorum-based operation.
---
## Reason
Odd node counts prevent split-brain: during a network partition, one side always has majority and continues writes.
---
## Bad Example
Deploying 4 Galera nodes (can split 2-2, both sides reject writes).
---
## Good Example
3 nodes (tolerates 1 failure), 5 nodes (tolerates 2 failures).
---
## Exceptions
Arbiter/witness node provides quorum for even-numbered clusters.
---
## Consequences Of Violation
Write unavailability during network partitions — minority side rejects writes, majority may not exist.

---

## 2. Never Ignore Flow Control Warnings
---
## Operations
---
## Rule
Never ignore flow control warnings in Galera or Group Replication — they indicate a node falling behind.
---
## Reason
Flow control slows down all writes cluster-wide. Ignoring it causes cascading performance degradation.
---
## Bad Example
Seeing flow control pause messages and taking no action.
---
## Good Example
Investigate the slow node: check CPU, IO, network. Upgrade or remove the slow node from cluster.
---
## Exceptions
Temporary traffic spikes that resolve naturally.
---
## Consequences Of Violation
Sustained write throughput degradation across the entire cluster.

---

## 3. Always Configure Auto-Increment Per Node
---
## Reliability
---
## Rule
Always configure `auto_increment_increment` and unique `auto_increment_offset` on each P2P node.
---
## Reason
Without per-node auto-increment configuration, two nodes can generate duplicate IDs, causing replication conflicts.
---
## Bad Example
Leaving default auto_increment settings on all Galera nodes.
---
## Good Example
Node 1: auto_increment_increment=3, auto_increment_offset=1. Node 2: increment=3, offset=2. Node 3: increment=3, offset=3.
---
## Exceptions
Application uses UUIDs or application-generated unique IDs.
---
## Consequences Of Violation
Duplicate primary key errors during concurrent inserts on different nodes.

---
