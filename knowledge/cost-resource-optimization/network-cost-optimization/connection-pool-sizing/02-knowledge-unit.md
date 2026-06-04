# KU-01-CONNECTION-POOL-SIZING: Connection Pool Sizing

## Metadata
- **ID**: KU-01-CONNECTION-POOL-SIZING
- **Subdomain**: Network Cost Optimization
- **Topic**: Connection Pool Sizing
- **Source**: Network Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Connection pool sizing determines the optimal number of database connections to maintain between application servers and the database. Too few connections cause queueing (requests wait for available connections). Too many connections overwhelm the database (CPU context switching, memory consumption). For Laravel with PHP-FPM, each worker typically holds one database connection. With Octane, connections persist and must be managed carefully. Correct pool sizing enables smaller database instances by preventing connection overload.

## Core Concepts
- **Connection pool**: Shared set of database connections multiplexed across application workers
- **RDS Proxy**: Managed AWS proxy with configurable max_connections; $0.015/hour + $0.001/vCPU-hour
- **PgBouncer**: Open-source PostgreSQL pooler with transaction/session modes
- **Default pool size**: Target connections per pool = 2-3x database vCPUs
- **Connection storm**: Many workers creating connections simultaneously during traffic spike
- **Multiplexing ratio**: Application connections : database connections (ideally 10:1 or higher)

## Mental Models
- Default: pool size = 2-3x database vCPUs
- For Aurora: recommend RDS Proxy (managed, simple)
- For PostgreSQL: recommend PgBouncer (free, mature)
- Monitor connection utilization with alarm at 80%

## Internal Mechanics
- Pooler overhead: RDS Proxy adds ~1ms per query; PgBouncer adds ~0.1ms
- Connection creation time saved: 5-30ms per request (TCP + MySQL auth)
- Pool exhaustion timeout: Requests wait at pooler instead of failing immediately (better user experience)
- Long transactions reduce effective multiplexing (connection held for entire transaction)
- Prepared statements with PgBouncer transaction pooling: must be limited or use session pooling

## Patterns
- Set pool size to 2-3x database vCPUs
- Monitor connection utilization
- Right-size pool based on connection duration
- Use separate pools for read vs write
- Avoid connection leaks

## Architectural Decisions
- RDS Proxy: max_connections = 80% of database max_connections (leave 20% for admin access)
- PgBouncer: default_pool_size = 2-3x vCPUs; reserve_pool_size = 0 (use for failover)
- Pooler on same AZ as application (cross-AZ latency adds 1-5ms)
- Configure pool_timeout = 5s (request waits 5s before failing with timeout)
- Set server_idle_timeout = 300s (close idle server connections after 5 minutes)
- Use connection pooler with both read and write replicas

## Tradeoffs
**When To Use:**
- RDS Proxy: Production Aurora/MySQL with PHP-FPM workers (>10 concurrent connections)
- PgBouncer: PostgreSQL with many workers; lower cost than RDS Proxy
- Transaction pooling: Default for PHP-FPM (connections released per transaction)
- Session pooling: For apps using session-state features (SET commands, temp tables)
- Pool sizing: Any database serving more than 20 concurrent connections

**When NOT To Use:**
- No pooler for 1-2 workers: Dev/staging with single connection; pooler adds cost without benefit
- RDS Proxy for PostgreSQL: RDS Proxy works with Aurora and RDS MySQL; PostgreSQL requires PgBouncer
- Transaction pooling with prepared statements: Prepared statements are session-scoped; transaction pooling breaks them
- Over-sizing pool: Pool size > 4x vCPUs causes database context switching issues

## Performance Considerations
- Pooler overhead: RDS Proxy adds ~1ms per query; PgBouncer adds ~0.1ms
- Connection creation time saved: 5-30ms per request (TCP + MySQL auth)
- Pool exhaustion timeout: Requests wait at pooler instead of failing immediately (better user experience)
- Long transactions reduce effective multiplexing (connection held for entire transaction)
- Prepared statements with PgBouncer transaction pooling: must be limited or use session pooling

## Production Considerations
- RDS Proxy IAM authentication: Credentials valid 15 minutes; integrates with Laravel
- PgBouncer auth: Use md5 authentication or LDAP; restrict auth file permissions
- TLS encryption: Enable between application, pooler, and database
- Network ACL: Pooler in private subnet, only accessible from application security groups
- Audit pooler logs for connection attempts (anomaly detection)

## Common Mistakes
- **Over-sized pool**: Setting PgBouncer default_pool_size = 100 for 2-vCPU database (Cause: "more connections = more capacity"; Consequence: 100 active connections overwhelm 2-vCPU database; context switching reduces throughput 30%+; Better: 6-8 connections for 2-vCPU DB)
- **No pool size monitoring**: Setting pool size to 25 and never checking utilization (Cause: set-and-forget configuration; Consequence: pool at 100% capacity, requests queueing, no alert; Better: monitor active_connections/max_connections with CloudWatch alarm)
- **Using RDS Proxy without IAM auth**: Storing database password in connection strings (Cause: default behavior; Consequence: password rotation requires deploy; Better: enable IAM auth, Laravel handles credential generation automatically)

## Failure Modes
- **No pooler with many workers**: 50 PHP-FPM workers connecting directly to database; 50 connections overwhelm small DB
- **Same pool size for all connections**: Read replicas can handle larger pools than primary writes
- **Unlimited pool size**: Setting no maximum; pool grows unbounded until database max_connections

## Ecosystem Usage
- **4-vCPU Aurora**: RDS Proxy, max_connections = 200, default_pool_size = 12, target utilization 60-80%
- **8-vCPU PostgreSQL**: PgBouncer, default_pool_size = 20, transaction pooling, 200 app connections multiplexed
- **Read replica pool**: PgBouncer on read replica mirror with default_pool_size = 50 (read queries can use more connections)

## Related Knowledge Units
- Persistent Connections (ku-02)
- Connection Limits Pricing (ku-06 in database-cost-optimization)
- RDS Proxy vs PgBouncer

## Research Notes
Derived from Network Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.