# 7-16 Multi-Source Replication - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-16 |
| Knowledge Unit | 7-16 Multi-Source Replication |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Ensure Unique Table/Database Names Across Sources
---
## Category
Architecture
---
## Rule
Always ensure that table and database names are unique across all multi-source replication channels.
---
## Reason
Duplicate table names cause data from one source to overwrite data from another, resulting in silent data loss.
---
## Bad Example
Two sources both have an `orders` table replicating to the same database.
---
## Good Example
Use `replicate_rewrite_db` to map source1_db → dest_db_1, source2_db → dest_db_2.
---
## Exceptions
Data is intentionally merged into shared tables with partitioned keys.
---
## Consequences Of Violation
Silent data loss — data from one source overwrites another.

---

## 2. Never Mix Sources Without Per-Channel Monitoring
---
## Category
Operations
---
## Rule
Never deploy multi-source replication without independent monitoring for each replication channel.
---
## Reason
Each channel can lag or fail independently. Without per-channel monitoring, a failed channel goes undetected while others continue.
---
## Bad Example
Only monitoring global Seconds_Behind_Master which aggregates all channels.
---
## Good Example
Monitor each channel: SHOW SLAVE 'channel1' STATUS, SHOW SLAVE 'channel2' STATUS. Alert per-channel.
---
## Exceptions
Single-source replication (only one channel).
---
## Consequences Of Violation
Undetected replication failure on one channel causes stale data from that source.

---

## 3. Always Use Unique Server IDs Per Source
---
## Reliability
---
## Rule
Always configure unique server_id and (for MariaDB) domain_id for each multi-source replication source.
---
## Reason
Duplicate server IDs between sources cause GTID conflicts that break replication.
---
## Bad Example
Two source primaries both configured with server_id=1.
---
## Good Example
Assign unique server_id per source: source1=101, source2=102, replica=100.
---
## Exceptions
MariaDB multi-source uses domain_id for GTID uniqueness.
---
## Consequences Of Violation
GTID conflicts cause replication to stop with duplicate entry errors.

---
