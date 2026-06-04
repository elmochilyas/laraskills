# 6-9 Cross Shard Transaction Impossibility

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-9 |
| Knowledge Unit Title | Cross Shard Transaction Impossibility |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 9.1 Database transactions | 6.1 Shard key | 6.13 Shard groups |
| Last Updated | 2026-06-02 |

## Overview

ACID transactions across shards are not possible with standard database transactions. Distributed transactions require two-phase commit (2PC), which has high coordination overhead and failure modes. Most sharded systems avoid cross-shard transactions entirely by designing shard key and data model so that all transactionally-related data lives on the same shard.

---

## Core Concepts

- **2PC (two-phase commit)**: Prepare phase (all shards agree to commit) → Commit phase (all shards commit). If any shard fails during prepare, all shards abort.
- **Coordinator failure**: If the coordinator crashes after prepare but before commit, shards hold locks indefinitely (in-doubt transactions).
- **Compensating transactions (Saga)**: For distributed operations, use Saga pattern: execute local transactions per shard, run compensating actions on failure.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Saga pattern**: Choreography (each shard emits events, next shard reacts) or Orchestration (coordinator calls each shard sequentially, runs compensating txn on failure).
- **Single-shard transaction**: Design data model so all related data has the same shard key. Transaction stays on one shard.


## Architecture Guidelines

- Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Performance Considerations

- Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming distributed transactions work like local transactions**: Network partitions, coordinator failures, and partial commits make 2PC unreliable. Avoid cross-shard transactions. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Database Sharding & Horizontal Scaling
- **Closely Related**: Other KUs within Database Sharding & Horizontal Scaling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

