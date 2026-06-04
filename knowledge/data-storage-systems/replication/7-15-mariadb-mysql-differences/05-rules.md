# 7-15 MariaDB / MySQL Differences - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-15 |
| Knowledge Unit | 7-15 MariaDB / MySQL Differences |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Never Replicate MySQL From MariaDB
---
## Category
Architecture
---
## Rule
Never configure a MySQL server as a replica of a MariaDB primary.
---
## Reason
MySQL cannot replicate from MariaDB due to incompatible GTID formats and binary log formats.
---
## Bad Example
Configuring CHANGE MASTER on MySQL pointing to a MariaDB primary.
---
## Good Example
Use CDC (Debezium) or ETL for data transfer from MariaDB to MySQL.
---
## Exceptions
None — this is technically unsupported.
---
## Consequences Of Violation
Replication fails with GTID format mismatch errors. Data divergence.

---

## 2. Always Test Cross-Version Replication Before Production
---
## Category
Reliability
---
## Rule
Always thoroughly test replication between different database versions before deploying to production.
---
## Reason
Even minor version differences can introduce replication incompatibilities through default changes, collation differences, or SQL syntax changes.
---
## Bad Example
Assuming MySQL 8.0 replicates to MySQL 8.4 without testing.
---
## Good Example
Set up a test topology matching production versions, run concurrent write tests, verify data consistency.
---
## Exceptions
Identical versions on all nodes.
---
## Consequences Of Violation
Replication failures after version upgrade due to incompatibilities.

---

## 3. Always Use Vendor-Specific Parallel Replication Settings
---
## Operations
---
## Rule
Always configure parallel replication using the correct settings for the specific database vendor and version.
---
## Reason
MySQL and MariaDB use different parallel replication mechanisms. Wrong settings cause apply bottlenecks.
---
## Bad Example
Applying MySQL slave_parallel_type=DATABASE settings to MariaDB.
---
## Good Example
MySQL: slave_parallel_type=LOGICAL_CLOCK, slave_parallel_workers=4. MariaDB: slave_parallel_threads=4, slave_parallel_mode=optimistic.
---
## Exceptions
Single-threaded replication (slave_parallel_workers=0).
---
## Consequences Of Violation
Replica apply performance degraded. Lag increases during write bursts.

---
