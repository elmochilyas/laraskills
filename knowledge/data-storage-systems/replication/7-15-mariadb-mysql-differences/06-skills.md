# Skill: Implement Replication with MariaDB / MySQL Differences

## Purpose

Understand the key differences between MariaDB and MySQL replication implementations to avoid subtle incompatibilities and choose the right approach for your database.

## When To Use

- Migrating between MySQL and MariaDB
- Managing mixed MySQL + MariaDB replication topology
- Designing replication with MariaDB-specific features (multi-source, parallel replication)
- Evaluating which database for new project

## When NOT To Use

- Homogeneous MySQL-only or MariaDB-only environment
- Replication not used

## Prerequisites

- Understanding of both MySQL and MariaDB versions
- Replication experience in at least one platform

## Inputs

- Source database: MySQL or MariaDB, specific version
- Target database: MySQL or MariaDB, specific version
- Desired features (multi-source, parallel apply, GTID)

## Key Differences

1. **GTID format**:
   - MySQL: `UUID:seq_number` (e.g., `abc-def:1`)
   - MariaDB: `domain_id-server_id-transaction_id` (e.g., `0-100-1`)
2. **GTID mode**:
   - MySQL: `gtid_mode=ON`, `enforce_gtid_consistency=ON`
   - MariaDB: GTID always built into binary log, cannot be turned off
3. **Replication filters**:
   - MariaDB: `replicate_do_db` works on statement-based, `replicate_do_table` better
   - MySQL: similar behavior but subtle differences with cross-database queries
4. **Multi-source replication**:
   - MariaDB: native support since 10.0
   - MySQL: Group Replication only for multi-master, no native multi-source until 8.0.23
5. **Parallel replication**:
   - MariaDB: `slave_parallel_threads`, `slave_parallel_mode`
   - MySQL: `slave_parallel_workers`, `slave_parallel_type` (database or LOGICAL_CLOCK)
6. **Crash-safe replication**:
   - MariaDB: crash-safe by default with GTID (no extra config)
   - MySQL: needs `relay_log_info_repository=TABLE` and `master_info_repository=TABLE`
7. **Replication between MySQL and MariaDB**:
   - MariaDB can replicate from MySQL 8.0 (with compatibility settings)
   - MySQL cannot replicate from MariaDB
   - Avoid cross-replication in production

## Validation Checklist

- [ ] Replication works with your database version combination
- [ ] GTID format matches the database vendor
- [ ] Cross-replication (if needed) tested and validated
- [ ] Parallel replication configured appropriately for vendor and version
- [ ] Crash-safe settings correct for the database

## Common Failures

- MySQL-to-MariaDB replication: GTID format mismatch
- MariaDB-to-MySQL replication: not supported (MariaDB GTID vs MySQL GTID)
- Different default collation/character set → replication data mismatch
- Slave_parallel_mode incompatibility across versions

## Decision Points

- Which database vendor and version for new projects
- Whether to mix MySQL and MariaDB in replication topology (avoid if possible)
- Which parallel replication strategy to use

## Performance Considerations

- MariaDB parallel replication: `optimistic` mode can outperform MySQL
- MySQL logical_clock parallel replication: groups transactions by commit time
- Both can achieve sub-second replica apply for OLTP workloads

## Security Considerations

- Mixed replication should use TLS
- Replication user across different database versions should have minimal grants

## Related Rules

- 7-15-1: Never Replicate MySQL From MariaDB
- 7-15-2: Always Test Cross-Version Replication Before Production

## Related Skills

- Implement Master-Replica Topology
- Implement GTID-Based Replication
- Implement Multi-Source Replication

## Success Criteria

- Replication topology works with chosen database vendor/version
- No GTID or compatibility issues
- Parallel replication configured for optimal apply speed
- Cross-version replication (if needed) tested and validated
