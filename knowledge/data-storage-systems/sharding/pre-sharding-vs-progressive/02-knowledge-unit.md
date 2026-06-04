# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.23 Pre-sharding vs. progressive sharding strategy
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Pre-sharding creates many shards from the start (e.g., 256 shards on 4 servers). Progressive sharding starts with few shards and splits as data grows. Pre-sharding avoids future rebalancing but wastes resources on empty shards. Progressive sharding saves initial cost but adds operational complexity of splits.

---

# Core Concepts

- **Pre-sharding**: Create N shards (e.g., 256) with many virtual shards per physical server. As data grows, move virtual shards to new servers without rebalancing.
- **Progressive sharding**: Start with 2-4 shards. Split hot shards as needed. Each split requires double-write + backfill + cutover.
- **Virtual shards in pre-sharding**: 256 logical shards map to 4 physical servers (64 each). Add server → reassign 64 virtual shards. No data movement.

---

# Patterns

**Pre-shard when growth is predictable**: SaaS with known user acquisition trajectory. Pre-shard for 5 years of growth. Avoids multiple rebalancing operations.

**Progressive when growth is unknown**: Startup with uncertain scaling needs. Start small, add shards as needed. Accept rebalancing complexity.

---

# Common Mistakes

**Under-sharding initially**: Starting with 2 shards. Both shards become hot within 6 months. Forced rebalance before team is ready.

---

# Related Knowledge Units

6.10 Shard rebalancing | 6.11 Shard splitting
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

