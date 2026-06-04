# 6-20 Modulus Vs Consistent Hashing - Decision Trees

## Modulus vs Consistent Hashing Selection

---

## Decision Context

Choosing between modulo sharding (`hash(key) % N`) and consistent hashing (ring-based) for distributing keys across shards — primarily determined by whether shard count will change.

---

## Decision Criteria

* performance: modulo is O(1) routing; consistent hashing is O(log V) with binary search
* architectural: modulo remaps ALL keys on N change; consistent hashing remaps ~1/N
* maintainability: modulo is trivial to implement; consistent hashing needs virtual nodes

---

## Decision Tree

Will the shard count change over the system's lifetime?

NO → Fixed shard count — NEVER changes

    YES → Use modulo
        
        ↓
        shard_id = crc32(key) % N
        N is fixed (e.g., 16)
        
        ↓
        Pro: Simple, O(1), easy to reason about
        Pro: No virtual node management
        Pro: Even distribution with good hash function
        
        ↓
        Con: If N changes, ALL data must move

YES → Shard count will change (add/remove shards)

    ↓
    Use consistent hashing (ring-based)
    
    ↓
    Keys are placed on a hash ring
    Each shard owns a ring segment
    Adding a shard: splits one segment → 1/N of keys move
    
    ↓
    Data movement comparison:
    4 shards → 5 shards:
    - Modulo: 100% of keys move
    - Consistent: 25% of keys move
    
    16 shards → 17 shards:
    - Modulo: 100% of keys move
    - Consistent: ~6% of keys move
    
    ↓
    Pro: Elastic scaling with minimal data movement
    
    ↓
    Con: More complex implementation
    Con: Needs 100+ virtual nodes per shard for even distribution
    Con: Slightly slower routing

Virtual node count decision:

↓

Expected shard count:

    < 10 shards → 100 virtual nodes per shard
    10-50 shards → 200 virtual nodes per shard
    > 50 shards → 500 virtual nodes per shard

---

## Recommended Default

**Default:** Modulo for fixed shard count; consistent hashing (with 100+ virtual nodes per shard) for elastic scaling
**Reason:** Modulo is simpler and sufficient when N is fixed. Consistent hashing's complexity pays off when shards are added or removed.

---

## Virtual Node Distribution Tuning

---

## Decision Context

Tuning virtual node count for consistent hashing to ensure even key distribution across physical shards — avoiding hot shards due to uneven hash ring coverage.

---

## Decision Criteria

* performance: more virtual nodes = better distribution + more memory
* architectural: virtual nodes increase routing table size
* maintainability: too few virtual nodes → uneven distribution requiring manual rebalancing

---

## Decision Tree

Number of virtual nodes per physical shard:

↓

< 50 virtual nodes per shard?

    YES → Distribution will be uneven
        
        ↓
        With 10 physical shards × 50 virtual nodes = 500 ring entries
        Expected: ±15% from uniform
        
        ↓
        Risk: some shards get 40% more keys than others
        Solution: increase virtual node count

50-200 virtual nodes per shard?

    YES → Acceptable distribution
        
        ↓
        With 10 shards × 100 virtual nodes = 1000 ring entries
        Expected: ±5% from uniform
        
        ↓
        Good balance of memory and distribution quality
        Recommended range for most deployments

> 200 virtual nodes per shard?

    → Excellent distribution
    With 10 shards × 500 = 5000 ring entries
    Expected: ±1% from uniform
    Memory: ~5000 × 12 bytes = 60KB — negligible

Adding a new shard with virtual nodes:

↓

Add shard → assign virtual nodes to ring positions

    ↓
    New shard's virtual nodes interleave with existing ones
    Each existing shard loses ~1/(N+1) of its ring coverage
    
    ↓
    More virtual nodes = smoother redistribution
    Rare: after adding, check distribution and adjust if needed

---

## Recommended Default

**Default:** 100 virtual nodes per physical shard; increase to 500 if precise distribution (±1%) is required
**Reason:** 100 virtual nodes per shard provides ±5% uniformity with minimal memory. 500 is overkill for most use cases.

---

## Related Rules

* Rule 6-20-1: Always Test Shard Count Change Impact
* Rule 6-20-2: Never Use Modulo If Shard Count Changes Frequently

---

## Related Skills

* Choose Between Modulus and Consistent Hashing
* Implement Consistent Hashing
