# Metadata

Domain: Data & Storage Systems
Subdomain: Database Sharding & Horizontal Scaling
Knowledge Unit: 6.13 Shard groups (co-located tables that share shard key for joins)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Shard groups co-locate tables that share the same shard key on the same physical shard. Tables in the same shard group support JOINs on the shard key without cross-shard overhead. Essential for relational data models in sharded environments.

---

# Core Concepts

- **Shared shard key**: `users` and `orders` both sharded by `user_id`. A user's data and their orders are on the same shard. `JOIN users ON orders.user_id = users.id` stays within shard.
- **Co-location**: Elasticsearch term is "routing". Vitess calls it "shard group" or "colocation". Same concept: related data stays together.
- **Cross-group joins**: Tables in different shard groups require fan-out queries. Design groups carefully.

---

# Patterns

**User-centric shard group**: `users, orders, order_items, carts, reviews` all sharded by `user_id`. All user-related queries are single-shard.

**Tenant-centric shard group**: Multi-tenant SaaS: all tables sharded by `tenant_id`. All tenant queries are single-shard.

---

# Common Mistakes

**Random shard key per table**: `users` by `user_id`, `orders` by `order_id` — no table shares a shard key. Every join is cross-shard.

---

# Related Knowledge Units

6.1 Shard key | 6.8 Cross-shard joins | 6.14 Shard model traits
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

