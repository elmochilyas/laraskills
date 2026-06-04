# PgBouncer Alternative

## Metadata
- **ID**: KU-35-PGBOUNCER
- **Subdomain**: network-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: PgBouncer Alternative
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
PgBouncer is free, open-source connection pooling software that runs on a small EC2 instance ($5-20/month compute). It provides comparable connection pooling to RDS Proxy at 10-20% of the cost. The tradeoffs: (1) Transaction mode breaks session-level features (advisory locks, prepared statements); (2) No IAM authentication; (3) Requires operational management. For non-Lambda workloads with stable connection pools, PgBouncer is the cost-effective choice.

## Core Concepts
- **Cost**: Free software + $5-20/month EC2 compute
- **vs RDS Proxy**: 10-20% of RDS Proxy cost
- **Modes**: Session mode (safe), Transaction mode (efficient but breaks some features)
- **Transaction mode traps**: Advisory locks, prepared statements, temp tables, SET commands
- **Best for**: Non-Lambda workloads, stable connection pools, cost-sensitive teams

## When To Use
- PostgreSQL databases with stable, predictable connection patterns
- Cost-sensitive teams where RDS Proxy's $15-100/month doesn't justify managed connection pooling
- EC2 or ECS-based deployments with control over infrastructure
- Teams with PostgreSQL experience comfortable managing pooling config
- Non-Lambda workloads where connection bursts are manageable

## When NOT To Use
- Lambda-backed applications needing rapid connection scaling (use RDS Proxy)
- MySQL databases (PgBouncer is PostgreSQL-only; use ProxySQL or RDS Proxy)
- Applications requiring session-level features through pooler (advisory locks, LISTEN/NOTIFY)
- Teams without operational capacity to monitor and update PgBouncer
- Aurora Serverless v2: RDS Proxy required for connection scaling

## Best Practices
- **Use transaction mode for most Laravel workloads**: Set `pool_mode = transaction` for efficient connection reuse (WHY: Laravel typically opens a connection per request; transaction mode releases connection back to pool after each transaction; allows 1000 app connections to use 10-20 DB connections)
- **Set default_pool_size to 2-3x CPU cores**: On a 4-vCPU database, set to 8-12 connections (WHY: fewer connections than CPU cores leaves CPU idle; more than 3x causes contention; 2-3x vCPUs maximizes throughput)
- **Run PgBouncer on the database server or dedicated tiny EC2**: Colocate on RDS instance (if same host allowed) or use t4g.nano at $5/month (WHY: PgBouncer uses <100MB RAM and negligible CPU; running on t4g.nano costs $5/month vs RDS Proxy $21-300/month)
- **Use session mode for apps with prepared statements**: Switch to `pool_mode = session` only when transaction mode breaks functionality (WHY: session mode pins a connection to the app session; it's safer but reduces pooling efficiency; use selectively)
- **Monitor PgBouncer metrics**: Track `total_server_establishes`, `avg_wait_time`, and `maxwait` (WHY: rising avg_wait_time indicates pool size is too small; frequent server establishes indicate pool churn)

## Architecture Guidelines
- PgBouncer on EC2/ECS sidecar for stable Laravel deployments
- RDS Proxy for Lambda-backed, serverless, or IAM-auth-required applications
- For high-traffic (>1000 req/s), use RDS Proxy for managed scaling
- For cost-optimized, use PgBouncer on t4g.nano ($5/month)
- Configure `reserve_pool` for administrative connections (prevents pool exhaustion lockout)
- Use `server_idle_timeout = 300` seconds to release idle connections

## Performance Considerations
- PgBouncer adds <0.5ms latency per connection (negligible)
- Transaction mode: 2-5x more efficient than session mode
- Connection reuse eliminates SSL handshake per request (5-30ms savings)
- Each connection consumes ~2KB in PgBouncer memory; 1000 connections = 2MB
- Default pool of 20 connections handles 500+ concurrent Laravel workers

## Security Considerations
- PgBouncer `auth_file` should have permissions 0600
- Enable TLS in PgBouncer config for encrypted connections to database
- PgBouncer logs connection attempts; monitor for unusual patterns
- No IAM authentication support; use database passwords (store in Secrets Manager)
- Run PgBouncer in private subnet; restrict access via security groups

## Common Mistakes
1. **Using transaction mode with session-dependent features**: Prepared statements, advisory locks, temp tables fail silently (Cause: transaction mode releases connection after each transaction; Consequence: prepared statements disappear, advisory locks are lost, temp tables vanish; Better: use session mode for apps needing these features)
2. **Pool size too small causing queueing**: Default pool of 20 connections with 500 concurrent workers (Cause: not calculating required pool size; Consequence: queries queue at PgBouncer; avg_wait_time spikes; Better: set pool_size = 2-3x database vCPUs, monitor maxwait)
3. **Not configuring reserve_pool**: Pool of 20 connections full, new connections queue (Cause: no fallback for burst traffic; Consequence: application waits indefinitely for connection; Better: set reserve_pool_size = 5, reserve_pool_timeout = 2s)
4. **Deploying without monitoring**: PgBouncer silently queues connections without alerting (Cause: no metrics exported; Consequence: application slow under pool pressure, no visibility; Better: enable PgBouncer stats endpoint, monitor via Prometheus)

## Anti-Patterns
- **PgBouncer on the same server without resource limits**: Can compete with app for memory
- **No auth_file configured**: Running with trust authentication in production
- **Using PgBouncer with MySQL**: PgBouncer is PostgreSQL-only; won't work
- **Not patching PgBouncer**: Like all software, it has security updates

## Examples
- **Small Laravel (2 web servers, 25 workers each)**: 50 app connections -> PgBouncer pool of 10 DB connections; t4g.nano ($5/month) + PgBouncer (free) = $5/month vs RDS Proxy $21/month
- **Medium (10 web servers, 50 workers each)**: 500 app connections -> PgBouncer pool of 20 DB connections; t4g.nano ($5/month) = $5/month vs RDS Proxy $21-300/month
- **Lambda-backed (100 concurrent Lambdas)**: Use RDS Proxy ($15-21/month); PgBouncer can't handle rapid connection scaling

## Related Topics
- RDS Proxy Pricing (ku-34)
- Cross-AZ and NAT Gateway Cost (ku-36)
- Connection Pool Sizing (ku-01 in network-cost)

## AI Agent Notes
- Default: PgBouncer for PostgreSQL, non-Lambda workloads
- Use transaction mode for regular Laravel apps
- Deploy on t4g.nano for $5/month
- Set pool_size = 2-3x database vCPUs
- Always configure reserve_pool for admin access
