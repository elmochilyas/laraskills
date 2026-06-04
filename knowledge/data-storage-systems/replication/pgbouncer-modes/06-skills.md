# Skill: Select and Configure pgbouncer Pooling Mode

## Purpose

Choose and configure the correct pgbouncer pooling mode (session, transaction, or statement) based on application session requirements and connection efficiency goals.

## When To Use

- PostgreSQL database with many concurrent connections
- Need to reduce PostgreSQL connection count
- Application uses Laravel or other web framework with short-lived connections

## When NOT To Use

- Single or few application workers (connection count is manageable)
- Application heavily uses session-level features (SET, LISTEN/NOTIFY, temp tables)
- MySQL database (pgbouncer is PostgreSQL-only — use ProxySQL)

## Prerequisites

- pgbouncer installed on a server accessible to application
- PostgreSQL user credentials for pooling
- Understanding of application session-level SQL usage

## Inputs

- Expected concurrent connections from application
- PostgreSQL `max_connections` limit
- List of session-level SQL commands used
- pgbouncer configuration access

## Workflow (numbered steps)

1. Audit application for session-level SQL: `SET SESSION`, `SET LOCAL`, prepared statements, `LISTEN`/`NOTIFY`, temp tables, cursors
2. If session-level features are required → session pooling (least efficient, one connection per client)
3. If no session-level features → transaction pooling (recommended, efficient)
4. Configure pgbouncer.ini:
   - `pool_mode = transaction` (or session)
   - `default_pool_size = 25` (adjust based on traffic)
   - `max_client_conn = 200` (match application worker count)
5. For Laravel: set `'options' => ['pdo_options' => [PDO::ATTR_EMULATE_PREPARES => true]]` for transaction pooling
6. Point Laravel `DB_HOST` to pgbouncer address, `DB_PORT` to pgbouncer port
7. Test all application features under new pool mode

## Validation Checklist

- [ ] Application functions correctly with chosen pool mode
- [ ] Prepared statements work (emulated or real) in transaction mode
- [ ] `LISTEN`/`NOTIFY` works (if used) — switch to session pooling if needed
- [ ] PostgreSQL connection count stays below `max_connections`
- [ ] No connection timeout errors under peak load

## Common Failures

- Prepared statements in transaction pooling: create on every connection — fails. Use `ATTR_EMULATE_PREPARES`
- `LISTEN`/`NOTIFY` in transaction pooling: notifications lost after transaction. Use session pooling or dedicated connection
- `SET SESSION` in transaction pooling: lost after transaction return. Use `SET LOCAL` or session pooling
- `DISCARD ALL` in transaction pooling: good practice to reset session state, but doesn't work in transaction mode

## Decision Points

- Session pooling: worst efficiency, best compatibility. Use for apps with heavy session state usage
- Transaction pooling: best efficiency, requires app to avoid session-level features
- Statement pooling: rarely appropriate — connection returned after each statement. Only for stateless single-statement usage

## Performance Considerations

- Session pooling: one connection per client, but still fewer than direct connections (idle timeout)
- Transaction pooling: ~10-50x connection reduction vs direct connections
- Transaction pooling adds <0.1ms overhead per query

## Security Considerations

- pgbouncer must have TLS configured for client-to-pgbouncer and pgbouncer-to-PostgreSQL
- pgbouncer auth file must be secured (password file or HBA)
- pgbouncer stats interface must be restricted

## Related Rules

- 7-18-1: Prefer Transaction Pooling for Web Applications
- 7-18-2: Never Use Statement Pooling with Web Applications

## Related Skills

- Configure Connection Pooling for Read Replicas
- Troubleshoot pgbouncer Connection Issues
- Configure Laravel Database Connections for Pooling

## Success Criteria

- PostgreSQL connection count reduced by 10x or more
- Application passes all functional tests with chosen pool mode
- Zero connection-related errors under peak load

---

# Skill: Troubleshoot pgbouncer Pooling Mode Issues

## Purpose

Diagnose and resolve application errors caused by pgbouncer pooling mode incompatibilities: failed prepared statements, lost session state, unexpected authentication errors.

## When To Use

- Application errors after switching to pgbouncer
- Prepared statement errors: "prepared statement already exists" or "prepared statement does not exist"
- Session configuration lost between queries
- Authentication failures when pooling is active

## When NOT To Use

- pgbouncer is working correctly
- Errors are unrelated to connection pooling

## Prerequisites

- pgbouncer logs accessible
- Application error logs
- Deeper understanding of application session SQL usage

## Inputs

- Error messages from application (PHP, Laravel logs)
- pgbouncer log entries
- pgbouncer config (pool_mode, pool_size, etc.)
- PostgreSQL log entries

## Workflow (numbered steps)

1. Check pgbouncer pool mode: `SHOW POOLS` in pgbouncer admin console
2. For "prepared statement already exists" error: client is reusing a connection with stale prepared statement. Enable `ATTR_EMULATE_PREPARES` in Laravel or switch to session pooling
3. For "SET SESSION lost" issue: session-level SET commands don't persist across transactions. Use `SET LOCAL` or switch to session pooling
4. For "LISTEN/NOTIFY not working": notifications are lost on transaction commit. Use session pooling or dedicated connection
5. For authentication errors: check pgbouncer `auth_type` and user file. `md5` or `scram-sha-256` require password forwarding
6. Test potential fix in staging before production deployment

## Validation Checklist

- [ ] Root cause identified (pooling mode + application feature mismatch)
- [ ] Fix applied (config change, code change, or mode switch)
- [ ] Application passes full test suite after fix
- [ ] pgbouncer pool utilization is healthy (no orphaned connections)

## Common Failures

- `ATTR_EMULATE_PREPARES` not enabled for Laravel with transaction pooling
- `DISCARD ALL` in transaction pooling — PostgreSQL 14+ allows it, older versions don't
- Connection pooling with named prepared statements (Laravel uses unnamed by default, but some libraries use named)
- Mixing pooled and non-pooled connections in same application causing inconsistent behavior

## Decision Points

- Fix application code (use `SET LOCAL`, emulated prepares) vs switch pooling mode
- Session pooling for a subset of connections: configure separate pgbouncer instance or separate pool

## Performance Considerations

- Transaction pooling is 10x more efficient than session pooling — prefer fixing code over switching mode
- Emulated prepares are slightly slower than real prepared statements but negligibly so
- `SET LOCAL` adds no overhead compared to `SET SESSION`

## Security Considerations

- pgbouncer authentication mode affects password security — prefer `scram-sha-256`
- Don't set `auth_type = trust` in production
- Ensure pgbouncer logs don't contain plain-text passwords

## Related Rules

- 7-18-3: Always Test Application Features Against Chosen Pool Mode

## Related Skills

- Select and Configure pgbouncer Pooling Mode
- Configure Laravel Database Connections for Pooling

## Success Criteria

- Application errors related to pooling reduced to zero
- Connection count stays within limits
- All application features work correctly with chosen pool mode
