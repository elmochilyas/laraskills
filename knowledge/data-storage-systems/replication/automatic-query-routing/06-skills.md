# Skill: Implement Automatic Query Routing

## Purpose

Automatically route database queries to read or write connections based on SQL statement type, ensuring correct load distribution.

## When To Use

- Read/write connection separation configured
- Need automatic routing without manual query classification
- Consistent routing behavior across the application

## When NOT To Use

- Single database connection (no read/write split)
- Proxy-level routing handles this transparently

## Prerequisites

- Laravel read/write connection config
- Understanding of SQL statement classification

## Inputs

- Application queries (all SQL statements)
- Read/write connection configuration

## Workflow (numbered steps)

1. Understand Laravel's automatic routing:
   - `str_starts_with($query, 'select')` → read connection
   - `str_starts_with($query, 'insert', 'update', 'delete')` → write connection
   - `DB::statement()` → write connection (always)
   - In a transaction → all queries use write connection
2. For Eloquent: routing is automatic via the query builder
3. For raw queries: use `DB::select()` for reads, `DB::insert/update/delete/statement()` for writes
4. For stored procedures: use `DB::statement()` (routes to write)
5. Test routing: enable query log and verify correct connection usage

## Validation Checklist

- [ ] SELECT queries route to read connection
- [ ] INSERT/UPDATE/DELETE route to write connection
- [ ] `DB::statement()` routes to write connection
- [ ] Transaction scoping uses write connection for all queries
- [ ] `DB::select()` routes to read connection

## Common Failures

- `DB::statement('SELECT ...')` routes to write connection (use DB::select)
- Stored procedure calls routed to read (but may write data)
- SELECT ... FOR UPDATE routed to read (should be write, but Laravel can't distinguish)

## Decision Points

- Use `DB::select()` vs `DB::statement()` for read queries
- Override routing for specific queries (e.g., SELECT FOR UPDATE on write)

## Performance Considerations

- Keyword detection is O(1) — no performance impact
- Transaction routing: all queries in transaction go to write (consistency)

## Security Considerations

- Ensure SELECT ... FOR UPDATE goes to primary (write connection)
- Read-only queries must not accidentally write data

## Related Rules

- 7-3-1: Always Use DB::select For Read Queries
- 7-3-2: Never Use DB::statement For SELECT Queries

## Related Skills

- Configure Laravel Read/Write Connections
- Implement Sticky Writes
- Implement Read/Write Connection Separation

## Success Criteria

- All SELECT queries route to read connection
- All write queries route to write connection
- Zero misrouted queries
