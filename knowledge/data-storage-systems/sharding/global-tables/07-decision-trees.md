# 6-25 Global Tables - Decision Trees

## What Goes Global

---

## Decision Context

Determining which tables should be replicated as global tables to all shards — reference/lookup data that is small, rarely updated, and frequently joined with sharded tables.

---

## Decision Criteria

* performance: global tables enable local JOINs; each replicated copy adds storage cost
* architectural: global table replication adds write amplification on every update
* maintainability: more global tables = more replication management

---

## Decision Tree

Table characteristics:

↓

Is the table SMALL (< 1000 rows)?

NO → Table is too large for global replication

    ↓
    More storage per shard × shard count = excessive
    Consider: denormalization or application-level join instead
    
    ↓
    Example: 10,000 rows × 16 shards = 160,000 redundant rows
    Better to query from single authoritative source with caching

YES → Is the table RARELY UPDATED (less than once per hour)?

    NO → High write frequency
        ↓
        Write amplification: 1 write = N writes (one per shard)
        Consider: cache in Redis instead of database replication
        
        ↓
        Example: 1 write/sec × 16 shards = 16 writes/sec
        Redis: 1 write to Redis, all shards read from cache

YES → Is the table FREQUENTLY JOINED with sharded data?

    YES → Good candidate for global table
        
        ↓
        Examples: countries, currencies, categories, tax rates, status codes
        
        ↓
        Replicate to all shards
        JOIN on local shard — no cross-shard query
        
        ↓
        Accept eventual consistency (seconds to minutes)

NO → Rarely joined or used independently?

    → Keep on single shard (not global)
    Query via fan-out or dedicated connection
    Global replication not worth the complexity

---

## Recommended Default

**Default:** Globalize only small (< 1K rows), rarely-updated (< 1/hr), frequently-joined tables
**Reason:** Each global table multiplies storage by shard count and adds write amplification. Only pay this cost for tables that provide clear benefit (eliminating cross-shard joins).

---

## Replication Method

---

## Decision Context

Choosing the replication method for global tables — application-level write-to-all, CDC (Debezium/Kafka), or Redis cache-as-global-table.

---

## Decision Criteria

* performance: Redis cache has lowest latency; CDC adds pipeline delay; app-level adds write latency
* architectural: app-level is simplest; CDC is decoupled; Redis is infrastructure
* maintainability: app-level needs shard list management; CDC requires Kafka expertise

---

## Decision Tree

Update frequency:

↓

Very infrequent (daily/weekly data refresh)?

    → Use scheduled refresh
    CRON job: UPDATE all_shards SET ... WHERE ...
    Simplest approach
    Acceptable staleness: hours to days

Infrequent (hourly)?

    ↓
    Use application-level write-to-all
    
    ↓
    On update: dispatch queue jobs to all shards
    Each job writes to its target shard
    
    ↓
    Pro: Simple to implement
    Pro: Queued — doesn't block the response
    Pro: Retry on failure
    
    ↓
    Con: Write amplification (N shard writes per update)
    Con: Temporary inconsistency during propagation

Frequent (sub-minute updates)?

    ↓
    Use CDC (Debezium + Kafka)
    
    ↓
    Capture changes from authoritative source via binlog
    Stream to Kafka → consumer updates all shards
    
    ↓
    Pro: Decoupled from application
    Pro: Reliable change capture
    Pro: Can fan-out to other systems (search, cache)

NOT a database table — key-value reference data?

    → Use Redis cache as global table
    All shards read reference data from Redis
    No database replication needed
    Redis as source of truth for reference data

---

## Recommended Default

**Default:** Application-level queue-based write-to-all for infrequent updates; CDC for frequent updates; Redis cache for key-value reference data
**Reason:** App-level is simplest and works for most reference data. CDC is worth the complexity when updates are frequent. Redis avoids database replication entirely.

---

## Related Rules

* Rule 6-25-1: Always Replicate Global Data To All Shards
* Rule 6-25-2: Never Allow Cross-Shard Joins For Global Data

---

## Related Skills

* Implement Global Tables
* Implement Application-Level Global Table Replication
