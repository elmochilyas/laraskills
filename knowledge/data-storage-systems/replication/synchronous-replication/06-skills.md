# Skill: Deploy Synchronous Replication Cluster

## Purpose

Configure a synchronous multi-node cluster (Galera, MySQL Group Replication, PostgreSQL synchronous_commit) where all nodes acknowledge every write before commit, providing strong consistency and zero data loss.

## When To Use

- Zero data loss requirement (RPO = 0)
- Finance, payments, compliance-critical applications
- Strong read-after-write consistency across all nodes

## When NOT To Use

- Application can tolerate asynchronous replication
- Network latency between nodes exceeds 5ms (write latency penalty)
- Cluster spans distant geographic regions (sync cross-region is impractical)
- Team lacks operational expertise for cluster management

## Prerequisites

- 3 or 5 database nodes (odd number for quorum)
- Low-latency network between nodes (same region, preferably same AZ)
- Database engine supporting sync replication (MariaDB Galera, Percona XtraDB Cluster, MySQL Group Replication, PostgreSQL)

## Inputs

- Node count (3 or 5 recommended)
- Node IP addresses and ports
- Galera/Group Replication configuration parameters
- Write latency budget

## Workflow (numbered steps)

1. Provision nodes with identical hardware and database version
2. Configure Galera/Group Replication: wsrep_cluster_name, wsrep_node_address, wsrep_cluster_address
3. Bootstrap first node (`mysqld --wsrep-new-cluster`)
4. Join remaining nodes to cluster
5. Verify cluster size: `SHOW STATUS LIKE 'wsrep_cluster_size'`
6. Configure SSL/TLS for node-to-node communication
7. Set up health monitoring (quorum, flow control, certification failures)
8. Configure application connection string: connect to any node or use load balancer
9. Test failure scenarios: node kill, network partition, full cluster restart

## Validation Checklist

- [ ] Cluster size matches configured node count
- [ ] Write committed on all nodes simultaneously (zero data loss)
- [ ] Flow control pauses writes when slowest node exceeds threshold
- [ ] Node failure doesn't stop writes (quorum maintained)
- [ ] Network partition: minority nodes reject writes (split-brain prevention)

## Common Failures

- Write latency penalty: all writes wait for slowest node — avoid cross-region sync clusters
- Quorum loss: 2-node cluster can't tolerate any failure — always use odd number
- Flow control: slow node causes all writes to pause
- Certification failures: conflicting writes in multi-primary mode cause rollbacks

## Decision Points

- Node count: 3 (tolerate 1 failure) vs 5 (tolerate 2 failures, higher write latency)
- Multi-primary vs single-primary: multi-primary allows writes on any node but needs conflict resolution
- Galera vs Group Replication vs PostgreSQL sync: Galera (mature, MariaDB), Group Replication (MySQL 8.0 native), PostgreSQL sync_commit (configurable durability level)

## Performance Considerations

- Write latency = max(node_ack_latency). With 3 nodes in same AZ: 2-5ms additional
- Write throughput: reduced vs async (all nodes must apply each write)
- Read throughput: scales linearly (reads from any node, no lag)
- Flow control threshold: balance between cluster consistency and write performance

## Security Considerations

- Encryption mandatory for state transfer and replication traffic
- Node-to-node authentication required
- SST (State Snapshot Transfer) must be secured — can expose data in transit

## Related Rules

- 7-13-1: Always Use Odd Number of Cluster Nodes
- 7-13-2: Never Deploy Sync Cluster Across Distant Regions

## Related Skills

- Implement Master-Replica Topology
- Configure Multi-Region Replication (Async)
- Monitor Replica Health

## Success Criteria

- All nodes have identical data (zero divergence)
- Write latency within budget (same-AZ: <5ms additional)
- Cluster survives node failure without manual intervention
- RPO = 0 (zero data loss) on any single-node failure

---

# Skill: Troubleshoot Synchronous Replication Cluster Issues

## Purpose

Diagnose and resolve common synchronous replication cluster problems: quorum loss, flow control, certification failures, and node join failures.

## When To Use

- Cluster node fails to join
- Write latency suddenly increases
- Writes are rejected with "not accepting" errors
- Node shows "donor/desync" state

## When NOT To Use

- Cluster is healthy — use proactive monitoring instead
- Issue is isolated to application SQL

## Prerequisites

- Database admin access to all cluster nodes
- Monitoring tool (Prometheus + Galera exporter, PMM)
- Cluster status commands knowledge

## Inputs

- Error messages from database logs
- Cluster status variables from `SHOW GLOBAL STATUS`
- Application error reports (write failures, timeouts)

## Workflow (numbered steps)

1. Check cluster size: `SHOW STATUS LIKE 'wsrep_cluster_size'`
2. Check quorum: `SHOW STATUS LIKE 'wsrep_cluster_status'` — should be "Primary"
3. Check flow control: `wsrep_flow_control_paused` — >0.01 means writes are being paused
4. Check certification failures: `wsrep_cert_deps_distance`, `wsrep_local_bf_aborts`
5. If node won't join: check `wsrep_last_committed` to ensure node isn't too far behind
6. If quorum lost: identify the most advanced node, bootstrap from it
7. If flow control active: find slowest node (high disk latency or CPU), address root cause
8. After fixing: verify all nodes are synced (`wsrep_local_state_comment: Synced`)

## Validation Checklist

- [ ] `wsrep_cluster_size` matches configured node count
- [ ] `wsrep_cluster_status` = "Primary" on all nodes
- [ ] `wsrep_flow_control_paused` < 0.01
- [ ] All nodes show `wsrep_local_state_comment: Synced`

## Common Failures

- Bootstrapping from wrong node after full cluster restart (data loss)
- Flow control caused by one slow node (disk I/O, network latency)
- Auto-increment gaps causing certification conflicts in multi-primary
- IST (Incremental State Transfer) failing, falling back to full SST

## Decision Points

- Full cluster restart: bootstrap from node with highest sequence number
- Donor choice: prefer node with least load for SST/IST

## Performance Considerations

- SST (full data copy) is expensive — prefer IST for rejoining nodes
- Flow control pauses all writes — identify and fix slow node quickly

## Security Considerations

- SST exposes full database contents over network — must be encrypted
- Admin access to cluster nodes must be audited

## Related Rules

- 7-13-3: Always Bootstrap Cluster from Most Advanced Node

## Related Skills

- Deploy Synchronous Replication Cluster
- Monitor Replica Health
- Manage Database Backups

## Success Criteria

- All nodes rejoined and synced
- Write latency restored to normal levels
- Quorum maintained, no further failures
