# Skill: Implement Peer-to-Peer Replication

## Purpose

Configure a fully distributed replication topology where all nodes are equal and can accept both reads and writes, without a single primary.

## When To Use

- Need active-active writes across multiple nodes (no single point of failure)
- All nodes must be able to accept write traffic
- Application designed for or tolerant of eventual consistency
- Edge computing: each node serves local writes
- Multi-master MySQL solutions (Group Replication, Galera) are Peer-to-Peer

## When NOT To Use

- Single-node or master-replica topology is sufficient
- Strong consistency required across nodes
- Application cannot handle conflict resolution or rollbacks
- Write latency must be low (sync P2P = max(all nodes RTT))

## Prerequisites

- Database supporting P2P replication (Galera, MySQL Group Replication, Cassandra, DynamoDB)
- Understanding of conflict resolution or consensus protocol (Paxos, Raft, quorum)
- Network connectivity between all nodes (any node can reach any other)

## Inputs

- Node list (IP:port for each node)
- Replication group configuration
- Quorum or consensus settings
- Conflict resolution strategy

## Workflow (numbered steps)

1. Choose P2P technology:
   - **Galera Cluster** (MySQL/MariaDB): synchronous, all nodes equal, certification-based conflict detection
   - **MySQL Group Replication** (Multi-Primary): consensus-based, all nodes accept writes
   - **PostgreSQL BDR**: asynchronous P2P, multi-master with conflict resolution
   - **Cassandra / ScyllaDB**: peer-to-peer by design, eventual consistency
2. Configure node membership:
   - Galera: `wsrep_cluster_address='gcomm://node1,node2,node3'` on all nodes
   - MySQL Group Replication: `group_replication_group_seeds`
   - Bootstrap first node, then add subsequent nodes
3. Ensure quorum for writes:
   - Galera: requires majority (N/2 + 1) nodes connected
   - Group Replication: majority for write quorum
   - If nodes < majority, cluster rejects writes (primary component)
4. Configure auto-increment for multi-master writes:
   - Set `auto_increment_increment = N` (number of nodes)
   - Set `auto_increment_offset` unique per node (1, 2, 3...)
5. Test writes to each node and verify propagation to all other nodes
6. Monitor cluster state: cluster size, quorum, flow control, certification failures

## Validation Checklist

- [ ] All nodes accept writes
- [ ] Writes propagate to all other nodes
- [ ] Node failure doesn't stop writes on remaining nodes (> quorum)
- [ ] Split-brain prevented (network partition: minority side rejects writes)
- [ ] New node joins cluster and receives all existing data
- [ ] Auto-increment configured correctly (no ID collisions)

## Common Failures

- Split-brain: network partition splits cluster, both sides accept writes
- State transfer timeout: new node can't catch up within timeout
- Flow control (Galera): slow node slows down all writes
- Certification failures: concurrent updates cause transaction rollbacks
- Quorum loss: too many nodes fail, remaining nodes can't write

## Decision Points

- Synchronous (Galera, Group Replication) vs asynchronous (BDR, Cassandra)
- Quorum size (default N/2+1 vs custom)
- Node count: odd number preferred (3, 5, 7) for quorum
- State transfer method: IST vs SST (Galera)

## Performance Considerations

- Write latency = max(time to certify/commit on all nodes)
- Galera: each write requires certification on all nodes
- Throughput degrades as more nodes added (each node must process all writes)
- Network latency between nodes directly impacts write latency

## Security Considerations

- All inter-node communication must be encrypted
- Node authentication to prevent unauthorized nodes joining
- Split-brain prevention: use仲裁 (witness) node for even-numbered clusters
- SST (State Snapshot Transfer) can expose all data to new node — must be authenticated

## Related Rules

- 7-20-1: Always Use Odd Number of Nodes for Quorum
- 7-20-2: Never Ignore Flow Control Warnings

## Related Skills

- Implement Multi-Master Replication
- Implement Conflict Resolution
- Implement Galera Cluster
- Implement MySQL Group Replication

## Success Criteria

- All nodes accept writes and propagate correctly
- Node failure does not stop writes (majority remains)
- Split-brain prevented
- Write latency within acceptable range for all nodes
- Auto-increment configured without collisions
