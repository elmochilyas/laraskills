# Skill: Implement Multi-Master Replication

## Purpose

Configure a replication topology where multiple database nodes accept writes simultaneously, providing higher write availability and multi-region writes.

## When To Use

- Need write availability across multiple data centers or regions
- Application can handle conflict resolution (or conflicts are rare)
- Zero-downtime maintenance (failover any node without interrupting writes)
- Active-active disaster recovery

## When NOT To Use

- Strong consistency required for all writes
- Application cannot resolve write conflicts
- Single region, single data center (master-replica is simpler)
- Schema changes must sync across nodes (DDL coordination is hard)

## Prerequisites

- Database supporting multi-master (MySQL Group Replication, Galera, PostgreSQL BDR)
- Understanding of conflict resolution strategies
- Application designed for multi-master (or using proxy layer)

## Inputs

- Node configurations (hosts, ports, credentials)
- Conflict resolution strategy
- Network topology (inter-node latency)

## Workflow (numbered steps)

1. Choose multi-master technology:
   - Galera Cluster (MySQL/MariaDB): synchronous, all nodes can write, conflict detection
   - MySQL Group Replication: multi-primary mode, certification-based conflict detection
   - PostgreSQL BDR (Bi-Directional Replication): asynchronous, conflict resolution
   - Custom: application-level dual-write with reconciliation
2. Configure cluster by connecting nodes (not chaining):
   - MySQL Group Replication: `CHANGE MASTER TO` + `START GROUP_REPLICATION` on each node
   - Galera: `wsrep_cluster_address` pointing to all nodes
3. Ensure application can write to any node (connection pool round-robin or DNS round-robin)
4. Handle conflicts at the database level or application level:
   - Database: last-write-wins, first-committer-wins (Galera), CRDT
   - Application: version vectors, custom merge logic
5. Monitor: cluster size, flow control (Galera), certification failures
6. Plan for schema changes: DDL locks all nodes (Galera) or requires rolling upgrade

## Validation Checklist

- [ ] All nodes accept writes
- [ ] Writes from any node are visible on all nodes
- [ ] Conflict resolution works correctly (test with concurrent writes)
- [ ] Node failure doesn't impact other nodes' write availability
- [ ] Node rejoins cluster correctly after failure
- [ ] Schema changes tested on multi-master

## Common Failures

- Dead tuples/bloat accumulate faster (no single cleanup coordinator)
- Auto-increment conflicts (use auto_increment_increment and offset)
- Network partition splits cluster (split-brain — Galera aborts on minority side)
- DDL locks all nodes — can cause downtime during migrations

## Decision Points

- Synchronous (Galera, Group Replication) vs asynchronous (BDR, Tungsten)
- Proxy-based multi-master (ProxySQL) vs native application writes
- Conflict resolution: database-level (LWW, FCC) vs application-level

## Performance Considerations

- Synchronous multi-master: write latency = max(all node latencies)
- Asynchronous multi-master: write latency = local node only (conflicts possible)
- Flow control in Galera pauses writes on fast nodes if slow node can't keep up

## Security Considerations

- All inter-node replication must be encrypted
- Nodes must authenticate to join cluster
- Each node should have full data (no partial replicas)

## Related Rules

- 7-10-1: Always Test Conflict Resolution Before Production
- 7-10-2: Never Assume All Nodes Are Consistent at All Times (async)

## Related Skills

- Implement Master-Replica Topology
- Implement Conflict Resolution for Multi-Master
- Implement Multi-Region Replication

## Success Criteria

- All nodes accept writes simultaneously
- Conflict resolution handles concurrent writes without data loss
- Node failure does not interrupt write availability on other nodes
- Schema changes applied without cluster-wide downtime
