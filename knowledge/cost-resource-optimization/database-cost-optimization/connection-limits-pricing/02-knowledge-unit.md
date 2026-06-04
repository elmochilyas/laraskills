# KU-06-CONNECTION-LIMITS-PRICING: Connection Limits Pricing

## Metadata
- **ID**: KU-06-CONNECTION-LIMITS-PRICING
- **Subdomain**: Database Cost Optimization
- **Topic**: Connection Limits Pricing
- **Source**: Database Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Database connection limits constrain how many simultaneous connections the database can handle. AWS RDS enforces `max_connections` based on instance memory (typically `DBInstanceClassMemory/12582880`). Running out of connections causes "too many connections" errors. Connection poolers (RDS Proxy, PgBouncer) reduce connection count, but also have associated costs. The relationship between connections, instance size, and cost is critical: larger instances have higher connection limits but also higher prices.

## Core Concepts
- **max_connections formula (MySQL)**: `LEAST({DBInstanceClassMemory/12582880}, 5000)`; directly tied to instance RAM
- **RDS Proxy cost**: $0.015/hour + $0.001 per vCPU-hour (~$11-30/month)
- **PgBouncer cost**: Free software; runs on t4g.nano (~$5/month)
- **Connection overload**: >200 connections on small instances (db.t4g.medium: max ~180) causes errors
- **Connection per worker**: Each PHP-FPM worker uses one DB connection; 50 workers = 50 connections
- **Serverless v2 connections**: Aurora Serverless v2 scales connections based on ACU range

## Mental Models
- Default: calculate max_connections before deployment
- Default: use RDS Proxy before upgrading database instance for connections
- Reserve 10-20% of connection budget for admin

## Internal Mechanics
- Each open connection uses ~2-10MB memory (depending on configuration)
- Connection creation time: 5-30ms (TCP + SSL + auth); pooler eliminates this
- MySQL max_connections includes replication connections (reserve 5% for replication)
- Too many connections > 200 on small instance causes context switching at database level
- Connection pooler memory overhead: RDS Proxy uses 0.5-2GB memory for pooling

## Patterns
- Calculate max_connections for your instance
- Use RDS Proxy for at-scale deployments
- Monitor connection usage with CloudWatch
- Right-size based on connection budget not just compute
- Use connection pooler before upgrading instance
- Set max_connections explicitly in parameter group

## Architectural Decisions
- Choose instance with `max_connections` > 2x expected peak connections (without pooler)
- With RDS Proxy: Instance max_connections = 50-200 (proxy handles burst)
- For Aurora Serverless v2: Connection scaling based on ACU; RDS Proxy recommended
- For PostgreSQL: Use PgBouncer transaction pooling; default_pool_size = 2-3x vCPUs
- Monitor at application level: Laravel should catch connection errors and retry
- Set connection timeout in Laravel: `'options' => [PDO::ATTR_TIMEOUT => 5]` (5 seconds)

## Tradeoffs
**When To Use:**
- Connection pooler: Any production app with >20 PHP-FPM workers hitting same database
- RDS Proxy: Managed solution for MySQL/Aurora; IAM auth; failover handling
- PgBouncer: PostgreSQL; lower cost than RDS Proxy; more configuration control
- Monitor connections: Any database with connection count > 50% of max_connections
- Instance sizing for connections: Choose instance size based on max_connections, not just CPU/memory

**When NOT To Use:**
- No pooler for <10 workers: Single app server with 10 connections; max_connections is fine
- RDS Proxy for single-AZ dev: $11-30/month for dev environment where "too many connections" rarely occurs
- PgBouncer for MySQL: Use RDS Proxy or ProxySQL for MySQL; PgBouncer is PostgreSQL-only
- Over-sizing instance for connections: Don't go from t4g.medium to t4g.large just for 50 more connections (use pooler instead)

## Performance Considerations
- Each open connection uses ~2-10MB memory (depending on configuration)
- Connection creation time: 5-30ms (TCP + SSL + auth); pooler eliminates this
- MySQL max_connections includes replication connections (reserve 5% for replication)
- Too many connections > 200 on small instance causes context switching at database level
- Connection pooler memory overhead: RDS Proxy uses 0.5-2GB memory for pooling

## Production Considerations
- RDS Proxy IAM auth generates temporary credentials (more secure than stored passwords)
- PgBouncer auth_file should have restrictive permissions (0600)
- Monitor for connection flood attacks (rapid connection creation)
- Connection pooler logs connection attempts for audit trail
- Enable TLS for all database connections (including through pooler)

## Common Mistakes
- **No connection limit planning**: App scales to 50 workers, database max_connections is 80, errors at 50 workers + background jobs (Cause: never calculated max_connections; Consequence: "too many connections" errors at peak; Better: calculate: 50 web + 10 queue + 10 admin = 70 connections; need max_connections > 80)
- **Upgrading instance solely for connections**: Resizing from r7g.large (max 600 connections) to r7g.xlarge (1200) for $100+/month more (Cause: connection limit hit; Consequence: paying for CPU/memory you don't need; Better: add RDS Proxy for $15/month, keep same instance)
- **Not reserving connections for admin**: Using 95% of max_connections for application, leaving no room for admin queries or backups (Cause: connecting every worker to database; Consequence: unable to connect for maintenance during peak; Better: reserve 10-20% of max_connections for admin/super users)

## Failure Modes
- **Setting max_connections to 10000 on small instance**: Allocating more connections than memory supports; OOM risk
- **No connection timeout**: Laravel hangs indefinitely waiting for connection; blocks PHP workers
- **Sharing max_connections budget across apps**: Multiple apps hitting same database instance; one app can starve others
- **Ignoring RDS Proxy cost**: $15/month for proxy vs $100/month for larger instance; proxy is cheaper

## Ecosystem Usage
- **Small app (2 web servers, 25 workers each)**: 50 connections; db.t4g.medium (max 180 connections); no pooler needed
- **Medium app (10 web servers, 30 workers each)**: 300 connections; db.r7g.large (max 600); add RDS Proxy to pool to 20 connections
- **Large app (20 web servers, 50 workers each)**: 1000 connections; RDS Proxy pools to 30 connections; db.r7g.xlarge with max_connections = 100

## Related Knowledge Units
- Connection Pool Sizing (ku-01 in connection-pooling)
- Serverless Database (ku-07)
- Read Replicas Cost (ku-05)

## Research Notes
Derived from Database Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.