# 6-15 Sharding Packages - Decision Trees

## Package vs Custom vs Infrastructure

---

## Decision Context

Choosing between using a Laravel sharding package (allnetru/laravel-sharding), building a custom implementation, or adopting an infrastructure sharding solution (Vitess, Spanner).

---

## Decision Criteria

* performance: custom implementation is optimized for specific needs; infrastructure solution adds proxy overhead
* architectural: package handles routing and ID generation; infrastructure handles cross-shard queries transparently
* maintainability: custom requires team expertise; infrastructure is managed; package has community support

---

## Decision Tree

Does the application need complex cross-shard query support (distributed joins, subqueries)?

YES → Use infrastructure solution (Vitess/Spanner)

    ↓
    Vitess: MySQL-compatible sharding proxy
    - Cross-shard joins handled by Vitess query engine
    - Application writes standard SQL
    - Managed rebalancing
    
    ↓
    Spanner: Fully managed (Google Cloud)
    - Global, strongly consistent
    - No sharding concerns for application
    - Higher cost

NO → Simple sharding (routing + fan-out + ID generation)?

    ↓
    Use allnetru/laravel-sharding package
    
    ↓
    Features:
    - Hash, range, db_range, Redis strategies
    - Snowflake ID generation
    - Coroutine-aware fan-out (Octane/Swoole)
    - Eloquent model trait integration
    
    ↓
    Pro: Faster to implement than custom
    Pro: Tested by community
    Pro: Covers most use cases

NO → Very specific routing requirements?

    → Build custom implementation
    Full control over routing logic
    No package constraints
    Must build: router, ID generation, fan-out, rebalancing

Team expertise:

↓

Team experienced with sharding?

YES → Custom or package both viable

NO → Prefer package for faster onboarding

---

## Recommended Default

**Default:** allnetru/laravel-sharding package for most Laravel applications; Vitess for cross-shard query needs; custom only for very specific requirements
**Reason:** The package handles the 80% case (routing, IDs, fan-out). Infrastructure handles cross-shard complexity. Custom is rarely worth the maintenance cost.

---

## Strategy Selection Per Model

---

## Decision Context

Choosing different sharding strategies for different models — e.g., hash-based for user-centric tables and range-based for time-series data.

---

## Decision Criteria

* performance: hash distributes evenly; range supports efficient time-range scans
* architectural: different strategies can coexist; each model type chooses its best fit
* maintainability: multiple strategies increase routing complexity

---

## Decision Tree

Model type:

↓

User-centric data (users, orders, carts)?

    YES → Hash-based sharding by user_id
        
        ↓
        Even distribution across shards
        All user data co-located (same shard key)
        Predictable routing (hash user_id)

Time-series or log data?

    YES → Range-based sharding by time
        
        ↓
        Efficient date-range queries (single shard)
        Natural data lifecycle (archive old ranges)
        Hot shard on current time range (accept or mitigate with pre-splitting)

Reference or lookup tables (countries, categories)?

    → Global table (replicated to all shards)
    No sharding needed — all shards have a copy
    Ensure update propagation

Bulk/analytics data?

    → db_range strategy
    Dynamic range management
    Ranges split and merge automatically
    Good for unpredictable growth

---

## Recommended Default

**Default:** Hash-based for user/tenant data; range-based for time-series; global tables for reference data
**Reason:** Each strategy matches its data's access pattern. Hash for even distribution, range for sequential access, global for reference.

---

## Related Rules

* (No specific rules — use sharding best practices)

---

## Related Skills

* Evaluate Sharding Packages and Libraries
* Build Custom Laravel Sharding Implementation
* Implement Hash-Based Sharding
* Implement Range-Based Sharding
