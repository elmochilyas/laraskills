# 7-11 Conflict Resolution - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-11 |
| Knowledge Unit | 7-11 Conflict Resolution |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Handle Conflict Rollback in Application
---
## Category
Reliability
---
## Rule
Always implement retry logic in application code to handle transaction rollbacks from conflict resolution.
---
## Reason
Galera certification failures and other conflict rollbacks throw errors that require application retry.
---
## Bad Example
Not catching deadlock errors from Galera — writes fail silently.
---
## Good Example
Implement retry loop with exponential backoff (3 attempts, 100ms/200ms/500ms).
---
## Exceptions
Application uses LWW with no rollback behavior.
---
## Consequences Of Violation
Write operations fail silently, causing data loss.

---

## 2. Never Assume Conflicts Don't Happen
---
## Category
Design
---
## Rule
Never design a multi-master application assuming that write conflicts will never occur.
---
## Reason
Even with careful data partitioning, race conditions and edge cases can cause unexpected conflicts.
---
## Bad Example
Deploying multi-master without testing concurrent writes to the same data.
---
## Good Example
Assume conflicts are possible, test them, and have a resolution strategy.
---
## Exceptions
Data is strictly partitioned by node with no overlapping write sets.
---
## Consequences Of Violation
Unexpected conflicts cause data corruption or application errors in production.

---

## 3. Always Log Conflict Resolution Events
---
## Category
Operations
---
## Rule
Always log all conflict resolution events for auditing and debugging purposes.
---
## Reason
Conflict resolution can cause data changes that need to be traced for compliance and debugging.
---
## Bad Example
Relying on database error logs that are overwritten during rotation.
---
## Good Example
Centralized logging of all certification failures, LWW overwrites, and manual merges.
---
## Exceptions
None — audit trail is essential for multi-master data integrity.
---
## Consequences Of Violation
Inability to trace data changes during conflict audits or incident investigation.

---
