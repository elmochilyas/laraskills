# Connection Limits Pricing

## Metadata
- **ID**: KU-06-CONNECTION-LIMITS-PRICING
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Connection Limits Pricing
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Database connection limits constrain how many simultaneous connections the database can handle. AWS RDS enforces `max_connections` based on instance memory (typically `DBInstanceClassMemory/12582880`). Running out of connections causes "too many connections" errors. Connection poolers (RDS Proxy, PgBouncer) reduce connection count, but also have associated costs. The relationship between connections, instance size, and cost is critical: larger instances have higher connection limits but also higher prices.

## Core Concepts
- **max_connections formula (MySQL)**: `LEAST({DBInstanceClassMemory/12582880}, 5000)`; directly tied to instance RAM
- **RDS Proxy cost**: $0.015/hour + $0.001 per vCPU-hour (~$11-30/month)
- **PgBouncer cost**: Free software; runs on t4g.nano (~$5/month)
- **Connection overload**: >200 connections on small instances (db.t4g.medium: max ~180) causes errors
- **Connection per worker**: Each PHP-FPM worker uses one DB connection; 50 workers = 50 connections
- **Serverless v2 connections**: Aurora Serverless v2 scales connections based on ACU range

## When To Use
- Connection pooler: Any production app with >20 PHP-FPM workers hitting same database
- RDS Proxy: Managed solution for MySQL/Aurora; IAM auth; failover handling
- PgBouncer: PostgreSQL; lower cost than RDS Proxy; more configuration control
- Monitor connections: Any database with connection count > 50% of max_connections
- Instance sizing for connections: Choose instance size based on max_connections, not just CPU/memory

## When NOT To Use
- No pooler for <10 workers: Single app server with 10 connections; max_connections is fine
- RDS Proxy for single-AZ dev: $11-30/month for dev environment where "too many connections" rarely occurs
- PgBouncer for MySQL: Use RDS Proxy or ProxySQL for MySQL; PgBouncer is PostgreSQL-only
- Over-sizing instance for connections: Don't go from t4g.medium to t4g.large just for 50 more connections (use pooler instead)

## Best Practices
- **Calculate max_connections for your instance**: `max_connections = RAM_in_bytes / 12582880` (MySQL); for 4GB RAM = ~340 connections (WHY: connection count per worker is primary constraint; without pooler, max_connections must exceed sum of all PHP workers)
- **Use RDS Proxy for at-scale deployments**: $15-30/month to handle 1000+ app connections to database (WHY: PHP-FPM workers multiply; 20 servers x 50 workers = 1000 connections; RDS Proxy pools to 10-20 DB connections; $15/month vs $200/month for larger database instance)
- **Monitor connection usage with CloudWatch**: `DatabaseConnections` metric; alarm at 80% of max_connections (WHY: prevents "too many connections" errors; pooler takes 1-2 minutes to warm up; alarm gives time to react)
- **Right-size based on connection budget not just compute**: For apps with many workers (Octane, high concurrency), connection limit may force larger instance (WHY: maximizing connections per dollar may mean choosing instance with better connection/price ratio)
- **Use connection pooler before upgrading instance**: If approaching connection limit, add RDS Proxy before resizing (WHY: RDS Proxy costs $15-30/month vs resizing from r7g.large to r7g.xlarge costs $50-100/month more)
- **Set max_connections explicitly in parameter group**: Override default to match workload, but stay within instance memory constraints (WHY: default may be too conservative; increasing max_connections uses ~2MB per connection; 4GB instance can safely handle ~2000 connections if memory allows)

## Architecture Guidelines
- Choose instance with `max_connections` > 2x expected peak connections (without pooler)
- With RDS Proxy: Instance max_connections = 50-200 (proxy handles burst)
- For Aurora Serverless v2: Connection scaling based on ACU; RDS Proxy recommended
- For PostgreSQL: Use PgBouncer transaction pooling; default_pool_size = 2-3x vCPUs
- Monitor at application level: Laravel should catch connection errors and retry
- Set connection timeout in Laravel: `'options' => [PDO::ATTR_TIMEOUT => 5]` (5 seconds)

## Performance Considerations
- Each open connection uses ~2-10MB memory (depending on configuration)
- Connection creation time: 5-30ms (TCP + SSL + auth); pooler eliminates this
- MySQL max_connections includes replication connections (reserve 5% for replication)
- Too many connections > 200 on small instance causes context switching at database level
- Connection pooler memory overhead: RDS Proxy uses 0.5-2GB memory for pooling

## Security Considerations
- RDS Proxy IAM auth generates temporary credentials (more secure than stored passwords)
- PgBouncer auth_file should have restrictive permissions (0600)
- Monitor for connection flood attacks (rapid connection creation)
- Connection pooler logs connection attempts for audit trail
- Enable TLS for all database connections (including through pooler)

## Common Mistakes
1. **No connection limit planning**: App scales to 50 workers, database max_connections is 80, errors at 50 workers + background jobs (Cause: never calculated max_connections; Consequence: "too many connections" errors at peak; Better: calculate: 50 web + 10 queue + 10 admin = 70 connections; need max_connections > 80)
2. **Upgrading instance solely for connections**: Resizing from r7g.large (max 600 connections) to r7g.xlarge (1200) for $100+/month more (Cause: connection limit hit; Consequence: paying for CPU/memory you don't need; Better: add RDS Proxy for $15/month, keep same instance)
3. **Not reserving connections for admin**: Using 95% of max_connections for application, leaving no room for admin queries or backups (Cause: connecting every worker to database; Consequence: unable to connect for maintenance during peak; Better: reserve 10-20% of max_connections for admin/super users)

## Anti-Patterns
- **Setting max_connections to 10000 on small instance**: Allocating more connections than memory supports; OOM risk
- **No connection timeout**: Laravel hangs indefinitely waiting for connection; blocks PHP workers
- **Sharing max_connections budget across apps**: Multiple apps hitting same database instance; one app can starve others
- **Ignoring RDS Proxy cost**: $15/month for proxy vs $100/month for larger instance; proxy is cheaper

## Examples
- **Small app (2 web servers, 25 workers each)**: 50 connections; db.t4g.medium (max 180 connections); no pooler needed
- **Medium app (10 web servers, 30 workers each)**: 300 connections; db.r7g.large (max 600); add RDS Proxy to pool to 20 connections
- **Large app (20 web servers, 50 workers each)**: 1000 connections; RDS Proxy pools to 30 connections; db.r7g.xlarge with max_connections = 100

## Related Topics
- Connection Pool Sizing (ku-01 in connection-pooling)
- Serverless Database (ku-07)
- Read Replicas Cost (ku-05)

## AI Agent Notes
- Default: calculate max_connections before deployment
- Default: use RDS Proxy before upgrading database instance for connections
- Reserve 10-20% of connection budget for admin

## Verification
- [ ] max_connections calculated for instance size
- [ ] Connection pooler (RDS Proxy/PgBouncer) configured for >50 workers
- [ ] Connection utilization alarm at 80%
- [ ] Admin connections reserved (10-20% of max)
- [ ] Connection timeout configured in Laravel (5s)
- [ ] Connection pooler cost-benefit analyzed vs instance upgrade
