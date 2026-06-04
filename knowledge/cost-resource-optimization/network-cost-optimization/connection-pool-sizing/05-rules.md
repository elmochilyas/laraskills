# Connection Pool Sizing — Rules

## R1: Set Pool Size to 2-3x Database vCPUs

**Category**: Pool Sizing

**Rule**: ALWAYS set connection pool size (default_pool_size) to 2-3 times the database instance's vCPU count. NEVER set pool size higher than 5x vCPU without load testing.

**Reason**: Database processes connections efficiently up to ~2x vCPU count. Beyond that, context switching overhead increases, reducing throughput per connection. A 4-vCPU database with 8-12 pooled connections (2-3x vCPUs) achieves maximum throughput. With 100 connections, the database spends more time switching between connections than executing queries. The 2-3x ratio provides optimal throughput while maintaining headroom.

**Bad Example**: PgBouncer configured with default_pool_size = 100 for a 2-vCPU db.t4g.small RDS instance. The database has 2 vCPUs but receives up to 100 concurrent connections. Heavy context switching: average query time increases from 5ms to 50ms. Application throughput drops by 60%.

**Good Example**: PgBouncer default_pool_size = 6 (3x 2 vCPUs) for the same 2-vCPU database. Maximum 6 concurrent queries. Context switching is minimal. Average query time: 5ms. The pooler multiplexes 50 application connections through the 6 database connections efficiently.

**Exceptions**: For read replicas handling read-heavy workloads, pool size can be higher (4-5x vCPUs) since read queries are typically faster and less resource-intensive. For the primary writer, stay at 2-3x.

**Consequences Of Violation**: Over-sized pools degrade database performance due to context switching. The database appears saturated at 30% CPU because connection management overhead consumes internal resources. Throughput drops, query latency increases.

---

## R2: Monitor Connection Utilization with Alarm at 80%

**Category**: Capacity Monitoring

**Rule**: ALWAYS monitor active_connections / max_connections ratio for database connection pools. Configure an alarm at 80% utilization. NEVER run without connection utilization monitoring.

**Reason**: Connection exhaustion is a catastrophic failure mode — when all database connections are in use, new requests queue at the pooler or fail with "too many connections." Monitoring utilization at 80% provides 20% headroom for traffic spikes while giving enough warning to investigate. Without monitoring, connection exhaustion happens silently — the first sign is an outage.

**Bad Example**: A team has RDS Proxy configured with 200 max connections. Average utilization: 150 connections (75%). During a traffic spike, utilization hits 200. The next 20 connection requests fail with "too many connections." Users see errors. The team has no utilization monitoring — they discover the limit only after the outage.

**Good Example**: CloudWatch alarm triggers when RDS Proxy `ClientConnections` exceeds 160 (80% of 200). The team investigates, finds a connection leak from a recently deployed worker process, and fixes it. Utilization returns to 130. The 80% headroom prevented the leak from causing an outage.

**Exceptions**: For small databases (<10 max_connections), set the alarm at 70% — less headroom is available. For large pools (>500 connections), 90% is acceptable if the pool can grow dynamically.

**Consequences Of Violation**: Silent connection exhaustion causes production outages. Recovery requires terminating connections (potentially dropping in-flight transactions) or restarting the database.

---

## R3: Use Separate Pools for Read vs Write Connections

**Category**: Pool Architecture

**Rule**: ALWAYS configure separate connection pools for read queries (replica) and write queries (primary). NEVER use the same pool for both read and write operations.

**Reason**: Read-heavy queries (reports, listing pages, dashboards) can consume all connections in a shared pool, blocking write operations (order placement, user registration). Separate pools ensure write capacity is always available regardless of read query volume. The read pool can be larger (replicas handle more connections) while the write pool stays at 2-3x primary vCPUs.

**Bad Example**: A shared connection pool of 20 connections serves both reads and writes. A developer runs a heavy report that uses 15 connections for 30 seconds. The remaining 5 connections cannot handle incoming write requests — 10 order placements fail with "connection pool timeout." Revenue loss: $500.

**Good Example**: Primary pool: 10 connections (for writes). Read pool: 20 connections (for reports and reads). The heavy report uses 15 read pool connections — write pool remains at 0% utilization. All order placements succeed. No revenue impact.

**Exceptions**: For very small applications (<5 app servers, <1M requests/month), a single pool is acceptable because read and write competition is unlikely.

**Consequences Of Violation**: Read-heavy queries intermittently block write operations, causing failed transactions and revenue loss. The failure pattern is non-deterministic (depends on read load at the time of write), making it hard to diagnose.

---

## R4: Avoid Connection Leaks — Use PHP-FPM max_requests as Safety Net

**Category**: Leak Prevention

**Rule**: ALWAYS configure PHP-FPM's `max_requests` setting (recommended: 500-1000) to automatically recycle workers and close leaked connections. NEVER assume all application code correctly releases connections.

**Reason**: Laravel's DB facade releases connections at the end of each request, but custom code (event listeners, queued jobs, middleware) may hold connections longer than intended. Leaked connections accumulate in the pool, reducing available capacity. PHP-FPM's `max_requests` automatically terminates workers after N requests, closing all connections — this acts as a safety net. Without it, leaked connections accumulate until pool exhaustion.

**Bad Example**: A custom event listener opens a database cursor but does not close it on exception. Over 2 hours with 50 workers handling 10000 requests, 15 connections are leaked. Available pool capacity drops from 20 to 5. New requests start queueing. PHP-FPM has max_requests = 0 (unlimited) — workers never recycle, leaks never clear.

**Good Example**: PHP-FPM max_requests = 500. After 500 requests, the worker terminates and a new one starts, closing all connections. The 15 leaked connections are recovered within 2 worker cycles. Pool capacity remains at 20. The application continues serving requests normally.

**Exceptions**: For Laravel Octane, `max_requests` is handled by Octane's worker configuration (set `max_requests` in the Octane config). For queue workers, use Laravel Horizon's `maxTries` or `retryUntil` to limit job processing per worker.

**Consequences Of Violation**: Leaked connections accumulate and exhaust the pool. The pooler prevents new connections, causing errors. Without max_requests, the only recovery is manual database connection termination or pooler restart.

---

## R5: Right-Size Pool Based on Connection Duration — Short vs Long Transactions

**Category**: Duration-Based Sizing

**Rule**: ALWAYS size connection pools based on typical connection duration. Use higher multiplexing (ratio = 10:1 or higher) for short transactions (<100ms). Use lower multiplexing (ratio = 2:1 to 5:1) for long transactions (reports, exports).

**Reason**: Short transactions release connections quickly, allowing a small pool to serve many application connections. Long transactions hold connections for seconds or minutes — they require more pool capacity or lower multiplexing to avoid queueing. A pool sized for short transactions will exhaust under long transaction load.

**Bad Example**: A pool of 10 connections sized based on typical 50ms API queries. A new "export sales report" feature runs queries taking 30 seconds each. With 5 concurrent reports, 5 connections are held for 30 seconds. Remaining 5 connections must serve all normal API traffic. Queueing at the pooler increases from 0ms to 500ms average.

**Good Example**: Two separate pools: API pool (8 connections, multiplexing 10:1 for short queries) and Report pool (4 connections, multiplexing 2:1 for long queries). API traffic is isolated from report traffic. No queueing on critical path.

**Exceptions**: Use connection pooler features like `pool_timeout` (e.g., 5 seconds) to prevent requests from waiting indefinitely when long transactions consume pool capacity.

**Consequences Of Violation**: Long transactions silently degrade all database performance. A report export or data migration that holds connections for minutes can cause a site-wide slowdown because the connection pool is exhausted by a few long-running queries.
