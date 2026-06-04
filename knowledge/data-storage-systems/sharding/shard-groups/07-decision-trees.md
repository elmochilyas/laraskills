# 6-13 Shard Groups - Decision Trees

## Shard Group Design

---

## Decision Context

Designing shard groups to co-locate related tables on the same physical shard — enabling efficient joins and transactions while maintaining even data distribution.

---

## Decision Criteria

* performance: within-group joins are single-shard (efficient); cross-group joins require fan-out
* architectural: groups co-locate data by shared shard key; tables in same group must share the shard key
* maintainability: too many groups → frequent cross-group joins; too few → large groups with uneven distribution

---

## Decision Tree

Frequently joined tables share a natural shard key (e.g., both have user_id)?

YES → Group by shared shard key

    ↓
    Group: users, orders, order_items, carts, reviews
    Shard key: user_id for all tables
    
    ↓
    Pro: All joins are within-shard
    Pro: All transactions stay on one shard
    Pro: Simple routing (same key for all)
    
    ↓
    Con: Tables without user_id can't join
    Con: Must denormalize or accept cross-group for other joins

NO → Tables have fundamentally different access patterns

    ↓
    Option A: Single group (all tables together)
    
        ↓
        All data co-located
        Join anything with anything — within-shard
        Con: One shard key fits all tables?
        Con: Very large groups may not distribute evenly

NO → Option B: Multiple groups

        ↓
        Group 1: user-centric (by user_id)
        Group 2: time-series logs (by created_at range)
        Group 3: reference data (global, replicated)
        
        ↓
        Within each group: joins work
        Cross-group: design around (application join, denormalization)
        
        ↓
        80%+ of joins should be within-group
        Document cross-group joins and their handling

---

## Recommended Default

**Default:** Single shard group per primary access pattern (user-centric, tenant-centric); global tables for reference data
**Reason:** Fewer groups mean fewer cross-group joins. Global tables are replicated to all shards to eliminate cross-group reference data joins.

---

## Global Tables for Cross-Group Joins

---

## Decision Context

Choosing whether to replicate reference/lookup tables to every shard as global tables — eliminating cross-group joins for read-only or infrequently updated data.

---

## Decision Criteria

* performance: local global table reads are within-shard and fast
* architectural: global tables are replicated to all shards; updates must propagate
* maintainability: replication mechanism adds complexity (queue, CDC, application-level sync)

---

## Decision Tree

Table is read-only or rarely updated (countries, categories, tax rates)?

YES → Replicate as global table to all shards

    ↓
    Benefits:
    - Join reference data within any shard (no cross-group)
    - No fan-out for reference data queries
    
    ↓
    Replication strategy:
    - Manual: deploy migration to all shards
    - Application: write to all shards on update
    - CDC: use change data capture for propagation
    
    ↓
    Tolerate: eventual consistency (seconds to minutes)
    Risk: stale reference data on some shards

NO → Table is write-heavy or frequently updated?

    YES → Avoid global table replication
        
        ↓
        Write amplification: N writes per update (one per shard)
        Consistency: hard to maintain across all shards
        
        ↓
        Alternative:
        - Single authoritative shard for this table
        - Application-level join (query auth shard + query target shard)
        - Denormalize frequently accessed fields into target tables

NO → Read-only but very large (> 1GB)?

    → Consider on-demand caching instead
    Memcached/Redis for reference data
    Cache miss: query single authoritative copy
    Faster than replicating large tables to all shards

---

## Recommended Default

**Default:** Global tables for small, rarely-changed reference data; maintain a single authoritative copy for large or frequently-updated tables
**Reason:** Global tables eliminate cross-group joins for reference data at the cost of write amplification. Write frequency determines viability.

---

## Related Rules

* Rule 6-13-1: Always Keep Related Data In Same Group
* Rule 6-13-2: Never Assume Cross-Group Joins Are Efficient

---

## Related Skills

* Implement Shard Groups
* Design Shard Group Assignment
