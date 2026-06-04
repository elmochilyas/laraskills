# 7-14 GTID-Based Replication - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-14 |
| Knowledge Unit | 7-14 GTID-Based Replication |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Enable enforce_gtid_consistency
---
## Category
Reliability
---
## Rule
Always set `enforce_gtid_consistency=ON` when using GTID-based replication.
---
## Reason
Without this setting, non-transactional statements (CREATE TABLE...SELECT, temporary tables) can break GTID continuity.
---
## Bad Example
Leaving `enforce_gtid_consistency=OFF` — non-transactional DDL causes replication errors.
---
## Good Example
Set `enforce_gtid_consistency=ON` in my.cnf on all nodes before enabling GTID.
---
## Exceptions
Legacy applications using non-transactional statements that cannot be changed.
---
## Consequences Of Violation
Replication failures that require manual GTID gap resolution.

---

## 2. Never Switch GTID Mode Without Full Cluster Validation
---
## Category
Operations
---
## Rule
Never change GTID mode on any node without validating the full sequence and cluster state.
---
## Reason
Incorrect GTID mode transition causes replication errors and potential GTID gaps.
---
## Bad Example
Switching directly from OFF to ON without going through permissive states.
---
## Good Example
Follow sequence: OFF → OFF_PERMISSIVE → ON_PERMISSIVE → ON, validate at each step.
---
## Exceptions
New cluster setup (no existing transactions).
---
## Consequences Of Violation
Irreversible GTID gaps that require full data resync.

---

## 3. Always Use MASTER_AUTO_POSITION For New Replication
---
## Architecture
---
## Rule
Always use `MASTER_AUTO_POSITION=1` when configuring replication with GTID enabled.
---
## Reason
Auto-positioning eliminates the need to manually track binlog file and position, simplifying failover.
---
## Bad Example
Manually specifying binlog file and position with GTID enabled.
---
## Good Example
CHANGE MASTER TO MASTER_HOST='...', MASTER_AUTO_POSITION=1;
---
## Exceptions
Mixed GTID/file-based replication during migration.
---
## Consequences Of Violation
Replication setup requires manual binlog position lookup, defeating GTID benefits.

---
