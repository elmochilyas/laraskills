# Skill: Manage Connection Lifecycle

## Purpose

Understand the PHP database connection lifecycle (connect, query, disconnect) and configure pooling to avoid the overhead of per-request connections.

## When To Use

- PHP-FPM deployments (new connection per request)
- Octane/Swoole deployments (persistent connections)
- Diagnosing connection exhaustion or high connection overhead
- Configuring pooling for the first time
- Understanding connection stages (TCP handshake, auth, SSL, query)

## When NOT To Use

- CLI scripts performing a single query
- Serverless environments with managed proxies (RDS Proxy)

## Prerequisites

- Basic understanding of TCP connections
- Access to database configuration

## Inputs

- Application runtime (PHP-FPM vs Octane vs Swoole)
- Current connection count
- Database max_connections setting
- Pooler availability (PgBouncer, ProxySQL)

## Workflow (numbered steps)

1. Understand your runtime's connection model:
   - **PHP-FPM**: Each request gets a fresh PHP process. Each process opens a new DB connection. Connections are not shared between requests.
   - **Octane**: Workers live across requests. Connections persist in the worker's memory. Built-in PDO connection pool available.
   - **Swoole**: Coroutine-based. Connection pool shared across coroutines.

2. Configure pooling based on runtime:
   - **PHP-FPM**: Deploy a server-side pooler (PgBouncer for PostgreSQL, ProxySQL for MySQL)
   - **Octane**: Configure `pool` settings in `config/database.php`:
     ```php
     'pool' => [
         'min' => 2,
         'max' => 10,
     ],
     ```
   - **Swoole**: Use the Swoole connection pool or a server-side pooler

3. Monitor connection health:
   - Track active connections vs `max_connections`
   - Check for "MySQL has gone away" or "Connection refused" errors
   - Configure health checks to detect and recycle stale connections

4. Handle credential rotation without restart:
   - `DB::purge('mysql')` then `DB::reconnect('mysql')` — reconnects with new config

5. Avoid `PDO::ATTR_PERSISTENT` — use a proper pooler instead

## Validation Checklist

- [ ] Connection pooling configured for the runtime
- [ ] PHP-FPM: PgBouncer or ProxySQL deployed
- [ ] Octane: `pool` config present
- [ ] No "max_connections" errors under load
- [ ] Connection health checks configured
- [ ] Credential refresh with purge/reconnect works
- [ ] PDO::ATTR_PERSISTENT not used

## Common Failures

- PHP-FPM without pooler — 200 workers = 200 connections
- Octane without pool config — connection per request same as PHP-FPM
- PDO::ATTR_PERSISTENT — stale state leaks between requests
- No health checks — "MySQL has gone away" mid-request
- No purge after config change — stale connection to wrong host

## Decision Points

- Client-side (Octane) vs server-side (PgBouncer/ProxySQL) pooling
- Pool size: PHP-FPM worker count × expected concurrency
- Pool min/max: baseline traffic vs peak traffic

## Performance Considerations

- Connect/disconnect overhead: 50-200ms per request without pooling
- Pooling reduces to microseconds per request after initial connection
- Each connection: 2-10MB RAM on database server
- Connection storms after deploy can overwhelm database

## Security Considerations

- TLS for connections crossing network boundaries
- Credentials via environment variables or secret manager
- Purge and reconnect after credential rotation
- Monitor for unexpected connection attempts

## Related Rules

- 10-1-1: Deploy Server-Side Pooler for PHP-FPM
- 10-1-2: Configure Octane Connection Pool

## Related Skills

- Configure Pool Architecture (Client-Side vs Server-Side)
- Use PgBouncer Pooling Modes
- Manage Connection Count

## Success Criteria

- Pooling configured for runtime type
- No connection exhaustion under peak load
- Health checks detect and recycle stale connections
- Credential rotation works without restart
