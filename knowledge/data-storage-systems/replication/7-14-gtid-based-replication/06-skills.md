# Skill: Implement GTID-Based Replication

## Usage

Configure replication using Global Transaction Identifiers (GTID) instead of traditional binary log file + position, for easier failover and topology management.

## Purpose

Simplify replication failover, promote any replica without knowing binlog positions, and enable consistent crash recovery.

## When To Use

- MySQL 5.7+ or MariaDB 10.0+ with GTID support
- Need to failover or promote replicas without finding binlog positions
- Need crash-safe replication (replica resumes correctly after crash)
- Multi-source replication or complex topologies

## When NOT To Use

- Database version doesn't support GTID (MySQL < 5.6, MariaDB < 10.0)
- Migrating from file-based replication (requires careful switch)
- Third-party tools don't support GTID

## Prerequisites

- MySQL/MariaDB with GTID enabled (`gtid_mode=ON`)
- Existing replication or new setup
- Understanding of GTID format (`server_uuid:transaction_id`)

## Inputs

- Primary and replica server configuration
- Current replication status
- Existing binlog positions (for migration from file-based replication)

## Workflow (numbered steps)

1. Enable GTID on primary and all replicas:
   ```sql
   SET @@GLOBAL.GTID_MODE = ON_PERMISSIVE;
   SET @@GLOBAL.GTID_MODE = ON;
   ```
   Or set in my.cnf: `gtid_mode = ON`, `enforce_gtid_consistency = ON`
2. Verify GTID is enabled: `SHOW VARIABLES LIKE 'gtid_mode'`
3. Configure new replication using GTID:
   ```sql
   CHANGE MASTER TO MASTER_HOST='...', MASTER_USER='...',
     MASTER_AUTO_POSITION=1;
   START SLAVE;
   ```
4. `MASTER_AUTO_POSITION` automatically finds the correct binlog position based on GTID set
5. For failover:
   - Promote replica (STOP SLAVE, RESET MASTER)
   - New primary: other replicas change to `MASTER_AUTO_POSITION=1` pointing to new primary
   - No need to find binlog file and position
6. Monitor GTID consistency: `SHOW SLAVE STATUS` → `Retrieved_Gtid_Set`, `Executed_Gtid_Set`

## Validation Checklist

- [ ] GTID mode ON on all nodes
- [ ] Replication running with MASTER_AUTO_POSITION=1
- [ ] GTID sets consistent across nodes
- [ ] Failover tested: promote replica, verify GTID continuity
- [ ] Skip transaction errors resolved properly (inject empty transactions with GTID)

## Common Failures

- `enforce_gtid_consistency = OFF` — non-transactional statements break GTID
- GTID gap after replica promotes from backup — missing GTIDs
- Identical server_uuid — configure unique server_id per node
- Skipping transactions with sql_slave_skip_counter not supported in GTID mode

## Decision Points

- GTID vs file-based replication
- Enable GTID on existing replication (requires careful migration)
- GTID mode: ON vs ON_PERMISSIVE

## Performance Considerations

- GTID adds negligible overhead (~1% for transaction ID tracking)
- GTID auto-positioning is faster than manual binlog position lookup
- GTID purge can cause issues if binary logs expire before replica reads them

## Security Considerations

- GTID status information is operational, not sensitive
- Replication user must have replication client and replication slave grants

## Related Rules

- 7-14-1: Always Enable enforce_gtid_consistency
- 7-14-2: Never Switch GTID Mode Without Full Cluster Validation

## Related Skills

- Implement Master-Replica Topology
- Implement Replica Promotion and Failover
- Migrate From File-Based to GTID Replication

## Success Criteria

- GTID replication running on all nodes
- Failover does not require binlog position lookup
- GTID sets consistent across all nodes
- Replica crash recovery works automatically
