# Skill: Implement List Partitioning

## Purpose

Divide a table into partitions based on discrete column values (categories, regions, statuses) for targeted data management.

## When To Use

- Column has a small, known set of discrete values (region, status, type)
- Queries filter by specific values and benefit from partition pruning
- Different values have different lifecycle or performance requirements
- Active vs archive data separation by status

## When NOT To Use

- Column has high cardinality (hundreds or thousands of unique values)
- Value set changes frequently (partition management overhead)
- No partition pruning benefit from list values
- Default partition grows unbounded (catch-all overhead)

## Prerequisites

- Known set of discrete values for the partition key
- Default partition strategy for unmatched values

## Inputs

- Partition key column
- List of known values per partition
- Default partition configuration

## Workflow (numbered steps)

1. Identify distinct values for the partition key (status, region, type)
2. Group related values into partitions:
   - Active statuses in hot partition
   - Inactive/archived statuses in cold partition
3. Create table with list partitions:
   ```sql
   CREATE TABLE orders (
     id INT, status VARCHAR(20), ...
   ) PARTITION BY LIST (status) (
     PARTITION p_active VALUES IN ('active', 'pending', 'processing'),
     PARTITION p_inactive VALUES IN ('inactive', 'cancelled'),
     PARTITION p_archive VALUES IN ('shipped', 'delivered'),
     PARTITION p_other VALUES IN (DEFAULT)
   );
   ```
4. Monitor the default partition for unexpected values
5. Manage partitions: ADD value to existing partition, or REORGANIZE

## Validation Checklist

- [ ] All known values assigned to partitions
- [ ] Default partition (if used) monitored for growth
- [ ] Query includes partition key for pruning
- [ ] Partition count within practical limits
- [ ] Value set documented and version-controlled

## Common Failures

- Default partition grows large with unexpected values
- High-cardinality column breaks performance (thousands of partitions)
- List values changed frequently — partition maintenance burden
- New application values not added to list — goes to default partition

## Decision Points

- Default partition: include (catch-all) vs omit (error on unmatched values)
- Single value per partition vs multiple values grouped
- List vs range partitioning for status columns

## Performance Considerations

- Partition pruning works with `WHERE status IN ('active', 'pending')`
- Each partition is a separate B-tree — hot partition stays small
- Default partition becomes hotspot if many unmatched values accumulate

## Security Considerations

- Default partition may contain sensitive data not properly categorized
- Partition definitions should be reviewed during schema changes

## Related Rules

- 8-2-1: Always Include Partition Key In WHERE
- 8-2-2: Automate Partition Lifecycle

## Related Skills

- Implement Range Partitioning
- Implement Hash Partitioning
- Implement Default Partition Strategy

## Success Criteria

- All known values map to correct partitions
- Default partition stays empty or minimal
- Queries prune to relevant partitions
