---
## Rule Name
Calculate max_connections Before Deployment

## Category
Architecture

## Rule
Calculate `max_connections` for the chosen RDS instance size before deploying any Laravel application. Ensure it exceeds the total expected worker count (web + queue + admin).

## Reason
Running out of connections causes "too many connections" errors and application downtime. Each PHP-FPM worker holds one database connection.

## Bad Example
Deploying 50 PHP-FPM workers on a db.t4g.medium with default max_connections (~180). Workers + queue + admin = 70 connections. Fine initially, but growing to 100 workers = disaster.

## Good Example
```php
// max_connections = RAM_in_bytes / 12582880
// 4GB RAM = 4,294,967,296 / 12,582,880 = ~340 connections
// 50 web + 10 queue + 10 admin = 70 connections. Safe.
```

## Exceptions
When using RDS Proxy or PgBouncer, which multiplex connections and reduce direct connection needs by 90%.

## Consequences Of Violation
Application-outages during traffic spikes as connections exhaust. Emergency scaling to a larger instance costs $50-200+/month more.

---
## Rule Name
Use Connection Pooler Before Upgrading Database Instance

## Category
Cost Management

## Rule
When approaching the connection limit, add RDS Proxy ($15-30/month) or PgBouncer ($5/month) before upgrading to a larger database instance.

## Reason
Connection exhaustion is a connection-count problem, not a compute problem. A pooler solves it for $15-30/month. Resizing the instance costs $50-200+/month for CPU and memory you may not need.

## Bad Example
db.r7g.large (max 600 connections) at 500 connections. Team upgrades to r7g.xlarge ($100/month more). CPU is at 20%. Team pays $1200/year for unused capacity.

## Good Example
Adds RDS Proxy ($15/month). Pools 500 app connections into 20 DB connections. No instance upgrade needed. Saves $1020/year.

## Exceptions
When the database is also CPU or memory constrained (verified via CloudWatch), not just connection-constrained.

## Consequences Of Violation
Paying $50-200+/month for compute capacity that only solves a connection-pooling problem. A pooler would solve it for 80-90% less.

---
## Rule Name
Reserve 10-20% of Connection Budget for Admin Access

## Category
Reliability

## Rule
Never allow the application to consume more than 80% of `max_connections`. Reserve the remaining 20% for administrative queries, monitoring, and failover operations.

## Reason
When all connections are consumed by the application, engineers cannot connect to diagnose issues. Backups and monitoring tools fail.

## Bad Example
Application uses 180 of 200 max_connections. Database has an issue. Engineer tries to connect: "too many connections". Cannot run `SHOW PROCESSLIST` or kill queries.

## Good Example
Application connection pool capped at 80% of max_connections (160 of 200). 40 connections reserved for admin, monitoring, and replication.

## Exceptions
When using a dedicated connection pooler that separates admin connections from application connections.

## Consequences Of Violation
Inability to connect during emergencies. Every connection exhaustion event becomes a prolonged outage.

---
## Rule Name
Monitor Connection Utilization at 80% Threshold

## Category
Reliability

## Rule
Create a CloudWatch alarm on `DatabaseConnections` that fires when connection count exceeds 80% of `max_connections`. Alert on-call immediately.

## Reason
Connections can spike rapidly during traffic surges. An 80% alarm gives 5-10 minutes to react before exhaustion occurs. The pooler takes 1-2 minutes to warm up.

## Bad Example
No connection monitoring. Traffic spike causes connection exhaustion. Users see 500 errors for 10 minutes while the team discovers the issue.

## Good Example
CloudWatch alarm at 80% of max_connections. When connections hit 80%, on-call is alerted. They can add a connection pooler or kill idle connections before exhaustion.

## Exceptions
No common exceptions. Connection monitoring is a basic reliability practice.

## Consequences Of Violation
Complete loss of database connectivity for the application. All requests fail. Recovery requires manual intervention to kill connections.

---
## Rule Name
Set Explicit max_connections in Parameter Group

## Category
Maintainability

## Rule
Override the default `max_connections` in a custom DB parameter group. Calculate the safe maximum based on instance memory, not the default value.

## Reason
RDS default `max_connections` varies by instance family and may be too conservative or too aggressive. Setting it explicitly ensures predictable behavior.

## Bad Example
Using default max_connections. After an instance resize from db.r7g.large to db.r7g.xlarge, max_connections doubles automatically. No one updates the application's pool size, leading to connection oversubscription.

## Good Example
Custom parameter group with `max_connections` explicitly set to 600. Instance resizing does not change the value. Application pool configuration remains stable.

## Exceptions
When using Aurora Serverless v2, where connection scaling is managed by the serverless compute layer.

## Consequences Of Violation
Unexpected connection behavior after instance resizing. Default values may not match application requirements.

---
## Rule Name
Set Connection Timeout in Laravel Configuration

## Category
Reliability

## Rule
Configure PDO connection timeout to 5 seconds in `config/database.php`. Never leave the default infinite timeout.

## Reason
Without a timeout, a database connection attempt blocks the PHP worker indefinitely. All workers eventually block, freezing the application.

## Bad Example
```php
// No timeout set. Database is down. All 50 PHP workers block on connection attempts.
// Application is completely frozen until MySQL timeout (default: 28800 seconds = 8 hours).
```

## Good Example
```php
'mysql' => [
    'driver' => 'mysql',
    'options' => [
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ],
],
```
Failed connections fail fast (5 seconds), freeing the worker to handle other requests.

## Exceptions
Long-running import scripts or CLI commands where a longer timeout is acceptable.

## Consequences Of Violation
A database outage cascades to a complete application freeze. Recovery requires restarting PHP-FPM, increasing MTTR by hours.

---
## Rule Name
Use RDS Proxy for At-Scale Deployments

## Category
Architecture

## Rule
Deploy RDS Proxy when the total application worker count exceeds 200 connections. Use PgBouncer for PostgreSQL as a lower-cost alternative.

## Reason
200 direct connections to a database instance begins to cause context switching overhead at the database level. A pooler multiplexes these into 20-50 connections.

## Bad Example
20 web servers × 25 workers = 500 direct database connections. No pooler. Database CPU at 60% from context switching, not query work. Instance upgrade costs $200/month.

## Good Example
RDS Proxy pooling 500 app connections into 20 DB connections. Database CPU drops to 20%. No instance upgrade needed. RDS Proxy costs $15/month.

## Exceptions
Single-server deployments with <20 total workers where connection pressure is not a concern.

## Consequences Of Violation
Database spends CPU cycles on connection management instead of query execution. Premature instance upgrades waste $100-500+/month.
