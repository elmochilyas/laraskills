# Skill: Choose Between Pre-Sharding and Progressive Sharding

## Purpose

Decide whether to pre-shard (start with many shards from the beginning) or progressively shard (start small, grow shards as needed) based on growth projections and operational complexity.

## When To Use

- Designing sharded architecture for a new application
- Evaluating sharding strategy for an existing application
- Considering long-term sharding approach

## When NOT To Use

- Non-sharded architecture
- Sharding decision already made and implemented

## Prerequisites

- Growth projections (users, data volume, throughput)
- Understanding of sharding operational complexity

## Inputs

- Current and 3-year projected data volume
- Current and 3-year projected throughput
- Operational budget for shard management

## Workflow (numbered steps)

1. Pre-sharding approach:
   - Start with N shards (e.g., 64, 256, 1024) from day one
   - Only a few shards initially active; rest are dormant
   - As data grows, activate more shards via virtual bucket reassignment
   - Pros: no rebalancing needed, predictable scaling
   - Cons: infrastructure cost for dormant shards, upfront complexity
2. Progressive sharding approach:
   - Start with a single database (or 2-4 shards)
   - Add shards as data grows
   - Each addition requires data rebalancing
   - Pros: lower initial complexity, pay-as-you-grow
   - Cons: rebalancing required, risk of hitting capacity before new shard ready
3. Choose based on:
   - Growth certainty: certain → pre-shard; uncertain → progressive
   - Infrastructure budget: generous → pre-shard; limited → progressive
   - Team expertise: experienced → either; limited → progressive

## Validation Checklist

- [ ] Chosen approach aligns with growth projections
- [ ] Infrastructure budget matches approach requirements
- [ ] Rebalancing strategy defined (if progressive)
- [ ] Dormant shard management defined (if pre-sharding)

## Common Failures

- Pre-sharding with too many shards — waste of resources
- Progressive sharding — capacity exceeded before new shard ready
- Pre-sharding with too few shards — need to rebalance anyway

## Decision Points

- Pre-shard count (power of 2: 64, 256, 1024)
- Progressive shard growth rate

## Performance Considerations

- Pre-sharding: no rebalancing overhead, waste of dormant resources
- Progressive: lower initial cost, periodic rebalancing overhead
- Rebalancing cost: time, bandwidth, risk of data inconsistency

## Security Considerations

- Dormant shards must still be secured
- Rebalancing data in transit must be encrypted

## Related Rules

- 6-23-1: Always Plan Shard Growth Before Implementation
- 6-23-2: Never Start Progressive Without Rebalancing Automation

## Related Skills

- Implement Pre-Sharding
- Implement Progressive Sharding
- Implement Shard Rebalancing

## Success Criteria

- Chosen approach supports projected growth without major architecture change
- Rebalancing (if needed) is automated and tested
- Infrastructure cost is within budget

---

# Skill: Implement Pre-Sharding Strategy

## Purpose

Design and implement a pre-sharded database architecture that starts with many shards (many dormant) and activates them as data grows.

## When To Use

- Certainty about long-term growth requiring many shards
- Operational budget for pre-provisioned infrastructure
- Want to avoid production rebalancing

## When NOT To Use

- Growth projections are uncertain
- Infrastructure cost for dormant shards is prohibitive
- Progressive sharding is sufficient for expected growth

## Prerequisites

- Virtual bucket or directory-based sharding
- Pre-provisioned database infrastructure
- Projected shard count for 3-5 years

## Inputs

- Pre-determined virtual bucket count (e.g., 4096)
- Bucket-to-shard mapping (initially many buckets per active shard)
- Active and dormant shard management plan

## Workflow (numbered steps)

1. Determine total shard capacity needed for 3-5 years (e.g., 256 shards)
2. Provision infrastructure for all 256 shards (or use database-per-shard within logical servers)
3. Initially map all virtual buckets to a small number of active shards (e.g., 4 of 256)
4. As data grows, reassign bucket ranges to inactive shards
5. Each reassignment requires data migration for reassigned buckets
6. Monitor shard utilization and activate dormant shards before active shards reach capacity

## Validation Checklist

- [ ] Pre-determined shard count covers 3-5 year projection
- [ ] Dormant shards are provisioned but unused
- [ ] Activation process is automated and tested
- [ ] Bucket reassignment triggers correct data migration

## Common Failures

- Pre-sharded too few shards — need to add more (same as progressive)
- Dormant shards consume resources unnecessarily
- Activation process not tested — fails when needed

## Decision Points

- Number of pre-shards vs just-in-time provisioning
- Active-to-dormant ratio (how many to activate initially)

## Performance Considerations

- Dormant shards cost but provide capacity headroom
- Activation involves data migration (cost in time and bandwidth)
- No production rebalancing needed (pre-planned bucket reassignment)

## Security Considerations

- Dormant shards must be secured (access controls, network isolation)
- Activation must include security configuration of new shard

## Related Rules

- 6-23-1: Always Plan Shard Growth Before Implementation

## Related Skills

- Choose Between Pre-Sharding and Progressive Sharding
- Implement Virtual Bucket Rebalancing
- Implement Shard Activation

## Success Criteria

- Pre-sharded capacity covers 3+ years of growth
- Activation completes without data loss or downtime
- Zero emergency rebalancing needed
