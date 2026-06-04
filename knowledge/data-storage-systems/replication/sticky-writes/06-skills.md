# Skill: Implement Sticky Writes

## Purpose

After a write request, ensure subsequent reads within the same request use the write connection to prevent stale reads from replicas.

## When To Use

- Read replicas with replication lag
- Applications where users should see their own writes immediately
- Forms, dashboards, admin panels with read-after-write patterns

## When NOT To Use

- No read replicas (single connection)
- Replication lag is zero (sync replication)
- Read-after-write consistency is not required

## Prerequisites

- Read/write connection separation configured
- Master-replica replication

## Inputs

- Application code with read-after-write patterns
- Laravel read/write connection config

## Workflow (numbered steps)

1. Enable sticky writes in `config/database.php`:
   ```php
   'mysql' => [
       'sticky' => true,
       // ...
   ],
   ```
2. Laravel's behavior: after any write on a connection, `$recordsModified = true`
3. Subsequent reads on that connection use the write PDO (not replica)
4. `$recordsModified` resets at the end of the request
5. Test: create a record, redirect to list page, verify the new record appears immediately

## Validation Checklist

- [ ] Sticky writes enabled in config
- [ ] After write, subsequent reads use write connection
- [ ] Sticky writes don't persist across requests
- [ ] No stale data served after write within same request

## Common Failures

- Sticky writes disabled — user doesn't see their own write on next page load
- Sticky writes enabled but replication lag higher than expected — stale read across requests
- Sticky writes cause all reads to use primary (defeats read scaling)

## Decision Points

- Sticky writes enabled vs disabled
- Per-request stickiness vs session-level stickiness

## Performance Considerations

- Sticky writes route reads to primary after write — reduces replica read scaling benefit
- Only affects queries after writes, not all queries
- Typically small percentage of total requests

## Security Considerations

- Sticky writes don't affect security
- Consistent reads prevent user confusion (seeing "disappearing" data)

## Related Rules

- 7-4-1: Always Enable Sticky Writes For User-Facing Requests
- 7-4-2: Never Assume Sticky Writes Prevent Cross-Request Staleness

## Related Skills

- Configure Laravel Read/Write Connections
- Implement Automatic Query Routing
- Implement Lag-Aware Read Splitting

## Success Criteria

- Users see their writes immediately after form submission
- Stale reads eliminated within the same request
- Read replicas still serve independent read traffic
