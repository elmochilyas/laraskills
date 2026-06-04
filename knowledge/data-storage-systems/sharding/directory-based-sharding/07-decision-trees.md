# 6-4 Directory Based Sharding - Decision Trees

## Hash vs Directory Based Sharding

---

## Decision Context

Choosing between hash-based (algorithmic routing) and directory-based (lookup table) sharding — balancing routing simplicity against rebalancing flexibility.

---

## Decision Criteria

* performance: hash routing is direct (no extra hop); directory adds 1-5ms lookup per query
* architectural: hash remaps all keys on N change; directory updates mapping per key
* maintainability: hash is simpler to implement; directory requires HA lookup table

---

## Decision Tree

Does the shard key need to change over time (remap existing keys to new shards)?

YES → Use directory-based sharding

    ↓
    Lookup table maps key → shard_id
    Update mapping → key routes to new shard immediately
    
    ↓
    Pro: Maximum flexibility — any key can move to any shard
    Pro: No data movement required for routing changes
    
    ↓
    Con: Every query requires a lookup (latency)
    Con: Lookup table is a single point of failure (must be HA)
    Con: Directory can grow large (100M+ entries GBs of data)

NO → Fixed shard key, no remapping needed?

    ↓
    Shard count changes frequently?
    
    YES → Use consistent hashing (ring-based)
        Minimal data movement on N change
        No lookup table needed
        Still needs management of virtual nodes
        
    NO → Fixed shard count?
        
        → Use modulo hashing
        Simple, fast, deterministic
        N change requires full re-shard

---

## Recommended Default

**Default:** Modulo hashing for most cases; directory-based only when per-key remapping flexibility is required
**Reason:** Directory-based adds a lookup hop and HA complexity. Only justified when hash-based approaches can't meet remapping requirements.

---

## Shard Map Storage and Caching

---

## Decision Context

Choosing the storage backend and caching strategy for a directory-based shard map — balancing lookup latency, availability, and staleness tolerance.

---

## Decision Criteria

* performance: in-memory cache is fastest; Redis adds network hop; DB lookup is slowest
* architectural: cache may serve stale data during rebalancing; DB lookup is always fresh
* maintainability: multi-layer caching adds complexity but improves reliability

---

## Decision Tree

Number of unique keys to track in shard map:

↓

< 100,000 keys (fits in application memory)?

    YES → Load entire map into application memory at boot
        
        ↓
        Fastest: < 0.1ms lookup
        Use LRU cache with 60s TTL for updates
        
        ↓
        Pro: Zero network hop for routing
        Pro: Survives lookup table outage (stale but functional)
        
        ↓
        On rebalance: invalidate cache, reload from database

100,000 — 10 million keys?

    YES → Use Redis cluster for shard map storage
        
        ↓
        Redis hash: HSET shard:map key_hash shard_id
        Get: HGET shard:map key_hash → 1-2ms
        
        ↓
        Local L1 cache (1s TTL) → Redis L2 (60s TTL)
        P99 lookup: 0.1ms (L1) / 2ms (Redis)
        
        ↓
        Redis Sentinel or Cluster for HA

> 10 million keys?

    → Consider hash-based sharding instead
    Directory with 10M+ entries adds significant operational overhead
    Each entry ~50 bytes → 500MB+ for the directory alone
    Consistent hashing is likely a better fit

---

## Recommended Default

**Default:** Redis-backed shard map with local L1 cache for <10M keys; load entire map into memory for <100K keys
**Reason:** Cache eliminates the lookup hop latency for hot keys. Hierarchical caching balances speed vs freshness.

---

## Related Rules

* Rule 6-4-1: Always Cache Shard Map Lookups
* Rule 6-4-2: Never Allow Stale Map Entries After Migration

---

## Related Skills

* Implement Directory-Based Sharding
* Build a Highly Available Shard Map
