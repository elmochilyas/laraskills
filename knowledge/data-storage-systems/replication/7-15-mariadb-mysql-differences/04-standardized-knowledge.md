# 7-15 MariaDB / MySQL Differences

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-15 |
| Knowledge Unit Title | MariaDB / MySQL Differences |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.14 GTID-based replication | 7.16 Multi-source replication |
| Last Updated | 2026-06-04 |

## Overview

MySQL and MariaDB have diverged significantly in replication implementation. Key differences include GTID format, multi-source support, parallel replication, and cross-version compatibility. Understanding these differences is critical for managing mixed topologies and choosing the right database.

---

## Core Concepts

- **GTID format**: MySQL uses `UUID:seq_number`. MariaDB uses `domain_id-server_id-transaction_id`. Incompatible between vendors.
- **Multi-source replication**: Native in MariaDB since 10.0. MySQL supports it only from 8.0.23.
- **Parallel replication**: MariaDB uses `optimistic` mode. MySQL uses `LOGICAL_CLOCK` (database or commit timestamp).
- **Crash-safe replication**: MariaDB crash-safe by default with GTID. MySQL requires `relay_log_info_repository=TABLE`.
- **Cross-vendor replication**: MariaDB can replicate from MySQL 8.0. MySQL **cannot** replicate from MariaDB.

## When To Use

- Migrating between MySQL and MariaDB
- Managing mixed MySQL + MariaDB replication topology
- Evaluating database for new projects

## When NOT To Use

- Homogeneous MySQL-only or MariaDB-only environment

## Best Practices

- Avoid cross-vendor replication in production
- Always test cross-version replication before production
- Use same major version across topology

## Architecture Guidelines

| Feature | MySQL 8.0+ | MariaDB 11+ |
|---------|-----------|-------------|
| GTID format | UUID:seq | domain-server-seq |
| Multi-source | 8.0.23+ | Native since 10.0 |
| Parallel replication | LOGICAL_CLOCK | Optimistic |
| Multi-master | Group Replication | Galera (built-in) |
| Cross-vendor replica | Cannot replicate from MariaDB | Can replicate from MySQL |

## Performance Considerations

- MariaDB optimistic parallel replication can outperform MySQL for certain workloads
- MySQL LOGICAL_CLOCK groups transactions by commit timestamp
- Both achieve sub-second replica apply for OLTP

## Security Considerations

- Mixed replication should use TLS
- Replication user across versions should have minimal grants

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | MySQL replicating from MariaDB | Assuming compatibility | GTID format mismatch | Use CDC/ETL instead |
| 2 | Different collation defaults | Version mismatch | Replication data mismatch | Verify collation settings |
| 3 | Wrong parallel replication config | Vendor confusion | Replica apply bottleneck | Use correct settings per vendor |

## Anti-Patterns

- Mixing MySQL and MariaDB in replication without thorough testing
- Assuming GTID format is compatible between vendors
- Using old replication configuration patterns across versions

## Verification

- [ ] Replication works with your database version combination
- [ ] GTID format matches database vendor
- [ ] Cross-replication tested (if needed)
- [ ] Parallel replication configured per vendor
