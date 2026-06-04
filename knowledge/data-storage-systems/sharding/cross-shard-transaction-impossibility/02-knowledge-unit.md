# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.9 Cross-shard transaction impossibility (distributed transaction complexity)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

ACID transactions across shards are not possible with standard database transactions. Distributed transactions require two-phase commit (2PC), which has high coordination overhead and failure modes. Most sharded systems avoid cross-shard transactions entirely by designing shard key and data model so that all transactionally-related data lives on the same shard.

---

# Core Concepts

- **2PC (two-phase commit)**: Prepare phase (all shards agree to commit) → Commit phase (all shards commit). If any shard fails during prepare, all shards abort.
- **Coordinator failure**: If the coordinator crashes after prepare but before commit, shards hold locks indefinitely (in-doubt transactions).
- **Compensating transactions (Saga)**: For distributed operations, use Saga pattern: execute local transactions per shard, run compensating actions on failure.

---

# Patterns

**Saga pattern**: Choreography (each shard emits events, next shard reacts) or Orchestration (coordinator calls each shard sequentially, runs compensating txn on failure).

**Single-shard transaction**: Design data model so all related data has the same shard key. Transaction stays on one shard.

---

# Common Mistakes

**Assuming distributed transactions work like local transactions**: Network partitions, coordinator failures, and partial commits make 2PC unreliable. Avoid cross-shard transactions.

---

# Related Knowledge Units

9.1 Database transactions | 6.1 Shard key | 6.13 Shard groups
## Ecosystem Usage

Horizontal sharding in Laravel is less common than single-node strategies. Custom implementations handle shard routing. Vitess provides proxy-based MySQL sharding. Citus enables distributed PostgreSQL.

## Failure Modes

Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Performance Considerations

Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Production Considerations

Pre-sharding vs progressive sharding tradeoff. Consistent hashing minimizes data movement. Global tables must be replicated to all shards. Monitor per-shard load.

## Research Notes

Vitess adoption grows for MySQL sharding. Citus/PostgreSQL is the leading open-source distributed SQL. Most Laravel applications outgrow single-node before reaching sharding scale.

## Internal Mechanics

Hash-based routing: shard = hash(key) mod N. Directory-based routing uses a lookup table. Range-based assigns key ranges to shards.

## Architectural Decisions

Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Tradeoffs

Benefit: Horizontal scaling. Cost: Query complexity. Benefit: Independent failures. Cost: Cross-shard join impossible. Benefit: Cost-effective scaling. Cost: Operational complexity.

## Mental Models

Sharding is horizontal partitioning across servers. Each shard is an independent database. The shard key determines data locality.

