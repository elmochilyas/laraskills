# RDS Proxy Pricing

## Metadata
- **ID**: KU-34-RDS-PROXY
- **Subdomain**: network-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: RDS Proxy Pricing
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
RDS Proxy costs ~$0.015/vCPU-hour ($21.60/month for db.m5.large), but has a hidden minimum charge of 8 ACUs (~$300/month) when used with Aurora Serverless v2. For provisioned RDS, the cost scales linearly with vCPU. RDS Proxy is most cost-effective for Lambda-backed applications that need connection pooling to prevent database connection exhaustion. For non-Lambda workloads with stable connection pools, PgBouncer (free) is cheaper.

## Core Concepts
- **Pricing model**: $0.015/vCPU-hour of underlying database instance
- **Provisioned example**: db.m5.large (2 vCPU) = $21.60/month
- **Aurora Serverless v2**: Min 8 ACU charge (~$300/month regardless of database size)
- **ROI**: Eliminates connection-related outages for Lambda->RDS patterns
- **Minimum charge**: 10-minute minimum per proxy status change

## When To Use
- Lambda-backed applications needing rapid connection scaling without exhausting DB connections
- Aurora Serverless v2 deployments requiring connection pooling (evaluate cost first)
- Multi-AZ deployments needing automatic failover handling for connections
- Applications requiring IAM authentication for database access
- Teams wanting fully managed connection pooling without operational overhead

## When NOT To Use
- Non-Lambda workloads with stable connection pools (use PgBouncer)
- Aurora Serverless v2: 8 ACU minimum charge (~$300/month) makes PgBouncer dramatically cheaper
- Low-traffic apps where connection pooling benefit doesn't offset $21/month minimum
- PostgreSQL databases where PgBouncer (free) is available and team has PostgreSQL expertise
- Single-AZ dev/staging environments where connection exhaustion is unlikely

## Best Practices
- **Use RDS Proxy for Lambda->RDS/Aurora patterns**: Lambda's rapid concurrency scaling exhausts DB connections without pooling (WHY: Lambda can scale to 1000 concurrent executions within seconds; each needs a DB connection; RDS Proxy pools these to 10-20 connections, preventing "too many connections" errors)
- **Avoid RDS Proxy with Aurora Serverless v2 unless necessary**: 8 ACU minimum charge = ~$300/month — often more than the database itself (WHY: RDS Proxy with Serverless v2 bills at 8 ACU minimum regardless of database size; a small $50/month serverless DB gets $300/month proxy bill; Better: use PgBouncer or native pooling for small Serverless v2 databases)
- **Enable ConnectionBorrowTimeout**: Set to 5 seconds to prevent requests waiting indefinitely for connections (WHY: without timeout, a request hangs forever when all connections are borrowed; 5s timeout fails fast with clear error)
- **Monitor RDS Proxy connections**: Track `DatabaseConnections` and `ClientConnections` CloudWatch metrics (WHY: rising ClientConnections indicates scaling pressure; plan pool size increase or evaluate PgBouncer alternative)
- **Right-size proxy for workload**: RDS Proxy auto-scales connections based on vCPU; larger DB instances get larger proxy capacity (WHY: proxy connection capacity scales with DB instance size; no need to oversize DB for connection capacity alone)

## Architecture Guidelines
- RDS Proxy for Lambda architectures requiring connection pooling with managed failover
- PgBouncer for stable EC2/ECS fleets where cost optimization is priority
- For Aurora Serverless v2: evaluate if RDS Proxy is needed or native pooling suffices
- Enable IAM database authentication for RDS Proxy to avoid storing passwords
- Place RDS Proxy in same VPC as application and database to minimize latency
- For multi-AZ RDS, RDS Proxy automatically handles failover with no application changes

## Performance Considerations
- RDS Proxy adds ~1-2ms latency per connection; negligible for most workloads
- Proxy auto-scales connections to meet demand; no manual pool sizing needed
- Connection reuse eliminates SSL/TLS handshake overhead (5-30ms)
- Maximum connections per proxy: 1000 default; can be increased via support request
- Cold start: RDS Proxy takes 10-30 seconds to become available after creation

## Security Considerations
- RDS Proxy supports IAM authentication for temporary credentials (more secure than passwords)
- Secrets Manager integration for database credential rotation
- Proxy automatically handles SSL/TLS encryption
- Audit logs for all connection attempts through the proxy
- No direct database access from applications; all traffic flows through proxy

## Common Mistakes
1. **Using RDS Proxy with Aurora Serverless v2 and discovering $300/month charge**: Small serverless DB ($50/month) + RDS Proxy ($300/month minimum) (Cause: RDS Proxy charges 8 ACU minimum for Serverless v2; Consequence: proxy costs 6x the database; Better: use PgBouncer or accept native connection limits)
2. **Using RDS Proxy for non-Lambda, non-critical apps**: 3 web servers with 30 workers each paying $21/month for proxy (Cause: "connection pooling is best practice"; Consequence: $21/month for unnecessary managed pooling; Better: PgBouncer on t4g.nano ($5/month) for stable fleets)
3. **Not enabling ConnectionBorrowTimeout**: Requests hang indefinitely when proxy pool is exhausted (Cause: default timeout is 0 = no timeout; Consequence: application freezes under load, no clear error; Better: set ConnectionBorrowTimeout = 5000ms)
4. **Over-provisioning DB instance for proxy connection capacity**: Choosing larger DB to get more proxy connections (Cause: not understanding proxy scales with DB vCPU; Consequence: paying for unused DB capacity; Better: use PgBouncer if proxy capacity limits are binding)

## Anti-Patterns
- **RDS Proxy for everything**: $21-300/month when PgBouncer is free
- **Serverless v2 + RDS Proxy without cost analysis**: $300/month proxy for $50/month database
- **No ConnectionBorrowTimeout**: Risk of application-wide freeze
- **RDS Proxy for MySQL on EC2**: RDS Proxy works with RDS/Aurora only; not for self-managed MySQL

## Examples
- **Lambda + RDS (50 concurrent, db.m5.large)**: RDS Proxy $21.60/month; prevents connection exhaustion; worthwhile
- **Aurora Serverless v2 (4 ACU)**: RDS Proxy $300/month + DB $120/month = $420/month vs PgBouncer $5/month + DB $120 = $125/month
- **Stable EC2 fleet (10 servers, 30 workers each)**: RDS Proxy $21.60/month vs PgBouncer $5/month; PgBouncer saves $16.60/month

## Related Topics
- PgBouncer Alternative (ku-35)
- Cross-AZ and NAT Gateway Cost (ku-36)
- Aurora Serverless v2 Pricing (ku-06 in database)

## AI Agent Notes
- Default: PgBouncer over RDS Proxy for stable fleets
- RDS Proxy for Lambda architectures only
- Serverless v2 + RDS Proxy: warn about 8 ACU minimum
- Enable ConnectionBorrowTimeout
- $21/month for provisioned, $300/month for Serverless v2
