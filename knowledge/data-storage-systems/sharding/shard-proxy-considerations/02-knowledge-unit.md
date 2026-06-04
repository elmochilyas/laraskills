# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.19 Shard proxy considerations (ProxySQL, Vitess)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Shard proxies (ProxySQL, Vitess, pgcat) sit between application and sharded databases. They handle query routing, connection pooling, read/write splitting, and some cross-shard query support. Vitess provides full SQL parsing and distributed query execution. ProxySQL provides intelligent connection routing and query rewriting.

---

# Core Concepts

- **ProxySQL**: MySQL proxy. Rule-based query routing, connection pooling, query caching, query rewriting. Can route queries by regex match on query text.
- **Vitess**: Full distributed database system. Horizontal sharding, automatic shard management, resharding, distributed queries (scatter/gather). VTGate + VTTablet architecture.
- **pgcat**: PostgreSQL proxy. Connection pooling, read/write splitting, sharding (PASS THROUGH). Lighter than Vitess.

---

# Patterns

**ProxySQL for connection pooling + routing**: Route reads to replicas, writes to primary. Shard routing via regex on query patterns.

**Vitess for multi-shard queries**: Vitess handles fan-out, cross-shard joins, distributed transactions. Application writes simple SQL.

---

# Common Mistakes

**Proxy as single point of failure**: Proxy must be highly available (ProxySQL cluster, Vitess with multiple VTGates). Proxy failure = total database outage.

---

# Related Knowledge Units

6.5 Shard routing | 6.7 Fan-out queries | 10.4 Connection pooling
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

