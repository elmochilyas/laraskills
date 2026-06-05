# 10.3 PgBouncer Pooling Modes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.3 |
| Knowledge Unit Title | PgBouncer pooling modes (session, transaction, statement) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.2 Pool architecture |
| Related KUs | PgBouncer modes |
| Last Updated | 2026-06-02 |

## Overview

PgBouncer has three pooling modes. Transaction mode (recommended for Laravel): the client gets a backend connection for one transaction, then returns it to the pool. Session mode: the client holds the connection for the entire session duration (less efficient). Statement mode: connection returned after each statement (most efficient, but breaks SET/LISTEN). Choosing the correct mode balances connection efficiency against application compatibility.

## Core Concepts

- **Session pooling**: Connection is assigned to a client until the client disconnects. Pool utilization = active clients / pool size. Inefficient for web apps because the connection is held for the entire HTTP request, even between queries. Effectively no multiplexing for web workloads.
- **Transaction pooling**: Connection assigned for the duration of one transaction. After COMMIT/ROLLBACK, the connection returns to the pool. The next client may get a different connection. Session state (prepared statements, SET SESSION variables, LISTEN/NOTIFY) does not persist between transactions.
- **Statement pooling**: Connection assigned per individual statement. Even less state persistence than transaction pooling. Rarely used in Laravel. Only suitable for apps that never use prepared statements or session state.
- **Pool sizing impact**: Session mode with 200 clients needs 200 backend connections. Transaction mode with 200 clients may need only 20–50 backend connections. Statement mode needs even fewer.

## When To Use

- **Transaction mode**: Default for Laravel web apps. Best balance of efficiency and compatibility.
- **Session mode**: Admin panels using `psql`, tools relying on session state (temporary tables, `SET` statements, `LISTEN`/`NOTIFY`), long-running scripts that need consistent connection identity.
- **Statement mode**: Very simple applications that issue only single-statement queries with no prepared statements.

## When NOT To Use

- **Transaction mode**: Apps using `LISTEN`/`NOTIFY` (lost on connection return), apps relying on session variables (`SET myapp.user_id = 5`), apps with many `PREPARE`/`DEALLOCATE` cycles without emulate prepares.
- **Session mode**: High-traffic web apps (defeats pooling efficiency).
- **Statement mode**: Any Laravel application using Eloquent (requires prepared statements internally).

## Best Practices

- **Use transaction mode + `PDO::ATTR_EMULATE_PREPARES = true`**: Laravel's prepared statement usage conflicts with transaction pooling because prepared statements are session state. By enabling emulate prepares, PHP inlines parameters into SQL, eliminating server-side prepared statements. **Why**: This is the only reliable way to use transaction pooling with Laravel. Without it, "prepared statement already exists" errors occur when a new client receives a connection with stale prepared statements.
- **Dedicated session-mode port for admin tools**: Configure PgBouncer with two ports — one in transaction mode for the application, one in session mode for `psql` or admin panels. **Why**: Admin tools need session state but should not pollute the application pool.
- **Connection init queries**: Use `SET search_path = 'public'` cannot persist across transactions. Instead, set `server_reset_query = DISCARD ALL` and use connection init queries per transaction. **Why**: This ensures each transaction starts with a clean connection state, preventing cross-request data leaks.
- **Monitor pool mode metrics**: Track `avg_wait_time` and `avg_recv_time` per pool mode. Transaction mode should show low wait times. Session mode will show higher wait times as connections are held longer.

## Architecture Guidelines

- Single PgBouncer instance can serve multiple databases with different pool modes if configured as separate pools.
- For Laravel, create two PgBouncer pools: `laravel` in transaction mode (default), `admin` in session mode (separate port).
- When using transaction pooling, disable any Laravel middleware or packages that execute `SET SESSION` commands (some packages set session timezone or search path).
- PgBouncer in transaction mode is incompatible with Laravel Octane's persistent connection model unless Octane's pool is reduced to 1 connection per worker.

## Performance Considerations

- Transaction mode: ~5–10× multiplexing ratio (50 backend connections serve 250–500 clients). Best for web workloads.
- Session mode: ~1× multiplexing (virtually no sharing for web). Acceptable for low-traffic admin tools.
- Each backend connection consumes ~2–10MB on PostgreSQL. Session mode with 200 clients = 0.4–2GB RAM on DB.
- Transaction mode with 50 connections = 0.1–0.5GB RAM on DB.
- PgBouncer itself uses very little CPU/memory (~2MB per instance). The bottleneck is database-side connection memory.

## Security Considerations

- PgBouncer supports `auth_type = scram-sha-256` (recommended), `md5`, `cert`, `trust`, `hba`, `any`.
- With transaction pooling, `SET SESSION AUTHORIZATION` is lost between transactions — use connection-level auth instead.
- Log all failed authentication attempts on PgBouncer.
- PgBouncer does not encrypt connections by default — configure `client_tls_sslmode = require` for app-to-pooler encryption.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Transaction pooling without emulate prepares | Default Laravel PDO config uses real prepared statements | "prepared statement already exists" errors | Set `PDO::ATTR_EMULATE_PREPARES => true` in database config |
| 2 | Session pooling for web app | Admin config copied to production pool config | Poor multiplexing — 200 workers = 200 connections | Use transaction mode for web, session mode only for admin |
| 3 | SET commands in middleware with transaction pooling | Middleware sets session timezone, search_path | Setting has no effect — lost when connection returns to pool | Set per-transaction or use `SET LOCAL` within transactions |
| 4 | No `DISCARD ALL` on connection return | Default PgBouncher reset query may be `RESET ALL` | Prepared statements, temp tables leak between transactions | Configure `server_reset_query = DISCARD ALL` in PgBouncer config |

## Anti-Patterns

- **Ignoring transaction pooling limitations**: Deploying transaction pooling without adjusting the application for lost session state leads to subtle bugs (wrong timezone, invisible prepared statements).
- **Single pool mode for all use cases**: Using session mode for the web app wastes connections. Using transaction mode for admin tools breaks them.
- **Combining transaction pooling with `LISTEN`/`NOTIFY`**: The `LISTEN` registration is lost when the connection returns to the pool. Use a dedicated session-mode connection for notifications.

## Examples

```ini
# pgbouncer.ini — Dual-mode configuration
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

```php
// config/database.php — Laravel with PgBouncer transaction mode
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('PGBOUNCER_HOST'),
    'port' => env('PGBOUNCER_PORT', '6432'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'options' => [
        PDO::ATTR_EMULATE_PREPARES => true,
    ],
],
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, 10.2 Pool architecture
- **Closely Related**: 10.10 Transaction pooling limitations, 10.7 Connection count management
- **Advanced**: PgBouncer `max_db_connections`, `server_lifetime`, `server_idle_timeout` tuning
- **Cross-Domain**: 7.18 PgBouncer modes in replication context

## AI Agent Notes

- When a Laravel app with PgBouncer reports prepared statement errors, check `PDO::ATTR_EMULATE_PREPARES`
- Transaction pooling is almost always the right choice for Laravel web traffic
- Session pooling creates confusion when monitoring shows high connection counts despite "pooling"
- Recommend separate PgBouncer ports for app vs admin traffic

## Verification

- [ ] PgBouncer is in transaction mode for application pool
- [ ] `PDO::ATTR_EMULATE_PREPARES` is set to `true` in database config
- [ ] No "prepared statement already exists" or "lost connection" errors in logs
- [ ] Pool mode is verified via `SHOW POOLS` in PgBouncer admin console
- [ ] Admin tools use a separate session-mode port
- [ ] `server_reset_query = DISCARD ALL` is configured
