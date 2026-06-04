# Skill: Configure PgBouncer Pooling Modes

## Purpose

Configure PgBouncer in transaction mode (recommended for Laravel) with `PDO::ATTR_EMULATE_PREPARES` and `server_reset_query = DISCARD ALL` for maximum multiplexing efficiency.

## When To Use

- PostgreSQL with Laravel
- PHP-FPM deployments needing connection pooling
- High-traffic apps needing 5-10× connection multiplexing
- Admin tools needing session state (separate session-mode port)

## When NOT To Use

- Octane-only deployments (use built-in pool)
- MySQL (use ProxySQL instead)
- Low-traffic apps where pooling doesn't matter

## Prerequisites

- PostgreSQL database
- PgBouncer installed
- Access to PgBouncer configuration

## Inputs

- PostgreSQL connection details
- Expected number of client connections
- Application needs (transaction state vs session state)

## Workflow (numbered steps)

1. Install PgBouncer on the database server or a dedicated instance

2. Configure PgBouncer for dual-mode (transaction for app, session for admin):
   ```ini
   [databases]
   laravel = host=127.0.0.1 port=5432 dbname=myapp
   admin = host=127.0.0.1 port=5432 dbname=myapp

   [pgbouncer]
   listen_port = 6432          # Transaction mode (app)
   listen_port2 = 7432         # Session mode (admin)
   auth_type = scram-sha-256
   pool_mode = transaction
   default_pool_size = 50
   max_client_conn = 500
   server_reset_query = DISCARD ALL
   ```

3. Enable `PDO::ATTR_EMULATE_PREPARES` in Laravel config:
   ```php
   'pgsql' => [
       'host' => env('PGBOUNCER_HOST'),
       'port' => env('PGBOUNCER_PORT', '6432'),
       'options' => [
           PDO::ATTR_EMULATE_PREPARES => true,
       ],
   ],
   ```

4. Remove any middleware or code that sets session-level variables (timezone, search_path)

5. For admin tools, use the session-mode port (7432) for `psql` or admin panels

6. Monitor PgBouncer:
   - `SHOW POOLS` — check pool utilization
   - `SHOW STATS` — check request rates
   - `SHOW CLIENTS` — check active clients

## Validation Checklist

- [ ] PgBouncer in transaction mode for app pool
- [ ] `PDO::ATTR_EMULATE_PREPARES = true` in database config
- [ ] No prepared statement errors in logs
- [ ] `server_reset_query = DISCARD ALL` configured
- [ ] Admin tools use separate session-mode port
- [ ] Pool utilization stays below 80%

## Common Failures

- Transaction pooling without emulate prepares — "prepared statement already exists" errors
- Session pooling for web app — no multiplexing (200 workers = 200 connections)
- SET commands in middleware lost in transaction pooling
- No DISCARD ALL — stale state leaks between transactions
- Single pool mode for everything — admin tools break in transaction mode

## Decision Points

- Transaction mode vs session mode: efficiency vs state persistence
- Single PgBouncer instance vs multiple instances (HA)
- Default pool size: 50 vs 100 vs 200
- Server lifetime and idle timeout settings

## Performance Considerations

- Transaction mode: 5-10× multiplexing (50 connections serve 250-500 clients)
- Session mode: ~1× (no multiplexing for web)
- Each backend connection: 2-10MB RAM on PostgreSQL
- PgBouncer: <2MB RAM, negligible CPU

## Security Considerations

- `auth_type = scram-sha-256` (recommended)
- TLS between app and PgBouncer
- Log authentication failures
- Separate ports for app vs admin

## Related Rules

- 10-3-1: Always Use Transaction Mode for Laravel
- 10-3-2: Always Enable PDO::ATTR_EMULATE_PREPARES with Transaction Pooling

## Related Skills

- Configure Pool Architecture
- Manage Connection Count
- Configure Read/Write Connection Separation

## Success Criteria

- PgBouncer in transaction mode
- No prepared statement errors
- Pool utilization efficient (50 backend serving 200+ workers)
- Admin tools work via session-mode port
- DISCARD ALL prevents state leaks
