## Use Connection Pooling With PHP-FPM
---
## Architecture
---
Always use RDS Proxy (Aurora/MySQL) or PgBouncer (PostgreSQL) when running PHP-FPM with more than 10 workers connecting to the same database.
---
Each PHP-FPM worker holds a persistent database connection; 50 workers = 50 connections, risking max_connections exhaustion and "too many connections" errors during traffic spikes.
---
30 PHP-FPM workers → RDS Proxy → 10 database connections.
---
50 PHP-FPM workers directly connected to a database with max_connections=100.
---
Octane deployments reuse connections across requests, reducing total connections; single-worker dev/staging environments.
---
Connection exhaustion errors during traffic spikes, application outages, needlessly large database instances.
---
## Use Transaction Pooling for PHP-FPM
---
## Performance
---
Prefer transaction pooling mode for PgBouncer when connecting PHP-FPM to PostgreSQL; avoid session pooling unless the app uses session-level features.
---
Transaction pooling assigns connections per-transaction, maximizing multiplexing efficiency — 100 PHP workers can share 5 database connections; session pooling keeps connections open for the worker's lifetime.
---
PgBouncer: `pool_mode = transaction`, `default_pool_size = 8`.
---
PgBouncer in session pooling mode "to be safe" when the app doesn't use SET commands.
---
Apps that use SET SESSION, temporary tables, prepared statements, or other session-level features.
---
80% less connection multiplexing efficiency; more database connections than necessary.
---
## Set Pool Size to 2-3x Database vCPUs
---
## Performance
---
Always set connection pool size proportional to database vCPUs (2-3x), not proportional to application worker count.
---
The database processes connections with ~2x vCPU overhead; more active connections than this causes database context switching; fewer wastes connection slots.
---
2-vCPU database: PgBouncer default_pool_size = 4-6.
---
PgBouncer default_pool_size = 100 on a 2-vCPU database "to handle all workers."
---
RDS Proxy which auto-scales; manual pool sizing still needed for optimal performance.
---
Database overwhelmed by 100 active connections, query performance degradation.
---
## Enable RDS Proxy IAM Authentication
---
## Security
---
Always enable IAM authentication for RDS Proxy; never use database passwords for proxy connections.
---
IAM credentials are valid for 15 minutes, eliminate password rotation, integrate with Laravel's native RDS Proxy support, and provide audit trail of which IAM role connected.
---
Laravel config: `DB_HOST=proxy-endpoint`, enable IAM auth in RDS Proxy settings.
---
Using database username/password for RDS Proxy connections.
---
PgBouncer deployments which don't support IAM auth; use TLS + auth file instead.
---
Password rotation overhead, credential leaks, no audit trail of proxy connections.
---
## Monitor Connection Pool Utilization
---
## Monitoring
---
Always monitor DatabaseConnections metric on connection pools; set an alarm at 80% pool capacity.
---
Connection pool exhaustion happens silently and causes request queuing; monitoring reveals when the pool needs resizing and provides early warning for traffic spikes.
---
CloudWatch alarm: RDS Proxy DatabaseConnections > 80% max for 5 minutes.
---
No monitoring on connection pool utilization, assuming "it just scales."
---
Octane with connection reuse has lower connection churn; monitoring still recommended.
---
Silent request queuing, growing latency tail, connection timeout errors.
