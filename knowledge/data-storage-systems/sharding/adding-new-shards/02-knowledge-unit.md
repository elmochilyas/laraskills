# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.12 Adding new shards (rehashing, double-writing during transition)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Adding a new shard increases cluster capacity. The transition period requires double-writing to both old and new shards until data is fully redistributed. Consistent hashing minimizes data movement (only 1/N moves). Modulo sharding requires a full rehash (all data moves).

---

# Core Concepts

- **Double-write**: Every write goes to both old shard(s) and new shard for the duration of migration. Read from old shard until cutover.
- **Backfill**: Copy existing data from old shard to new shard. `INSERT ... SELECT` with batch processing. Rate-limited.
- **Cutover**: Update shard map to route reads to new shard. Stop double-writing.

---

# Patterns

**Progressive migration**: Add one shard at a time. Monitor each addition before adding the next. Avoids cascading failures.

**Reversible cutover**: Keep old shards active for 48 hours post-cutover. If issues detected, revert shard map to old shards.

---

# Common Mistakes

**Adding multiple shards simultaneously**: Each new shard requires backfill from existing shards. Backfilling to 3 new shards simultaneously multiplies load.

---

# Related Knowledge Units

6.10 Shard rebalancing | 6.11 Shard splitting | 6.20 Consistent hashing
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

