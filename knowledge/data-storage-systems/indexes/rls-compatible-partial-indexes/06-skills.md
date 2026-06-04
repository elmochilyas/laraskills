# Skill: Create RLS-Compatible Partial Indexes

## Purpose

Create PostgreSQL partial indexes matching Row-Level Security (RLS) policy `USING` expressions — enabling the query planner to use the index during policy evaluation, preventing expensive post-scan filters and full table scans on RLS-protected tables.

## When To Use

- PostgreSQL tables with Row-Level Security enabled
- Multi-tenant databases using RLS for tenant isolation
- Performance optimization for RLS-protected queries
- Tables with `FORCE ROW LEVEL SECURITY` enabled

## When NOT To Use

- MySQL databases (no RLS support)
- Tables without RLS policies
- Tables where RLS policy provides no filtering benefit

## Prerequisites

- PostgreSQL with RLS enabled
- Understanding of RLS USING expressions
- Knowledge of index predicate matching

## Inputs

- RLS policy USING expression
- Tenant/security context parameter
- Query patterns on the protected table

## Workflow

1. Create RLS policy: `CREATE POLICY tenant_isolation ON orders FOR ALL USING (tenant_id = current_setting('app.tenant_id')::bigint)`
2. Create partial index matching the policy: `CREATE INDEX ON orders (id) WHERE tenant_id = current_setting('app.tenant_id')::bigint`
3. Enable `FORCE ROW LEVEL SECURITY` for the table
4. Verify with EXPLAIN that the partial index is used during policy evaluation
5. Queries without the RLS context will not use the partial index (correct behavior)

## Validation Checklist

- [ ] Partial index expression exactly matches the RLS USING expression
- [ ] FORCE ROW LEVEL SECURITY is enabled on the table
- [ ] Index is used for policy evaluation (EXPLAIN confirms)
- [ ] Table owner queries bypass RLS (no partial index needed for those)

## Common Failures

### Index doesn't match policy expression
`USING (tenant_id = 5)` vs index `WHERE tenant_id = 5`. Exact match required. Even implicit type differences break the match.

### Table owner bypass
Without `FORCE ROW LEVEL SECURITY`, superuser/owner queries skip RLS. The partial index for RLS is never used for those queries.

## Decision Points

### RLS partial index vs application global scope?
RLS enforces at the database level (cannot be bypassed by application). Global scope enforces at the application level (can be bypassed with withoutGlobalScope).

### Exact match vs implied predicate?
PostgreSQL can imply simple predicates but RLS policy matching requires exact match of the USING expression.

## Performance Considerations

Without RLS-aligned indexes, every RLS-protected query may perform a full table scan for policy evaluation. A matching partial index allows the planner to integrate the policy check into the index scan.

## Security Considerations

RLS partial indexes are a performance optimization for database-level security. They don't replace the RLS policy — they make it efficient. Without the index, the policy still enforces security but may be slow.

## Related Rules

- Match partial index predicate exactly to RLS USING expression
- Enable FORCE ROW LEVEL SECURITY for tenant isolation
- Verify RLS partial index with EXPLAIN

## Related Skills

- Apply Partial Indexes for Targeted Data Subsets
- Index Soft Delete Columns Effectively
- Design B-Tree Indexes for Equality and Range Queries

## Success Criteria

- Partial index expression exactly matches RLS USING expression
- EXPLAIN confirms index usage during policy evaluation
- FORCE ROW LEVEL SECURITY enabled
- Multi-tenant queries performantly enforce data isolation
