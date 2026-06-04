# PgBouncer Alternative — Rules

## R1: Use PgBouncer for PostgreSQL, Not for MySQL

**Category**: Database Compatibility

**Rule**: ALWAYS use PgBouncer for PostgreSQL connection pooling. NEVER use PgBouncer for MySQL — it only supports PostgreSQL.

**Reason**: PgBouncer is a PostgreSQL-specific connection pooler. It communicates using the PostgreSQL wire protocol and has no MySQL support. For MySQL, use RDS Proxy (managed, $21-300/month) or ProxySQL (open-source, similar to PgBouncer). Using PgBouncer with MySQL simply does not work — the connection protocol is incompatible.

**Bad Example**: A Laravel team uses MySQL and deploys PgBouncer, expecting it to work with MySQL. The application cannot connect — PgBouncer rejects the connection. The team spends 2 hours debugging before realizing PgBouncer is PostgreSQL-only.

**Good Example**: PostgreSQL database: PgBouncer ($5/month EC2 + free software). MySQL database: RDS Proxy ($21/month) or ProxySQL (free software). The team matches the pooler to the database engine. No debugging wasted.

**Exceptions**: None. PgBouncer is PostgreSQL-only. If you switch from MySQL to PostgreSQL, you can then use PgBouncer.

**Consequences Of Violation**: PgBouncer does not connect to MySQL. Application downtime until the correct pooler is deployed. Waste of engineering time on incompatible configuration.

---

## R2: Use Transaction Mode for Most Laravel Workloads

**Category**: Pooling Mode

**Rule**: ALWAYS use PgBouncer's transaction pooling mode (`pool_mode = transaction`) for standard Laravel applications. ONLY use session pooling when the application uses session-dependent features (advisory locks, prepared statements, SET commands, temp tables).

**Reason**: Transaction pooling returns a connection to the pool after each transaction completes — this allows 500 application connections to use 10-20 database connections efficiently. Session pooling pins a connection to the application session, reducing multiplexing efficiency to 1:1. For most Laravel apps (which open a connection per request and release it after the response), transaction pooling provides maximum efficiency with no functional issues.

**Bad Example**: PgBouncer configured in session mode for a standard Laravel app. 50 PHP-FPM workers each hold a pinned session connection. PgBouncer maintains 50 server connections to PostgreSQL — no multiplexing benefit. The pooler adds latency but provides no connection savings.

**Good Example**: PgBouncer in transaction mode. 50 PHP-FPM workers share a pool of 10 database connections. Each request borrows a connection during its transaction, then returns it. 80% reduction in database connections. Same throughput.

**Exceptions**: Use session pooling when the application uses: advisory locks (`pg_advisory_lock`), `LISTEN`/`NOTIFY`, prepared statements (held across transactions), temporary tables, or `SET session` variables. Transaction pooling breaks these features because the connection context is lost between transactions.

**Consequences Of Violation**: Session-dependent features silently fail in transaction mode. Prepared statements disappear, advisory locks are released, UPDATE `SET` commands are lost. The application behaves unpredictably.

---

## R3: Run PgBouncer on t4g.nano ($5/Month) for Cost Optimization

**Category**: Deployment Cost

**Rule**: ALWAYS deploy PgBouncer on a t4g.nano EC2 instance ($5/month) for non-Lambda workloads. NEVER use RDS Proxy ($21-300/month) for stable, predictable connection patterns.

**Reason**: PgBouncer uses <100MB RAM and negligible CPU. A t4g.nano (0.5 vCPU, 0.5GB RAM, $0.0068/hour = ~$5/month) handles 500+ application connections with sub-millisecond latency. RDS Proxy for the same workload costs $21.60/month (db.m5.large) to $300/month (Aurora Serverless v2). PgBouncer on t4g.nano provides the same pooling functionality at 10-20% of the cost.

**Bad Example**: A team with 10 EC2 web servers (30 workers each = 300 connections) deploys RDS Proxy at $21.60/month. Connection pooling works well, but they're paying for managed pooling they could self-manage. Over 3 years: $777.60.

**Good Example**: The same team deploys PgBouncer on t4g.nano at $5/month. 300 connections multiplexed through 20 database connections. Same latency profile, same reliability. Over 3 years: $180. Savings: $597.60.

**Exceptions**: Use RDS Proxy instead of PgBouncer for: Lambda-backed applications (rapid connection scaling), IAM authentication requirements, Aurora Serverless v2 deployments, or teams without PostgreSQL operational expertise.

**Consequences Of Violation**: Paying 4-60x more for managed connection pooling when self-managed PgBouncer provides identical functionality at a fraction of the cost.

---

## R4: Configure reserve_pool to Prevent Pool Exhaustion Lockout

**Category**: Availability

**Rule**: ALWAYS configure a PgBouncer `reserve_pool` (2-5 connections) with a short timeout (2-5 seconds) to handle connection bursts. NEVER run PgBouncer without a reserve pool.

**Reason**: When the main pool is exhausted (all connections in use), new requests queue at PgBouncer. If the pool stays full for an extended period, requests can queue for minutes, causing application timeouts. A reserve pool with a short timeout (2-5s) allows administrative connections and burst connections to bypass the queue. This prevents complete application lockout during connection storms.

**Bad Example**: PgBouncer default_pool_size = 20, no reserve pool. A traffic spike exhausts all 20 connections. New requests queue at PgBouncer with no timeout. After 30 seconds, 200 requests are queued. Users see 30-second response times. Even an administrator cannot connect to diagnose. Complete meltdown.

**Good Example**: default_pool_size = 20, reserve_pool_size = 3, reserve_pool_timeout = 2. When all 20 connections are in use, new requests wait 2 seconds, then the reserve pool kicks in. 3 additional connections serve burst connections. Admin connections are always available. Queue time stays under 5 seconds.

**Exceptions**: For applications with very stable connection demand (no traffic spikes), the reserve pool is less critical. Still configure it as a safety net — the cost is 2-5 idle connections.

**Consequences Of Violation**: Complete application lockout during connection spikes. No requests can reach the database. No admin connections can diagnose the issue. Recovery requires restarting PgBouncer and terminating active connections.

---

## R5: Monitor PgBouncer Metrics — avg_wait_time, maxwait, Server Establishes

**Category**: Observability

**Rule**: ALWAYS monitor PgBouncer performance metrics (avg_wait_time, maxwait, total_server_establishes). ALERT on avg_wait_time > 10ms. NEVER run PgBouncer without monitoring.

**Reason**: PgBouncer silently queues connections when the pool is full. Without monitoring, pool exhaustion manifests as application slowdown with no clear cause. `avg_wait_time` rising indicates the pool size is too small for the connection demand. `maxwait` shows the worst-case queue time. `total_server_establishes` measures pool churn — high values indicate connections are created and destroyed too frequently, suggesting pool size or timeout misconfiguration.

**Bad Example**: A team deploys PgBouncer without monitoring. After a code deploy increases query duration (new N+1 problem), connections are held longer. The pool of 20 fills up. avg_wait_time grows from 0ms to 150ms. Users experience slow pages. The team investigates application code, database performance, and network — all normal. They spend 4 hours before checking PgBouncer.

**Good Example**: PgBouncer metrics exported to CloudWatch. Alert on avg_wait_time > 10ms. After the same deploy, avg_wait_time hits 15ms. The team receives the alert, checks PgBouncer, sees the pool is saturated, investigates database queries, and finds the N+1 issue. Fix time: 30 minutes.

**Exceptions**: For development environments, detailed PgBouncer monitoring is optional. For production, it is mandatory — PgBouncer is a critical path component.

**Consequences Of Violation**: Database connection queueing silently degrades application performance. The root cause (PgBouncer pool exhaustion) is invisible without monitoring, leading to hours of wasted investigation in the wrong tier.
