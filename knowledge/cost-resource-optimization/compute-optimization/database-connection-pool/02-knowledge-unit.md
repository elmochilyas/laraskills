# KU-09-DATABASE-CONNECTION-POOL: Database Connection Pool

## Metadata
- **ID**: KU-09-DATABASE-CONNECTION-POOL
- **Subdomain**: Compute Optimization
- **Topic**: Database Connection Pool
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Database connection pooling reuses database connections across requests instead of creating a new connection per request. For Laravel, each PHP-FPM worker maintains its own database connection. Connection pools (RDS Proxy or PgBouncer) sit between the application and database, multiplexing connections to reduce database connection overhead and prevent connection exhaustion under load. Proper pooling reduces database CPU usage (fewer connection creations) and enables using smaller/cheaper database instances.

## Core Concepts
- **RDS Proxy**: AWS-managed connection pool for RDS/Aurora; $0.015/hour + $0.001/vCPU-hour; max 15 minutes idle
- **PgBouncer**: Open-source PostgreSQL connection pooler; can run on EC2 or RDS side; no AWS cost
- **Connection multiplexing**: Many client connections -> fewer database connections (e.g., 100 app connections -> 10 DB connections)
- **Transaction pooling**: Most efficient mode; connections assigned per-transaction (not per-session)
- **Session pooling**: Connection assigned per-session; maintains session state
- **Connection burst**: Under load, many PHP workers hit DB simultaneously; pool prevents max_connections exceeded

## Mental Models
- Default: recommend RDS Proxy for Aurora; PgBouncer for PostgreSQL
- Default pool size: 2-3x database CPU cores
- Check if app uses session-state features (SET, temp tables) before recommending transaction pooling

## Internal Mechanics
- RDS Proxy adds <1ms latency per connection (negligible)
- PgBouncer transaction pooling adds ~0.1ms latency
- Connection creation avoided: each PHP request saves 5-30ms of TCP handshake + MySQL auth
- Pool exhaustion: requests queue at pooler instead of failing with "too many connections" error
- Octane with RDS Proxy: persistent connections through Octane's lifecycle (no per-request connection)

## Patterns
- Use RDS Proxy for Aurora
- Use PgBouncer for PostgreSQL
- Set pool size to 2-3x database vCPUs
- Enable RDS Proxy IAM auth
- Monitor connection pool utilization

## Architectural Decisions
- Place RDS Proxy/PgBouncer in same VPC as application and database
- RDS Proxy must be in same VPC as RDS instance
- PgBouncer can run on EC2 (t4g.micro, ~$8/month) or alongside database
- Set max_connections in Postgres higher than default (200-500) for pooler management
- Configure pool_timeout to prevent long queue waits (default 5s; apps retry connection)
- Use separate pool sizes for read vs write connections

## Tradeoffs
**When To Use:**
- RDS Proxy: Production MySQL/Aurora with PHP-FPM (many workers = many connections)
- PgBouncer: PostgreSQL with PHP-FPM or Octane; lower cost than RDS Proxy
- Connection pooling: Any server with >10 PHP-FPM workers connecting to same database
- Serverless/auto-scaling: When worker count varies widely (prevents connection limit errors)
- Aurora Serverless v2: RDS Proxy required for connection management

**When NOT To Use:**
- RDS Proxy: For single-worker setups (dev, staging) where cost > benefit
- PgBouncer: For MySQL (MySQL has its own connection pool via SQLyog or ProxySQL)
- Connection pooling: Not needed if database max_connections > 2x PHP workers (no exhaustion risk)
- Transaction pooling for sessions: If app relies on session variables (SET SESSION commands); use session pooling instead

## Performance Considerations
- RDS Proxy adds <1ms latency per connection (negligible)
- PgBouncer transaction pooling adds ~0.1ms latency
- Connection creation avoided: each PHP request saves 5-30ms of TCP handshake + MySQL auth
- Pool exhaustion: requests queue at pooler instead of failing with "too many connections" error
- Octane with RDS Proxy: persistent connections through Octane's lifecycle (no per-request connection)

## Production Considerations
- RDS Proxy IAM auth requires TLS 1.2+ (enforced)
- PgBouncer should use TLS for client-to-pooler connections
- RDS Proxy automatically rotates credentials with IAM
- PgBouncer auth file should be restricted (600 permissions)
- RDS Proxy integrates with AWS Secrets Manager for password rotation

## Common Mistakes
- **Not using connection pooling with PHP-FPM**: 50 PHP workers = 50 database connections, hitting max_connections at 100 workers (Cause: assuming database handles all connections; Consequence: "too many connections" errors during traffic spikes; Better: RDS Proxy or PgBouncer pools connections to 5-10)
- **Transaction pooling with session dependencies**: Using SET commands, temporary tables, or prepared statements that persist across transactions (Cause: unaware of transaction pooler limitations; Consequence: corrupted session state, unexpected errors; Better: use session pooling or avoid session-dependent features)
- **Overly large pool size**: Setting PgBouncer default_pool_size = 100 on 2-vCPU database (Cause: "more pool = more throughput"; Consequence: database overwhelmed by 100 active connections; Better: default_pool_size = 2-4x vCPUs = 4-8 for 2-vCPU DB)

## Failure Modes
- **No pooling with Octane**: Octane workers hold persistent connections; without pooler, connections per worker multiply
- **Pooler on database server**: Running PgBouncer on same instance as PostgreSQL (competes for resources)
- **No monitoring on pool**: Connection pool exhaustion happens silently; causes request queuing

## Ecosystem Usage
- **RDS Proxy for Aurora**: RDS Proxy with 500 max_connections; 30 PHP-FPM workers multiplexed to 10 DB connections
- **PgBouncer for Postgres**: t4g.nano EC2 running PgBouncer ($5/month); tx_pool_mode; default_pool_size = 8
- **Octane + RDS Proxy**: 8 Octane workers -> RDS Proxy (8 connections) -> Aurora (8 connections, no increase)

## Related Knowledge Units
- Persistent Connections (ku-02 in connection-pooling)
- Connection Limits Pricing (ku-06 in database-cost-optimization)
- Region Data Affinity (ku-03 in connection-pooling)

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.