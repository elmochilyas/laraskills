# 7-20 Peer-to-Peer Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-20 |
| Knowledge Unit Title | Peer-to-Peer Replication |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.10 Multi-master replication | 7.11 Conflict resolution |
| Last Updated | 2026-06-04 |

## Overview

Peer-to-peer (P2P) replication creates a fully distributed topology where all nodes are equal and can accept writes. Technologies include Galera Cluster (synchronous, MySQL/MariaDB), MySQL Group Replication (consensus-based), and PostgreSQL BDR (asynchronous). P2P provides high availability with no single point of failure but requires quorum for writes.

---

## Core Concepts

- **Quorum**: Minimum number of nodes (N/2 + 1) required for write acceptance. Prevents split-brain.
- **Flow control**: Galera throttles fast nodes when slow nodes can't keep up.
- **State transfer**: IST (Incremental) is faster than SST (Snapshot) for rejoining nodes.
- **Certification**: Galera certifies each write on all nodes before committing.
- **Consensus**: Group Replication uses Paxos-like protocol for transaction ordering.
- **Auto-increment**: Must be configured with increment=N and unique offset per node.

## When To Use

- Active-active writes across multiple nodes
- No single point of failure for writes
- Edge computing with local writes per node

## When NOT To Use

- Master-replica topology is sufficient
- Strong consistency required (use sync P2P)
- Application can't handle conflict resolution

## Best Practices

- Use odd number of nodes (3 or 5) for quorum
- Configure auto-increment per node
- Monitor cluster size, quorum, and flow control

## Architecture Guidelines

| Technology | Sync/Async | Consistency | Write Latency | Node Limit |
|------------|-----------|-------------|---------------|------------|
| Galera Cluster | Synchronous | Strong | Max(all nodes) | 8-16 nodes |
| Group Replication | Semi-sync | Strong (majority) | Majority ack | 9 nodes |
| PostgreSQL BDR | Asynchronous | Eventual | Local only | 8-12 nodes |
| Cassandra | Tunable | Configurable | Local + consistency level | 100+ nodes |

## Performance Considerations

- Write latency = max(time to certify/commit on all nodes)
- Throughput degrades as more nodes added
- Network latency directly impacts write performance

## Security Considerations

- All inter-node communication must be encrypted
- Node authentication to prevent unauthorized joins
- SST exposes all data — must be authenticated

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Even number of nodes | Cost optimization | Split-brain risk | Add witness or use odd count |
| 2 | Auto-increment collisions | Default config | Duplicate key errors | Configure increment + offset |
| 3 | Quorum loss wrong recovery | Reconnecting incorrectly | Data divergence | Follow vendor recovery steps |

## Anti-Patterns

- Using even number of nodes without witness
- Ignoring flow control warnings
- Reconnecting partitioned nodes without checking GTID consistency

## Verification

- [ ] All nodes accept writes
- [ ] Writes propagate to all nodes
- [ ] Node failure doesn't stop writes (majority remains)
- [ ] Split-brain prevented
- [ ] Auto-increment configured correctly
