# 7-10 Multi-Master Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-10 |
| Knowledge Unit Title | Multi-Master Replication |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.1 Master-replica topology | 7.11 Conflict resolution | 7.12 Multi-region replication |
| Last Updated | 2026-06-04 |

## Overview

Multi-master replication allows multiple database nodes to accept writes simultaneously. Technologies include Galera Cluster (synchronous), MySQL Group Replication (consensus-based), and PostgreSQL BDR (asynchronous). Provides higher write availability and multi-region writes at the cost of consistency guarantees.

---

## Core Concepts

- **Synchronous multi-master**: All nodes must agree on a write before commit. Write latency = max(all nodes). Examples: Galera, Group Replication.
- **Asynchronous multi-master**: Writes commit locally and replicate to other nodes. Conflict possible. Example: BDR, Tungsten.
- **Conflict detection**: Galera uses certification-based detection. Group Replication uses consensus protocol.
- **Flow control**: In Galera, slow nodes throttle fast nodes to prevent unbounded lag.
- **Auto-increment configuration**: Each node must have unique increment offset to prevent ID collisions.

## When To Use

- Write availability needed across multiple data centers
- Zero-downtime maintenance (failover any node without write interruption)
- Active-active disaster recovery

## When NOT To Use

- Strong consistency required for all writes
- Application cannot handle conflict resolution
- Single region — master-replica is simpler

## Best Practices

- Use odd number of nodes for quorum
- Configure auto-increment increment = N, offset = unique per node
- Test conflict resolution with concurrent writes before production

## Architecture Guidelines

| Technology | Sync/Async | Conflict Handling | Write Latency |
|------------|-----------|-------------------|---------------|
| Galera Cluster | Synchronous | First-Committer-Wins | Max(all nodes) |
| MySQL Group Replication | Semi-sync | Certification-based | Majority ack |
| PostgreSQL BDR | Asynchronous | Last-Write-Wins | Local only |
| Tungsten | Asynchronous | Application-level | Local only |

## Performance Considerations

- Synchronous multi-master: write latency determined by slowest node
- Flow control pauses writes if any node can't keep up
- Throughput degrades with each additional node

## Security Considerations

- All inter-node replication must be encrypted
- Nodes must authenticate to join cluster

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Auto-increment collisions | No per-node offset config | Duplicate key errors | Configure auto_increment_increment + offset |
| 2 | Cross-region sync replication | Ignoring latency impact | 50-200ms added to writes | Use async for cross-region |
| 3 | DDL on multi-master | Not using rolling schema | Cluster-wide locking | Use online DDL or rolling upgrade |

## Anti-Patterns

- Assuming all nodes are always consistent with async replication
- Using even number of nodes (split-brain risk)
- Applying schema changes without testing on multi-master

## Verification

- [ ] All nodes accept writes
- [ ] Conflict resolution works correctly
- [ ] Node failure doesn't impact other nodes' writes
- [ ] Auto-increment configured without collisions
