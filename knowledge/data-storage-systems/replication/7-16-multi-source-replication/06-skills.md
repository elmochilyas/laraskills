# Skill: Implement Multi-Source Replication

## Purpose

Configure a replica to receive data from multiple primary sources, enabling the consolidation of shards or multiple databases onto a single reporting/analytics server.

## When To Use

- Consolidating multiple sharded databases into a single reporting replica
- Merging data from multiple applications into an analytics database
- Need a unified read-only view across multiple primary databases
- Migrating from sharded to monolithic database

## When NOT To Use

- Single primary (use standard master-replica)
- Replica must accept writes (multi-source is read-only from each source)
- Strong consistency across sources required
- Data conflicts between sources cannot be resolved

## Prerequisites

- Database supporting multi-source (MariaDB 10.0+, MySQL 8.0.23+)
- Unique database/table naming across sources (prevent conflicts)
- Understanding of each source's schema

## Inputs

- Source primary connection details (multiple)
- Target replica configuration
- Schema mapping and conflict resolution plan
- Table name collision strategy (prefix, separate databases)

## Workflow (numbered steps)

1. Configure each source as a separate replication channel:
   ```sql
   -- MariaDB:
   CHANGE MASTER 'source1' TO MASTER_HOST='...', MASTER_PORT=3306, ...;
   CHANGE MASTER 'source2' TO MASTER_HOST='...', MASTER_PORT=3306, ...;
   START ALL SLAVES;

   -- MySQL 8.0+:
   CHANGE MASTER TO ... FOR CHANNEL 'source1';
   CHANGE MASTER TO ... FOR CHANNEL 'source2';
   START SLAVE FOR CHANNEL 'source1';
   START SLAVE FOR CHANNEL 'source2';
   ```
2. If sources have same database/table names, use replication filters:
   - `replicate_rewrite_db` to remap source1_db → dest_db1, source2_db → dest_db2
   - Or use separate databases per source
3. Monitor each channel independently: `SHOW SLAVE 'source1' STATUS`
4. Handle conflicts:
   - Design schemas so table names are unique per source (source prefix, separate databases)
   - If tables overlap, use `replicate_do_table` and `replicate_ignore_table`
5. Plan for DDL: schema changes on each source must be coordinated with replica

## Validation Checklist

- [ ] Each replication channel is running and up to date
- [ ] Data from each source is correctly routed to target databases/tables
- [ ] No data conflicts or overwrites between sources
- [ ] Monitoring shows per-channel lag
- [ ] Any source failure is detected and alerting works
- [ ] DDL changes on each source are compatible

## Common Failures

- Table name collisions — data from different sources overwrites each other
- One channel lagging affects other channels only if replica apply thread is single-threaded total
- DDL from one source fails on replica because other source has conflicting schema
- GTID conflicts: different source GTIDs must be unique (MariaDB domain_id, MySQL server_uuid)
- Server_id collision between channels

## Decision Points

- Separate databases vs table prefixes for data isolation
- Number of concurrent sources (too many = replica overload)
- Schema: unified vs per-source (separate databases per source)

## Performance Considerations

- Replica apply: each channel applies sequentially, but channels run in parallel (MariaDB)
- Total replica load = sum of write load from all sources
- Parallel apply within each channel depends on database version and settings

## Security Considerations

- Each channel has its own replication user — manage credentials per source
- Consolidated data may have different access requirements (aggregate sensitivity)

## Related Rules

- 7-16-1: Always Ensure Unique Table/Database Names Across Sources
- 7-16-2: Never Mix Sources Without Per-Channel Monitoring

## Related Skills

- Implement Master-Replica Topology
- Consolidate Shards into Single Replica
- Implement Multi-Source Data Warehouse

## Success Criteria

- All sources replicate to the same replica
- No data conflicts or overwrite issues
- Per-channel lag monitoring operational
- Schema changes from each source compatible with target
