# Skill: Configure Laravel Read/Write Connections

## Purpose

Set up Laravel's database configuration to automatically route SELECT queries to read replicas and INSERT/UPDATE/DELETE to the primary.

## When To Use

- Master-replica replication deployed
- Need automatic query routing between primary and replicas
- Read scaling with replicas

## When NOT To Use

- Single database node (no replication)
- Read/write splitting handled at proxy level (ProxySQL, PgBouncer)
- All queries must go to same node for consistency

## Prerequisites

- Master-replica replication configured
- Read replica(s) accessible from application

## Inputs

- Primary database host(s)
- Replica database host(s)
- Database credentials

## Workflow (numbered steps)

1. Configure `config/database.php` connection with `read` and `write` arrays:
   ```php
   'mysql' => [
       'read' => [
           'host' => ['replica1', 'replica2'],
       ],
       'write' => [
           'host' => ['primary'],
       ],
       'sticky' => true,
       'database' => env('DB_DATABASE'),
       // ...
   ],
   ```
2. Laravel routes: SELECT, SHOW, DESCRIBE, EXPLAIN → read hosts
3. Laravel routes: INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write hosts
4. Enable `sticky` option: after write, subsequent reads use write connection (prevents stale reads)
5. Test routing: verify SELECTs go to replica, writes go to primary

## Validation Checklist

- [ ] SELECT queries route to replica(s)
- [ ] INSERT/UPDATE/DELETE queries route to primary
- [ ] Sticky writes work correctly (after write, reads use primary)
- [ ] Read replica failure doesn't cause errors (fallback to primary)
- [ ] `DB::statement()` routes to write connection

## Common Failures

- Sticky writes disabled — stale read after write
- Read array empty — all queries go to primary
- Replica failure causes errors (Laravel doesn't auto-fallback to primary)

## Decision Points

- Single replica vs multiple replicas in read array
- Sticky writes enabled vs disabled
- Random replica selection vs weighted

## Performance Considerations

- Read replicas distribute read load
- Sticky writes add some load to primary (reads after writes)
- Round-robin random selection distributes reads evenly

## Security Considerations

- Replicas must have same access controls as primary
- Connection credentials should be same for read and write (or managed separately)

## Related Rules

- 7-2-1: Always Enable Sticky Writes
- 7-2-2: Never Route Writes To Read Hosts

## Related Skills

- Implement Master-Replica Topology
- Implement Automatic Query Routing
- Implement Sticky Writes

## Success Criteria

- Reads route to replicas, writes to primary
- Sticky writes prevent stale reads within same request
- Zero writes accidentally sent to replicas
