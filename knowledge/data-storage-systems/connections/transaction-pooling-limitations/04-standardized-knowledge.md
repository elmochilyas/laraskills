# 10.10 Transaction Pooling Limitations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.10 |
| Knowledge Unit Title | Transaction pooling limitations (prepared statements, session state, SET commands) |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 10.3 PgBouncer modes, 7.18 Transaction pooling |
| Last Updated | 2026-06-02 |

## Overview

Transaction pooling (PgBouncer, ProxySQL) returns connections to the pool after each transaction. Since the next request may get a different connection, session-level state is lost: prepared statements, SET SESSION variables, LISTEN/NOTIFY, session variables, temporary tables, and advisory locks. Laravel's prepared statement usage requires `PDO::ATTR_EMULATE_PREPARES = true`. These limitations make transaction pooling the most efficient but also the most restrictive pooling mode.

## Core Concepts

- **Lost prepared statements**: Laravel prepares statements by default (`PDO::ATTR_EMULATE_PREPARES = false`). With transaction pooling, a prepared statement created in Transaction 1 is not available in Transaction 2 (different connection). Result: "prepared statement already exists" or "prepared statement not found" errors.
- **Emulate prepares**: `'options' => [PDO::ATTR_EMULATE_PREPARES => true]` — PHP emulates prepared statements by inlining parameters into SQL queries. No server-side prepare is created. This is the only reliable way to use transaction pooling with Laravel.
- **SET session variables**: `SET timezone = 'UTC'`, `SET names 'utf8mb4'`, `SET search_path TO 'public'` — these are lost after the connection returns to the pool. Must be set per-transaction or use `SET LOCAL` within a transaction block.
- **LISTEN/NOTIFY**: `LISTEN channel` registration is per-connection. After the transaction connection returns to the pool, the LISTEN registration is lost. Incompatible with transaction pooling.
- **Temporary tables**: Created per-session. Lost when the connection is returned to the pool. Cannot persist across transactions in transaction pooling.
- **Advisory locks**: `pg_advisory_lock()` acquired in one transaction is released when the connection returns to the pool. Session-level advisory locks require session pooling.

## When To Use

- High-traffic applications where maximum connection multiplexing is required
- Applications where session state is managed at the application layer, not the database layer
- Laravel applications with `PDO::ATTR_EMULATE_PREPARES = true` configured
- Applications that do not use LISTEN/NOTIFY, temporary tables, or session-level advisory locks

## When NOT To Use

- Applications relying on database session state (SET SESSION variables, session-level advisory locks)
- Applications using PostgreSQL LISTEN/NOTIFY
- Applications that create temporary tables for query processing
- Applications using named prepared statements across transactions
- Applications that cannot enable `PDO::ATTR_EMULATE_PREPARES` (some PDO drivers)

## Best Practices

- **Enable `PDO::ATTR_EMULATE_PREPARES = true` in database config**: This is the single most important configuration for Laravel + transaction pooling. **Why**: Laravel internally prepares statements for Eloquent queries, caching them by their SQL digest. Transaction pooling assigns different connections per transaction, so a prepared statement from transaction 1 doesn't exist in transaction 2. Real prepares fail with "prepared statement not found." Emulated prepares avoid server-side prep entirely.
- **Use `SET LOCAL` instead of `SET SESSION` inside transactions**: `SET LOCAL timezone = 'UTC'` applies only within the current transaction. **Why**: `SET SESSION` sets session-level state that persists across transactions. With transaction pooling, that state leaks to the next user who gets the same connection. `SET LOCAL` scopes the setting to the current transaction only.
- **Move session-state logic to application layer**: Timezone conversion, search path, and locale settings should be handled in PHP, not SET SESSION commands. **Why**: Database session state is fundamentally incompatible with connection multiplexing. Application-layer state management is both more compatible and more testable.
- **Use `DISCARD ALL` on connection return**: Configure PgBouncer's `server_reset_query = DISCARD ALL`. **Why**: This resets ALL session state (prepared statements, temp tables, advisory locks, SET variables) when a connection is returned to the pool. It ensures each transaction starts with a clean connection.
- **Provide a session-mode port for admin tools**: Run a second PgBouncer port in session mode for tools that need persistent session state (psql, admin panels). **Why**: The application can use efficient transaction pooling while admin tools get full session state support.

## Architecture Guidelines

- Transaction pooling is the default and recommended mode for Laravel web traffic with PgBouncer.
- For Octane + PgBouncer: Transaction pooling conflicts with Octane's persistent connection model. Octane expects the same connection across requests, but transaction pooling returns it to the pool between transactions. Either use session pooling for Octane or reduce Octane's pool to min=1, max=1.
- ProxySQL's connection multiplexing has the same limitations as PgBouncer transaction pooling. Disable multiplexing if the application uses session state.
- If the application uses Laravel Passport or other packages that execute `SET SESSION` commands, verify compatibility with transaction pooling or use session pooling.

## Performance Considerations

- Transaction pooling maximizes connection multiplexing: 50 backend connections can serve 500+ client connections.
- Session pooling with 500 clients requires 500 backend connections — 10× the RAM on the database server.
- `PDO::ATTR_EMULATE_PREPARES` has negligible performance impact (<5% overhead) compared to real prepared statements for typical Laravel workloads.
- Transaction pooling reduces per-query overhead (no PREPARE → EXECUTE → DEALLOCATE cycle) since queries are sent directly as SQL.
- The tradeoff: maximum efficiency (transaction pooling) vs maximum compatibility (session pooling).

## Security Considerations

- Connection state leakage: Without `DISCARD ALL`, SET variables or temporary objects created in one transaction may be visible to the next user on the same connection. This is a cross-request data leak. Always use `DISCARD ALL`.
- Session pooling does not have this state leakage issue (the same client holds the connection for the entire session).
- ProxySQL multiplexing without proper isolation can cause cross-tenant data exposure if session state is used.
- Regular security audits should verify that `server_reset_query` is configured correctly.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Transaction pooling without emulate prepares | Default Laravel PDO config | "Prepared statement already exists" or "not found" errors | Set `PDO::ATTR_EMULATE_PREPARES => true` |
| 2 | SET SESSION commands in middleware | Middleware sets session timezone, search_path | Setting has no effect; may leak to other requests | Use SET LOCAL within transactions, or move to app layer |
| 3 | LISTEN/NOTIFY with transaction pooling | Developer expects notifications to work | LISTEN registration lost on connection return | Use session mode for notification connections |
| 4 | No server_reset_query | Default reset may be incomplete or slow | State leaks between connections | Configure `server_reset_query = DISCARD ALL` |
| 5 | Temporary tables in transaction pooling | Developer creates temp table for query processing | Table disappears on next query (different connection) | Use subqueries or CTEs instead of temp tables |

## Anti-Patterns

- **Blindly enabling transaction pooling without application audit**: Deploying transaction pooling without checking for SET SESSION, prepared statements, or temp table usage. Always audit first.
- **"It works in dev" syndrome**: Dev environments often use direct connections (no pooler). The app works fine in dev but breaks in production with transaction pooling. Test with transaction pooling in staging.
- **Mixing transaction and session pooling on the same database**: Two different PgBouncer ports can handle this, but mixing within the same pool causes unpredictable behavior.
- **Relying on `RESET ALL` instead of `DISCARD ALL`**: `RESET ALL` resets only GUC parameters (PostgreSQL configuration). `DISCARD ALL` also resets prepared statements, temp tables, and advisory locks. Use `DISCARD ALL`.

## Examples

```php
// config/database.php — Laravel with transaction pooling
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('PGBOUNCER_HOST'),
    'port' => env('PGBOUNCER_PORT', '6432'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'options' => [
        PDO::ATTR_EMULATE_PREPARES => true,  // CRITICAL for transaction pooling
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ],
    'charset' => 'utf8mb4',
],

// Instead of SET SESSION in middleware:
// Bad — lost in transaction pooling
DB::statement("SET timezone = 'UTC'");

// Good — scoped to transaction
DB::transaction(function () {
    DB::statement("SET LOCAL timezone = 'UTC'");
    // queries here use UTC timezone
});

// pgbouncer.ini — proper transaction pooling config
[pgbouncer]
pool_mode = transaction
default_pool_size = 50
max_client_conn = 500
server_reset_query = DISCARD ALL  // CRITICAL — cleans all state
```

## Related Topics

- **Prerequisites**: 10.2 Pool architecture, 10.3 PgBouncer pooling modes
- **Closely Related**: 10.7 Connection count management, 10.15 ProxySQL query rules
- **Advanced**: PgBouncer `server_check_query`, `query_timeout`, `pkt_buf` tuning
- **Cross-Domain**: 9.5 Row-level locks (advisory lock compatibility), 12.6 Full-text search (tsvector trigger compatibility)

## AI Agent Notes

- Transaction pooling breaks many Laravel assumptions about connection state
- `PDO::ATTR_EMULATE_PREPARES = true` is the most critical fix — without it, Laravel breaks
- Always check for SET SESSION commands, LISTEN/NOTIFY, or temp tables when recommending transaction pooling
- Session pooling is safer but 10× less efficient for connection multiplexing
- The tradeoff: transaction pooling for efficiency, session pooling for compatibility
- `DISCARD ALL` is non-negotiable — configure it on the pooler, not the application

## Verification

- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in all transaction-pooled connections
- [ ] `server_reset_query = DISCARD ALL` is configured in PgBouncer
- [ ] No `SET SESSION` commands are executed in application code (use `SET LOCAL` instead)
- [ ] No `LISTEN`/`NOTIFY` is used on transaction-pooled connections
- [ ] No temporary tables are created on transaction-pooled connections
- [ ] No session-level advisory locks are used on transaction-pooled connections
- [ ] Application is tested with transaction pooling in staging environments
- [ ] A session-mode port is available for admin tools (psql, migration, etc.)
