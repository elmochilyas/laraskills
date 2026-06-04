# Skill: Work Around MySQL Partition Limitations

## Purpose

Design database schemas around MySQL's partition restrictions — no foreign keys on partitioned tables, unique indexes must include the partition key, and the 8192 partition limit.

## When To Use

- Using MySQL partitioned tables
- Need foreign key references to/from partitioned tables
- Designing unique constraints on partitioned tables
- Planning partition count near MySQL's limits

## When NOT To Use

- PostgreSQL (no FK or unique index limitations)
- Non-partitioned MySQL tables
- Small tables where MySQL partitioning isn't needed

## Prerequisites

- MySQL partitioned table
- Understanding of FK and unique constraint requirements
- Alternative integrity enforcement mechanisms

## Inputs

- Partitioned table schema
- Foreign key requirements
- Unique constraint requirements
- Expected partition count

## Workflow (numbered steps)

1. **For foreign keys on partitioned tables**:
   - MySQL partitioned tables cannot participate in foreign key relationships (as parent or child)
   - Workaround: enforce referential integrity at the application level
   - Alternative: use triggers for referential validation (but complex and performance-heavy)
   - Alternative: use a non-partitioned reference table and partition the child table only
   - Accept that FK constraints must be removed from partitioned table schemas

2. **For unique indexes on partitioned tables**:
   - MySQL requires all unique index columns to be part of the partition key
   - If you need `UNIQUE (user_id)` on a table partitioned by `created_at`, it is not allowed
   - Workaround 1: include partition key in the unique constraint: `UNIQUE (created_at, user_id)`
   - Workaround 2: use non-unique index + application-level uniqueness check (not reliable for race conditions)
   - Workaround 3: change partition strategy to include user_id (hash by user_id, subpartition by date)

3. **For partition count limits**:
   - MySQL max: 8192 partitions per table
   - Practical limit: 500-1000 per table (performance degrades after ~1000)
   - Stay under 500 partitions for practical management
   - Monitor `INFORMATION_SCHEMA.PARTITIONS` for partition count

4. **Document all workarounds** so future developers understand why FK/uniques are handled differently

## Validation Checklist

- [ ] FK references removed from partitioned table schema
- [ ] Application-level referential integrity implemented where needed
- [ ] All unique indexes on partitioned tables include partition key
- [ ] Partition count well under 8192 (preferably under 500)
- [ ] Workarounds documented in code comments
- [ ] No silent data corruption from missing constraints

## Common Failures

- FK on partitioned table silently ignored by MySQL (no error)
- FK to partitioned table: MySQL allows but doesn't enforce correctly
- Unique index on non-partition column: MySQL returns error on creation
- Unique index without partition key: insert succeeds, duplicates possible
- Running out of partition budget (8192) across all tables

## Decision Points

- Application-level referential integrity vs triggers vs removing FK
- Including partition key in unique index vs changing partition strategy
- PostgreSQL as alternative to avoid MySQL limitations
- Partitioning vs sharding when partition count limit is hit

## Performance Considerations

- Application-level integrity checks add query overhead (SELECT before INSERT)
- Triggers for referential integrity are slower than FK
- Composite unique index (including partition key) may be larger than necessary
- More partitions = more metadata overhead (1-2KB per partition in memory)

## Security Considerations

- Application-level integrity checks can be bypassed (unlike database FKs)
- Missing FK enforcement may lead to orphaned records (data integrity issue)
- Partition count limits must be monitored to prevent table creation failure

## Related Rules

- 8-10-1: Always Include Partition Key in Unique Indexes
- 8-10-2: Never Rely on Foreign Keys with Partitioned Tables in MySQL

## Related Skills

- Implement Application-Level Referential Integrity
- Implement Partitioning Strategy
- Migrate from MySQL to PostgreSQL

## Success Criteria

- No FK references on partitioned tables
- All unique indexes include partition key
- Partition count monitored and under limits
- Referential integrity achieved via application or alternative mechanism
- Workarounds documented and understood by the team
