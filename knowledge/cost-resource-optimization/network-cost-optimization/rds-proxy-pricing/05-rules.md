# RDS Proxy Pricing — Rules

## R1: Use RDS Proxy for Lambda → RDS/Aurora Architectures

**Category**: Lambda Integration

**Rule**: ALWAYS use RDS Proxy when connecting Lambda functions to RDS/Aurora databases. NEVER connect Lambda directly to RDS without a proxy.

**Reason**: Lambda can scale to hundreds of concurrent executions within seconds. Each execution needs a database connection. Without a proxy, this creates a "connection storm" — hundreds of connections open simultaneously, exhausting the database's `max_connections` limit and causing "too many connections" errors. RDS Proxy pools these into 10-20 database connections, preventing connection exhaustion while maintaining throughput. This is the primary use case where RDS Proxy's cost is justified.

**Bad Example**: A Laravel Vapor app (Lambda-based) connects directly to RDS. During a traffic spike, Lambda scales to 500 concurrent executions. 500 simultaneous database connections overwhelm the db.r6g.large (max_connections = 1000 but connection storm causes 500 connections in 2 seconds). Database CPU spikes, query performance degrades, and some connections are refused.

**Good Example**: RDS Proxy sits between Lambda and RDS. Lambda scales to 500 concurrent executions but RDS Proxy limits database connections to 20. All 500 Lambda invocations successfully borrow/release connections through the proxy. Database CPU remains stable. No connection errors.

**Exceptions**: For Lambda functions that make infrequent database calls (>1 minute between calls), the connection overhead may not justify RDS Proxy's $21/month minimum. Evaluate per-function connection patterns.

**Consequences Of Violation**: Lambda connection storms exhaust database connection limits. Applications experience intermittent "too many connections" errors during traffic spikes — exactly when reliability is most critical.

---

## R2: Avoid RDS Proxy with Aurora Serverless v2 Due to 8 ACU Minimum Charge

**Category**: Cost Awareness

**Rule**: ALWAYS evaluate the 8 ACU minimum charge (~$300/month) when considering RDS Proxy with Aurora Serverless v2. NEVER add RDS Proxy to Aurora Serverless v2 without understanding the cost floor.

**Reason**: RDS Proxy charges a minimum of 8 ACU (Aurora Capacity Units) for Aurora Serverless v2 — approximately $300/month, regardless of database size. A small $50/month serverless database with RDS Proxy costs $350/month total. The proxy becomes the dominant cost. For small-to-mid Serverless v2 databases, PgBouncer (free + $5/month compute) or native connection limits are more cost-effective.

**Bad Example**: A team deploys a small Aurora Serverless v2 database (1 ACU, ~$50/month) with RDS Proxy for connection pooling. Monthly bill: $50 (database) + $300 (proxy minimum) = $350/month. Connection pooling costs 6x the database. Over 12 months: $4,200.

**Good Example**: The same team deploys the Serverless v2 database without RDS Proxy and manages connection limits through the database's `max_connections` parameter and Lambda's reserved concurrency. For occasional connection pooling needs, they use PgBouncer on t4g.nano ($5/month). Total: $55/month. Savings: $295/month ($3,540/year).

**Exceptions**: If the Lambda workload requires rapid scaling to 1000+ concurrent executions AND the database is at least 8 ACU, the proxy charge is proportional to the database size and may be justified.

**Consequences Of Violation**: Paying $300/month minimum for RDS Proxy with a $50/month database. The proxy costs 6x the database — a clearly disproportionate expense that often goes unnoticed until the first bill.

---

## R3: Enable ConnectionBorrowTimeout (5 Seconds)

**Category**: Configuration Safety

**Rule**: ALWAYS set RDS Proxy `ConnectionBorrowTimeout` to 5 seconds (5000ms). NEVER leave the default timeout at 0 (no timeout — infinite wait).

**Reason**: When all connections in the proxy pool are in use, new requests wait for a connection to become available. With the default timeout of 0, requests wait indefinitely — the application hangs until a connection is released or the HTTP request times out. This creates a cascading failure: the application stops responding, health checks fail, and instances are replaced. A 5-second timeout fails fast with a clear error, allowing the application to return a 503 error immediately rather than hanging.

**Bad Example**: RDS Proxy with ConnectionBorrowTimeout = 0 (default). A database deadlock holds 20 connections for 30 seconds. All 20 proxy connections are in use. 50 new requests arrive, each waiting for a connection. After 10 seconds, 50 web server processes are blocked. ALB health checks timeout. ASG terminates instances. Cascading failure.

**Good Example**: ConnectionBorrowTimeout = 5000ms (5 seconds). Same deadlock, 20 connections held. 50 new requests each wait 5 seconds, then receive "connection borrow timeout" error. The application returns HTTP 503. ALB sees 503s, routes around unhealthy instances. The deadlock resolves after 30 seconds. Normal service resumes. No cascading failure.

**Exceptions**: For background queue workers that have retry logic, a longer timeout (10-15 seconds) may be acceptable since workers can wait longer than web requests.

**Consequences Of Violation**: Complete application freeze during connection pool exhaustion. No clear error is returned — the application silently hangs, appearing to be down. Recovery requires manual intervention to terminate blocked connections.

---

## R4: Monitor RDS Proxy Connections — Rising ClientConnections Signals Scaling Pressure

**Category**: Capacity Monitoring

**Rule**: ALWAYS monitor RDS Proxy `ClientConnections` and `DatabaseConnections` CloudWatch metrics. Investigate when `ClientConnections` approaches the proxy's maximum.

**Reason**: RDS Proxy auto-scales connection capacity but has limits (default 1000 connections, can be increased via support request). Rising `ClientConnections` indicates the application is requesting more connections. When it approaches the limit, new connections may be refused. Monitoring allows proactive capacity increase or application optimization before users are affected.

**Bad Example**: A Laravel app's traffic grows 50% month-over-month. RDS Proxy `ClientConnections` goes from 300 to 950 over 3 months. The proxy hits the 1000 connection limit. New connections are refused. Users see intermittent database errors. The team has no proxy monitoring — they discover the limit by the errors.

**Good Example**: CloudWatch alarming on RDS Proxy `ClientConnections` at 800 (80% of 1000 limit). The alarm fires, the team reviews the trend, and submits a support request to increase the proxy's connection limit to 2000. Zero user impact. The proactive monitoring caught the trend before it became a problem.

**Exceptions**: For small deployments with stable traffic (<200 ClientConnections), monthly review of proxy metrics is sufficient.

**Consequences Of Violation**: Connection limit exhaustion causes user-facing database errors. The application appears to have database connectivity issues, leading to support tickets, lost revenue, and unnecessary infrastructure debugging.

---

## R5: Right-Size Proxy for Workload — Don't Oversize Database for Proxy Capacity

**Category**: Cost Optimization

**Rule**: ALWAYS match RDS Proxy capacity to the underlying database instance size. NEVER over-provision the database instance just to get more proxy connection capacity.

**Reason**: RDS Proxy's connection capacity scales with the underlying database instance's vCPU count. A larger database instance provides more proxy connections but costs 2x for each size step. If the proxy's connection capacity is the binding constraint, adding a larger database increases costs significantly. Instead, use PgBouncer as a cheaper alternative when proxy capacity limits are binding.

**Bad Example**: A team needs 1500 proxy connections but has a db.r6g.large (2 vCPU, ~500 proxy connections). They upgrade to db.r6g.xlarge (4 vCPU, ~1000 proxy connections, $400/month). Still not enough. They upgrade to db.r6g.2xlarge (8 vCPU, ~2000 proxy connections, $800/month). The actual database workload only needs r6g.large. Database cost: 4x necessary because of proxy capacity needs.

**Good Example**: The team keeps db.r6g.large ($200/month) and deploys PgBouncer on t4g.nano ($5/month) for the additional connection pooling. Total: $205/month vs $800/month. PgBouncer handles 2000+ connections with no instance upgrade. Savings: $595/month.

**Exceptions**: If the application genuinely needs the larger database for query throughput (CPU/memory bound), the proxy capacity increase is a side benefit, not a cost driver.

**Consequences Of Violation**: Paying 2-4x more for database compute to satisfy RDS Proxy connection limits. The database is over-provisioned for its primary workload, with the excess capacity serving only the proxy's connection pool scale needs.
