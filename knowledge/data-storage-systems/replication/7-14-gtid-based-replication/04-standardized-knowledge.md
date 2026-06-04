# 7-14 GTID-Based Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-14 |
| Knowledge Unit Title | GTID-Based Replication |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.8 Replica promotion failover |
| Last Updated | 2026-06-04 |

## Overview

Global Transaction Identifiers (GTID) uniquely identify each transaction committed on a MySQL/MariaDB server. GTID-based replication (`MASTER_AUTO_POSITION=1`) simplifies failover by eliminating the need to manually find binary log positions. Each transaction has a unique ID that tracks its execution across the replication topology.

---

## Core Concepts

- **GTID format**: MySQL uses `UUID:seq_number` (e.g., `abc-def:1`). MariaDB uses `domain_id-server_id-transaction_id`.
- **MASTER_AUTO_POSITION**: Automatically finds correct binlog position based on GTID sets exchanged between primary and replica.
- **GTID mode**: OFF → OFF_PERMISSIVE → ON_PERMISSIVE → ON (migration sequence).
- **enforce_gtid_consistency**: Prevents non-transactional statements that break GTID.
- **GTID set**: The set of all GTIDs executed on a server — used for auto-positioning.

## When To Use

- MySQL 5.7+ or MariaDB 10.0+ with GTID support
- Need to failover without finding binlog positions
- Complex topologies (multi-source, cascading)

## When NOT To Use

- Database version doesn't support GTID
- Third-party tools don't support GTID

## Best Practices

- Always enable `enforce_gtid_consistency=ON`
- Follow the exact migration sequence: OFF → OFF_PERMISSIVE → ON_PERMISSIVE → ON
- Monitor GTID sets for consistency across nodes

## Architecture Guidelines

| Approach | Failover Ease | Crash Safety | Complexity |
|----------|-------------|-------------|------------|
| File-based replication | Manual position lookup | Manual recovery | Low |
| GTID-based replication | Automatic positioning | Automatic | Medium |
| GTID + semi-sync | Automatic + zero data loss | Automatic | Medium |

## Performance Considerations

- GTID adds ~1% overhead for transaction ID tracking
- Auto-positioning is faster than manual binlog position lookup
- GTID purge can cause issues if binlogs expire before replica reads them

## Security Considerations

- GTID status is operational, not sensitive
- Replication user needs REPLICATION SLAVE grant

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | enforce_gtid_consistency OFF | Skipped configuration | Non-transactional statements break GTID | Always set to ON |
| 2 | GTID gap after backup restore | Missing GTIDs | Replica can't connect | Use --set-gtid-purged=ON |
| 3 | Skipping with sql_slave_skip_counter | Old habit | Not supported in GTID mode | Inject empty transaction |

## Anti-Patterns

- Migrating to GTID without validation at each step
- Using GTID without enforce_gtid_consistency
- Letting binlogs expire before replica processes them

## Verification

- [ ] GTID mode ON on all nodes
- [ ] Replication running with MASTER_AUTO_POSITION=1
- [ ] GTID sets consistent across nodes
- [ ] Failover tested without binlog position lookup
