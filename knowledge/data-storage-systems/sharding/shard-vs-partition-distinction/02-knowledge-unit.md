# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.22 Shard vs. partition distinction (shard = separate server, partition = within same server)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Sharding = horizontal splitting across servers. Partitioning = horizontal splitting within a single database. Sharding solves server-level scaling (more data than one server can hold). Partitioning solves table-level management (archival, query pruning). They are complementary — a partitioned table can exist on a shard.

---

# Core Concepts

- **Shard**: A complete database server (or replica set). Independent CPU, memory, storage, network. Data split across servers.
- **Partition**: A division within a single database (MySQL `PARTITION BY RANGE`, PostgreSQL `PARTITION BY RANGE`). Same server.
- **Key difference**: Shards are independent failure domains and compute resources. Partitions share the same server resources.

---

# Patterns

**Shard + partition**: Shard by `user_id`. Within each shard, partition `orders` by `created_at` for archival. Each partition drop is fast (metadata only).

**Partition first, shard later**: Start with partitioning on a single server. When the server is outgrown, shard across multiple servers.

---

# Common Mistakes

**Using "sharding" and "partitioning" interchangeably**: They solve different problems at different scales. Clear terminology matters for architecture decisions.

---

# Related Knowledge Units

6.1 Shard key selection | 8.1 Table partitioning
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

