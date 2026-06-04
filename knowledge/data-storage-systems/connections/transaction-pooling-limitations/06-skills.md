# Skill: Handle Transaction Pooling Limitations

## Purpose

Configure Laravel to work correctly with PgBouncer transaction pooling by enabling `PDO::ATTR_EMULATE_PREPARES`, avoiding session-state commands (SET SESSION, LISTEN/NOTIFY, temp tables), and using `SET LOCAL` within transactions.

## When To Use

- High-traffic apps needing maximum connection multiplexing
- Laravel applications with PgBouncer in transaction mode
- Apps where session state is managed at the application layer
- Apps with `PDO::ATTR_EMULATE_PREPARES = true` configured

## When NOT To Use

- Apps relying on database session state (SET SESSION, session-level locks)
- Apps using PostgreSQL LISTEN/NOTIFY
- Apps that create temporary tables for query processing
- Apps that cannot enable PDO::ATTR_EMULATE_PREPARES

## Prerequisites

- Understanding of PgBouncer pooling modes (10-3)
- Understanding of pool architecture (10-2)
- Access to PgBouncer configuration

## Inputs

- Application code inventory (SET SESSION, LISTEN/NOTIFY, temp tables)
- PDO driver compatibility with emulate prepares
- PgBouncer configuration access

## Workflow (numbered steps)

1. Enable `PDO::ATTR_EMULATE_PREPARES = true` in database config:
   ```php
   'pgsql' => [
       'options' => [
           PDO::ATTR_EMULATE_PREPARES => true,
       ],
   ],
   ```
   This is the single most important configuration for Laravel + transaction pooling.

2. Configure `server_reset_query = DISCARD ALL` in PgBouncer:
   ```ini
   [pgbouncer]
   server_reset_query = DISCARD ALL
   ```
   This resets ALL session state (prepared statements, temp tables, locks, SET variables) when a connection returns to the pool.

3. Replace `SET SESSION` with `SET LOCAL` inside transactions:
   ```php
   DB::transaction(function () {
       DB::statement("SET LOCAL timezone = 'UTC'");
       // queries use UTC timezone within this transaction
   });
   ```

4. Move session-state logic to the application layer:
   - Timezone conversion in PHP, not SET SESSION
   - Search path in connection config, not SET SESSION
   - Locale settings in application code

5. Audit the application for incompatible features:
   - LISTEN/NOTIFY — use session-mode port instead
   - Temporary tables — use subqueries or CTEs
   - Advisory locks — use application-level locking
   - Named prepared statements across transactions — rewrite as inline queries

6. Provide a session-mode port for admin tools:
   ```ini
   listen_port = 6432     # Transaction mode (app)
   listen_port2 = 7432    # Session mode (admin)
   ```

## Validation Checklist

- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in all transaction-pooled connections
- [ ] `server_reset_query = DISCARD ALL` is configured in PgBouncer
- [ ] No `SET SESSION` commands executed in application code
- [ ] No `LISTEN`/`NOTIFY` used on transaction-pooled connections
- [ ] No temporary tables created on transaction-pooled connections
- [ ] No session-level advisory locks used on transaction-pooled connections
- [ ] App tested with transaction pooling in staging
- [ ] Session-mode port available for admin tools

## Common Failures

- Transaction pooling without emulate prepares — "prepared statement already exists" errors
- SET SESSION commands in middleware — settings have no effect, leak between requests
- LISTEN/NOTIFY with transaction pooling — registration lost on connection return
- No server_reset_query — state leaks between connections
- Temporary tables — table disappears on next query (different connection)

## Decision Points

- Transaction pooling vs session pooling (efficiency vs compatibility)
- Emulate prepares (PHP-side) vs real prepares (server-side)
- Application-level state management vs database session state
- Single session-mode port vs dedicated admin connection

## Performance Considerations

- Transaction pooling: 10× multiplexing (50 connections serve 500+ clients)
- Session pooling: ~1× multiplexing (500 clients = 500 connections)
- Emulate prepares: <5% overhead compared to real prepared statements
- Transaction pooling eliminates PREPARE → EXECUTE → DEALLOCATE cycle

## Security Considerations

- Without DISCARD ALL, SET variables or temp objects may leak between users — cross-request data leak
- Always use DISCARD ALL for connection isolation
- Session pooling separates connections by client (no leak)
- Regular security audits should verify server_reset_query is configured

## Related Rules

- 10-10-1: Always Enable PDO::ATTR_EMULATE_PREPARES
- 10-10-2: Use SET LOCAL Instead of SET SESSION

## Related Skills

- Configure PgBouncer Pooling Modes
- Configure Pool Architecture
- Manage Connection Count

## Success Criteria

- Laravel works correctly with transaction pooling
- No prepared statement errors
- No session-state leakage between clients
- Admin tools use session-mode port
- DISCARD ALL properly resets all connection state
