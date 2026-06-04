# Skill: Implement Partition-Aware Row-Level Security

## Purpose

Combine PostgreSQL RLS (Row-Level Security) policies with table partitioning to achieve both multi-tenant data isolation and lifecycle management.

## When To Use

- PostgreSQL 10+ with declarative partitioning and RLS
- Multi-tenant application with partitioned tables
- Need tenant data isolation + time-based data lifecycle
- RLS policies must propagate to all partitions automatically

## When NOT To Use

- MySQL (no RLS support)
- No multi-tenant data isolation requirements
- RLS not needed (single-tenant or application-level authorization)
- Partitioning not used (RLS alone is sufficient)

## Prerequisites

- PostgreSQL 10+ with declarative partitioning
- RLS enabled on the partitioned table
- Understanding of RLS policies and partition pruning

## Inputs

- Partitioned table definition
- RLS policy (tenant isolation, user role, etc.)
- Partition key (typically date range for lifecycle)

## Workflow (numbered steps)

1. Create the partitioned table on the partition key (e.g., month):
   ```sql
   CREATE TABLE orders (
     id SERIAL, tenant_id INT, created_at DATE, ...
   ) PARTITION BY RANGE (created_at);
   ```
2. Create partitions:
   ```sql
   CREATE TABLE orders_2024 PARTITION OF orders
     FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
   ```
3. Enable RLS on the parent table:
   ```sql
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ```
4. Create RLS policy using tenant context:
   ```sql
   CREATE POLICY tenant_isolation ON orders
     USING (tenant_id = current_setting('app.tenant_id')::int);
   ```
   - The policy automatically propagates to all existing and future partitions
   - No need to define policies per partition
5. Verify partition pruning works with RLS:
   ```sql
   EXPLAIN (ANALYZE) SELECT * FROM orders
   WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
   ```
   - PostgreSQL prunes partitions first, then applies RLS
   - Query scans only January 2024 partition, then filters by tenant_id
6. For detached partitions:
   - `ALTER TABLE orders DETACH PARTITION orders_2020`
   - RLS policy no longer applies to the standalone table
   - Must secure the standalone table separately

## Validation Checklist

- [ ] RLS enabled on the parent partitioned table
- [ ] RLS policy propagates to all partitions
- [ ] Partition pruning works before RLS filtering (verify with EXPLAIN)
- [ ] New partitions automatically get the RLS policy
- [ ] Detached partitions do not retain the RLS policy
- [ ] Query performance: RLS does not prevent partition pruning

## Common Failures

- RLS enabled only on parent but not checked on child partitions (PostgreSQL handles this correctly)
- RLS policy references columns not in the partition key — still works, but no pruning benefit from RLS column
- Detached partition loses RLS — may expose unauthorized data
- RLS overhead adds per-row check after partition pruning
- `current_setting('app.tenant_id')` returns NULL — RLS blocks all rows

## Decision Points

- RLS on partitioned table vs application-level authorization
- Tenant isolation via RLS vs separate database per tenant
- Partition key (time) vs RLS column (tenant_id): both independent
- Detach vs DROP for partition archival: RLS implications

## Performance Considerations

- Partition pruning first: reduces rows to scan before RLS filtering
- RLS adds per-row check: O(partition_rows) after pruning
- RLS with partition pruning is efficient: small pruned set filtered by tenant_id
- Index on tenant_id (within each partition) helps RLS filtering
- PostgreSQL partition-wise JOIN + RLS: both apply correctly

## Security Considerations

- RLS on partitioned table: policy propagates to all children automatically
- Detached partitions: must re-secure manually (separate RLS or permissions)
- RLS bypass: users with BYPASSRLS attribute can bypass policies
- Partition structure may reveal data distribution (not a security concern)

## Related Rules

- 8-17-1: Always Enable RLS Before Creating Partitions
- 8-17-2: Never Assume RLS Applies to Detached Partitions

## Related Skills

- Implement PostgreSQL Row-Level Security
- Implement Multi-Tenant Partitioning
- Implement Partition Detachment for Archival

## Success Criteria

- RLS policy propagates to all partitions
- Partition pruning works before RLS filtering
- New partitions automatically receive the RLS policy
- Query performance acceptable (pruning + RLS indexing)
- Detached partitions secured separately
