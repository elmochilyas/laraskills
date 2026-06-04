# 6-23 Pre Sharding Vs Progressive - Decision Trees

## Pre-Sharding vs Progressive Selection

---

## Decision Context

Choosing between pre-sharding (creating many shards upfront, most dormant) and progressive sharding (starting with few shards and splitting as data grows) based on growth predictability.

---

## Decision Criteria

* performance: pre-sharding avoids rebalancing overhead; progressive pays rebalancing cost per split
* architectural: pre-sharding has dormant infrastructure cost; progressive pays-as-you-grow
* maintainability: pre-sharding requires upfront planning; progressive requires rebalancing automation

---

## Decision Tree

Is data growth predictable (known trajectory, reliable projections)?

YES → Use pre-sharding

    ↓
    Project growth for 3-5 years → determine max shard count
    Create 256 or 1024 logical shards upfront
    Map many logical shards to few physical servers initially
    
    ↓
    As data grows: reassign logical shards to new physical servers
    No data movement — just update mapping
    
    ↓
    Pro: Zero rebalancing overhead during growth
    Pro: Smooth capacity expansion
    Pro: Predictable scaling path
    
    ↓
    Con: Infrastructure cost for dormant capacity
    Con: Requires accurate long-term projections

NO → Growth is uncertain or startup stage?

    ↓
    Use progressive sharding
    
    ↓
    Start with 2-4 shards
    Monitor utilization
    Split hot shards as needed
    
    ↓
    Pro: Lower initial cost (start small)
    Pro: Adapts to actual growth
    Pro: No over-provisioning
    
    ↓
    Con: Rebalancing required for each split
    Con: Risk of hitting capacity before new shard is ready
    Con: Split adds operational load

Hybrid approach:

↓

Moderate certainty, want flexibility?

    → Pre-shard with moderate count (64)
    Start with 4 active shards, 60 dormant
    Activate dormant shards as needed
    Balance of upfront cost and scalability

---

## Recommended Default

**Default:** Pre-sharding (256 logical shards) for predictable growth; progressive (start with 2-4) for uncertain growth
**Reason:** Pre-sharding eliminates production rebalancing. Progressive is better when growth projections are unreliable.

---

## Pre-Shard Count Determination

---

## Decision Context

Determining the optimal number of logical shards to create upfront in a pre-sharded architecture — balancing granularity against management overhead.

---

## Decision Criteria

* performance: more logical shards = finer granularity = smoother scaling
* architectural: logical shards are mapping entries, not physical servers
* maintainability: too many logical shards = large mapping table; too few = premature rebalancing

---

## Decision Tree

Projected maximum data volume (3-5 years):

↓

< 100GB total?

    → 64 logical shards (maybe overkill — consider progressive instead)
    Fine granularity: < 2GB per logical shard
    May be too complex for this data volume

100GB — 1TB?

    → 256 logical shards
    Each shard: ~4GB max
    Good granularity for scaling

1TB — 10TB?

    → 1024 logical shards
    Each shard: ~10GB max
    Fine enough to migrate in reasonable batches

> 10TB?

    → 4096 logical shards
    Each shard: ~2.5GB per TB
    Very fine granularity for large-scale systems

Physical server count:

↓

Start with 4 physical servers

    Map 256 logical shards: 64 per server
    When servers reach 70% utilization:
    → Add 5th server → reassign 51 logical shards
    → Add 6th server → reassign another 43
    No data movement — just mapping change

---

## Recommended Default

**Default:** 256 logical shards for most applications; scale to 1024 or 4096 for very large systems
**Reason:** 256 provides fine granularity (smooth scaling) without excessive mapping overhead (small array).

---

## Related Rules

* Rule 6-23-1: Always Plan Shard Growth Before Implementation
* Rule 6-23-2: Never Start Progressive Without Rebalancing Automation

---

## Related Skills

* Choose Between Pre-Sharding and Progressive Sharding
* Implement Pre-Sharding Strategy
