# Persistent Connections — Rules

## R1: Enable Persistent Connections for PHP-FPM to Reduce Auth Overhead

**Category**: Connection Reuse

**Rule**: ALWAYS enable persistent database connections in PHP-FPM configurations (`PDO::ATTR_PERSISTENT => true`) for production Laravel apps with >100 req/s per worker pool. NEVER use persistent connections when a connection pooler (RDS Proxy, PgBouncer) is already managing multiplexing.

**Reason**: Each new database connection requires a TCP handshake (1 RTT) + MySQL/PostgreSQL auth (1 RTT) + optional SSL negotiation (2 RTT) = 4 RTTs = 20-60ms per request. Persistent connections reuse a single connection across multiple requests, eliminating this overhead. Database CPU reduces by 5-10% from avoided auth cycles. For a 500 req/s app, this saves 10-30 seconds of connection overhead per second.

**Bad Example**: A PHP-FPM Laravel app with 50 workers handles 500 req/s. Each worker creates a new database connection per request (no persistence). 50 connections x 50ms auth overhead = 2.5 seconds of connection setup per second of request processing. Database CPU: 20% on auth, 80% on queries.

**Good Example**: Persistent connections enabled. Each worker opens a connection once and reuses it for 500 requests (PHP-FPM max_requests). 50 connections created once, not per request. Connection overhead: 0ms per request (amortized). Database CPU: 3% on auth (maintenance), 97% on queries. Throughput increases 15%.

**Exceptions**: Do NOT enable PHP-FPM persistent connections if using a connection pooler (RDS Proxy, PgBouncer). The pooler already handles connection reuse — double-pooling causes connection count issues.

**Consequences Of Violation**: 20-60ms of connection setup overhead per request. Database spends 10-20% of CPU on auth cycles. Maximum throughput is artificially limited by connection creation rate.

---

## R2: Implement Health Checks (SELECT 1) to Detect Stale Connections

**Category**: Connection Health

**Rule**: ALWAYS implement a database connection health check (SELECT 1) before executing the first query of a request. NEVER assume persistent connections remain valid indefinitely.

**Reason**: Persistent connections can drop silently due to network timeouts, database server restarts, firewall idle timeouts, or TLS session expiration. When a stale connection is used, the application receives a "MySQL has gone away" or "PostgreSQL connection failed" error. A pre-query health check (SELECT 1 or PDO::ATTR_PERSISTENT with `MYSQL_ATTR_INIT_COMMAND`) detects stale connections and triggers reconnection before the actual query, avoiding user-facing errors.

**Bad Example**: A PHP-FPM worker holds a persistent connection for 4 hours (500 requests). The RDS instance performs a maintenance failover at hour 3. The connection is silently severed. At request 301, the first query executes on the stale connection — "MySQL has gone away" error. The user sees a 500 error. Next request reconnects successfully.

**Good Example**: Before each request, a middleware runs `DB::select('SELECT 1')`. If this fails, `DB::reconnect()` is called. The failover at hour 3 causes the health check to fail, reconnection occurs, and the actual query executes successfully. Zero user-facing errors. Total overhead: 1ms per request.

**Exceptions**: When using a connection pooler (RDS Proxy, PgBouncer) with built-in health checks, application-level health checks are redundant. The pooler handles connection validation.

**Consequences Of Violation**: Intermittent "MySQL has gone away" errors affecting 0.1-1% of requests. The errors are non-deterministic (occur after any network interruption), making them hard to reproduce and debug.

---

## R3: Use Octane Connection Management Explicitly — Disconnect After Heavy Jobs

**Category**: Octane Connections

**Rule**: ALWAYS explicitly manage database connections in Laravel Octane workers. Call `DB::disconnect()` after memory-intensive jobs or after a configurable number of requests. NEVER let Octane hold connections indefinitely without refresh.

**Reason**: Octane workers persist across thousands of requests. Database connections in Octane accumulate memory (query log, result sets, prepared statements) and can become stale. Without periodic disconnection, a worker's database connection memory grows unbounded and becomes increasingly likely to have silent failures. Octane's `tick()` method provides a natural place to refresh connections.

**Bad Example**: An Octane worker processes 10,000 requests over 8 hours without disconnecting. The connection has: 10,000 accumulated query log entries, 200 prepared statements, and a growing memory footprint. At request 7,503, the connection drops due to a network glitch — the worker has no reconnection logic. Worker crashes. Error rate: 0.01% but appears random.

**Good Example**: Octane worker uses `Octane::tick('db-refresh')->seconds(300)` to disconnect and reconnect the database connection every 5 minutes. Accumulated memory is freed. If the connection dropped, reconnection happens naturally. Worker memory stays stable. Zero connection-related errors.

**Exceptions**: For Octane workers handling very short requests (<50ms each), increase the refresh interval to every 1000 requests or 30 minutes. Disconnecting too frequently negates the connection reuse benefit.

**Consequences Of Violation**: Gradual memory growth in Octane workers from database connection state accumulation. Workers eventually OOM or crash. Silent connection failures become more frequent as connections age.

---

## R4: Set wait_timeout Higher Than Maximum Idle Period

**Category**: Timeout Configuration

**Rule**: ALWAYS configure MySQL `wait_timeout` and `interactive_timeout` to a value higher than the maximum expected idle period between requests on a persistent connection. NEVER leave `wait_timeout` at the default (28800 seconds / 8 hours) if persistent connections idle longer.

**Reason**: MySQL automatically closes connections that have been idle longer than `wait_timeout`. If a PHP-FPM worker processes requests infrequently (e.g., 1 request per hour), the persistent connection idles for 55 minutes. If `wait_timeout` is 30 minutes, MySQL kills the connection after 30 minutes. The next request tries to use the dead connection and gets "MySQL has gone away." Setting `wait_timeout` to 86400 (24 hours) or higher ensures idle persistent connections survive until they are naturally recycled by PHP-FPM's max_requests.

**Bad Example**: PHP-FPM persistent connections enabled. `wait_timeout` = 600 seconds (10 minutes, default in some configurations). Workers process requests every 12 minutes average. Workers idle for ~11 minutes between requests. MySQL kills connections after 10 minutes of idle. 50% of requests encounter "MySQL has gone away" errors. Application stability is poor.

**Good Example**: `wait_timeout` = 86400 (24 hours). Workers idle for up to 11 minutes between requests — well within the timeout. Connections stay alive. Health check middleware (SELECT 1) catches any rare disconnection. Error rate: 0%.

**Exceptions**: For connection poolers (RDS Proxy, PgBouncer), follow the pooler's recommended timeout configuration, not the database's. Poolers often have their own idle timeout.

**Consequences Of Violation**: Frequent "MySQL has gone away" errors on sporadic-traffic applications. The default `wait_timeout` (8 hours) works for most apps but fails for low-traffic apps where workers idle for hours.

---

## R5: Disable PHP-FPM Persistent Connections When Using Connection Pooler

**Category**: Pooler Compatibility

**Rule**: NEVER enable PHP-FPM persistent database connections when using a connection pooler (RDS Proxy, PgBouncer). ALWAYS let the pooler handle connection reuse when one is deployed.

**Reason**: Connection poolers already multiplex application connections through a smaller set of database connections. Enabling persistent connections at the PHP-FPM layer on top of a pooler creates "double-pooling" — the application holds persistent connections to the pooler, but the pooler's connection to the database is separate. This leads to inconsistent connection states, higher-than-necessary connection counts at the pooler, and can cause unexpected pooler behavior like connection leaks.

**Bad Example**: PgBouncer in transaction mode with default_pool_size = 10. PHP-FPM workers have persistent connections enabled (PDO::ATTR_PERSISTENT). When a worker completes a transaction, PgBouncer returns the server connection to the pool, but the PHP persistent connection to PgBouncer remains open. Over time, PgBouncer sees 50 persistent client connections but only 10 server connections — the pooler works correctly, but the application-level persistence provides no benefit and complicates connection management.

**Good Example**: PgBouncer in transaction mode with default_pool_size = 10. PHP-FPM persistent connections disabled (connection per request). Each request opens a new client connection to PgBouncer, which efficiently multiplexes through the 10 server connections. Connection management is clean and predictable.

**Exceptions**: For PgBouncer in session mode (pins a server connection to a client connection), PHP-FPM persistent connections may work but provide minimal benefit over the pooler's session pooling.

**Consequences Of Violation**: No functional benefit from double-pooling, but added complexity and potential for connection management issues. The pooler is already optimized for connection reuse — application-level persistence adds nothing.
