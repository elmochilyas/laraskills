# 6-8 Cross Shard Join Limitations - Decision Trees

## Co-Location vs Denormalization vs Application Join

---

## Decision Context

Choosing the best strategy to handle joins across shards: co-location (same shard key on both tables), denormalization (duplicate data), or application-level joins (separate queries in code).

---

## Decision Criteria

* performance: co-location is fastest (single query); denormalization trades writes for reads; app joins add queries
* architectural: co-location requires same shard key; denormalization adds data redundancy; app joins add code
* maintainability: co-location is design-time; denormalization needs sync logic; app joins are explicit

---

## Decision Tree

Can both tables use the same shard key (e.g., both sharded by user_id)?

YES → Co-location (preferred)

    ↓
    Shard both tables by same key: user_id
    Join on user_id stays within a single shard
    
    ↓
    Pro: Standard SQL JOIN — works natively
    Pro: Single query, no application complexity
    Pro: Transactional consistency (same shard)
    
    ↓
    Con: Requires design alignment from the start
    Con: Some tables may not have the shard key column

NO → Tables have different shard keys

    ↓
    Is the relationship read-heavy (many reads, few writes)?
    
    YES → Denormalization
        
        ↓
        Store frequently joined fields redundant on both tables
        Example: store user_name on orders table
        
        ↓
        Pro: Fast reads (data already in same shard)
        Pro: No application-level queries needed
        
        ↓
        Con: Slower writes (must update multiple copies)
        Con: Eventual consistency risk
        Con: Increased storage

NO → Write-heavy or complex relationships?

    ↓
    Application-level join
    
        ↓
        Step 1: Query shard A for parent rows
        Step 2: Collect foreign key values
        Step 3: Fan-out query to relevant shards for child rows
        Step 4: Assemble in PHP
        
        ↓
        Pro: No data redundancy
        Pro: Always consistent (reads from source)
        Pro: Works with any shard key combination
        
        ↓
        Con: 2+ round trips
        Con: Fan-out may query all shards
        Con: More code to maintain

---

## Recommended Default

**Default:** Co-location when possible, then application-level join, then denormalization
**Reason:** Co-location is zero-overhead. Application joins are explicit and consistent. Denormalization has the highest maintenance cost.

---

## N+1 Query Prevention

---

## Decision Context

Preventing N+1 query patterns when performing application-level joins across shards — where fetching parent rows and then querying related rows for each creates excessive queries.

---

## Decision Criteria

* performance: N+1 = 1 + N × M queries; batched = 1 + N queries
* architectural: requires collecting keys before querying
* maintainability: batch query is slightly more complex but far more efficient

---

## Decision Tree

Application-level join scenario:

Parent rows loaded from shard A

↓

How many child rows to load per parent?

↓

Single child per parent (hasOne, belongsTo)?

    ↓
    Collect all foreign keys → single fan-out
    
    ↓
    Example:
    $orders = query shard A
    $userIds = $orders->pluck('user_id')
    $users = fan-out query all shards with WHERE user_id IN ($userIds)
    
    ↓
    Queries: 1 (parent) + N_shards (fan-out) = ~5-10 queries
    Instead of: 1 + 1000 (one per order) = 1001 queries

Multiple children per parent (hasMany)?

    ↓
    Collect parent keys → single fan-out per entity type
    
    ↓
    Example:
    $users = query shard A (or fan-out)
    $userIds = $users->pluck('id')
    $orders = fan-out query with WHERE user_id IN ($userigeId)
    
    ↓
    Hydrate: group orders by user in PHP
    Attach to each user object

Not using application join?

    → No N+1 risk
    Co-location or denormalization covers this

---

## Recommended Default

**Default:** Always batch foreign keys into a single IN() fan-out query instead of per-row queries
**Reason:** N+1 scales linearly with data and kills performance. Batching keeps queries constant regardless of result size.

---

## Related Rules

* Rule 6-8-1: Always Co-Locate Joinable Data
* Rule 6-8-2: Never Execute Cross-Shard Joins

---

## Related Skills

* Handle Cross-Shard Join Limitations
* Denormalize Data to Avoid Cross-Shard Joins
