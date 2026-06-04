# Skill: Implement Shard Groups

## Purpose

Group related shards to enable limited cross-shard joins and reduce fan-out overhead for related data.

## When To Use

- Some joins are needed across shard boundaries
- Data can be grouped so related entities are in the same group
- Reducing fan-out for queries that span related shards

## When NOT To Use

- All data co-located on same shard (no need for groups)
- Cross-group joins are not needed
- Shard groups add unacceptable complexity

## Prerequisites

- Sharded database architecture
- Understanding of data relationships and join patterns

## Inputs

- Data model with cross-shard relationships
- Shard key assignment by entity type
- Group assignment logic

## Workflow (numbered steps)

1. Identify entities that need cross-shard joins (e.g., Users and Orders)
2. Design shard groups: assign User and Order shards so that related data is in the same group
3. Shard by same key: if both use `user_id`, they're co-located on same shard — no group needed
4. If different keys: assign ranges of both keys to the same shard group
5. Within a group, joins work because data is on the same physical shard
6. Queries across groups still require fan-out

## Validation Checklist

- [ ] Related entities within a group are on the same physical shard
- [ ] Joins within a group work correctly
- [ ] Cross-group queries handle fan-out correctly
- [ ] Group assignment is stable (entities don't move between groups frequently)

## Common Failures

- Entities in same group but on different physical shards — group concept broken
- Too many groups — most queries become cross-group (fan-out)
- Group assignment changes cause data migration

## Decision Points

- Shard group vs full co-location (same shard key)
- Group size: large groups (few groups, more data per group) vs small groups

## Performance Considerations

- Within-group joins: single shard query, efficient
- Cross-group joins: fan-out across groups, expensive
- Group count vs join frequency tradeoff

## Security Considerations

- Group boundaries should respect data access controls
- Cross-group queries must not leak data between groups

## Related Rules

- 6-13-1: Always Keep Related Data In Same Group
- 6-13-2: Never Assume Cross-Group Joins Are Efficient

## Related Skills

- Handle Cross-Shard Join Limitations
- Implement Fan-Out Queries
- Select a Shard Key

## Success Criteria

- Critical joins operate within a single shard group
- Cross-group queries are identified and optimized or accepted
- Group assignment is stable and well-documented

---

# Skill: Design Shard Group Assignment

## Purpose

Assign entities to shard groups to maximize within-group joins while maintaining even data distribution.

## When To Use

- Shard groups are needed for cross-entity joins
- Entities have different shard keys but are frequently joined
- Even distribution must be maintained within the group structure

## When NOT To Use

- All entities share the same shard key (co-located naturally)
- Cross-entity joins are rare
- Single group covers all data (no fan-out, but no isolation benefit)

## Prerequisites

- Understanding of entity relationships and join frequency
- Shard key selection per entity
- Group assignment criteria

## Inputs

- Entity relationship diagram
- Join frequency and type per relationship
- Data distribution requirements

## Workflow (numbered steps)

1. Map all entity relationships and their join frequency
2. For each relationship, assess if co-location in same group is needed
3. Design groups:
   - Same shard key: naturally co-located (no group needed)
   - Different shard keys: assign to same group if frequently joined
4. Ensure group sizes are balanced (each group has similar total data volume)
5. Document group assignments and rationale
6. Implement routing that uses group information for join queries

## Validation Checklist

- [ ] Frequently joined entities are in same group
- [ ] Group sizes are within ±20% of each other
- [ ] Group assignment is stable
- [ ] Cross-group joins are documented and minimized

## Common Failures

- Groups are uneven — some groups much larger than others
- Infrequent joins drive group assignment — groups are too large
- Entity belongs to multiple groups — complexity

## Decision Points

- Entity-centric groups (entity type per group) vs key-range groups
- Group count: more groups = less data per group = more cross-group joins

## Performance Considerations

- Within-group join: efficient
- Cross-group join: may require fan-out
- Balance group size and join frequency

## Security Considerations

- Group boundaries can create security boundaries
- Cross-group access should be controlled

## Related Rules

- 6-13-1: Always Keep Related Data In Same Group

## Related Skills

- Implement Shard Groups
- Handle Cross-Shard Join Limitations
- Select a Shard Key

## Success Criteria

- 80%+ of joins operate within a single group
- Group sizes are balanced
- Group assignment is documented and stable
