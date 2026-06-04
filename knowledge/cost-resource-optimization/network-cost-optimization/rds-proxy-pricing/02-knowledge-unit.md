# K34: RDS Proxy Pricing

## Metadata
- **ID**: K34
- **Subdomain**: Connection Pooling & Network Cost
- **Topic**: RDS Proxy Pricing
- **Source**: AWS Documentation, GoCloud (2026)
- **Reliability**: High

## Executive Summary
RDS Proxy costs ~$0.015/vCPU-hour ($21.60/month for db.m5.large), but has a hidden minimum charge of 8 ACUs (~$300/month) when used with Aurora Serverless v2. For provisioned RDS, the cost scales linearly with vCPU. RDS Proxy is most cost-effective for Lambda-backed applications that need connection pooling to prevent database connection exhaustion. For non-Lambda workloads with stable connection pools, PgBouncer (free) is cheaper.

## Core Concepts
- **Pricing model**: $0.015/vCPU-hour of underlying database instance
- **Provisioned example**: db.m5.large (2 vCPU) = $21.60/month
- **Aurora Serverless v2**: Min 8 ACU charge (~$300/month regardless of database size)
- **ROI**: Eliminates connection-related outages for LambdaÃ¢â€ â€™RDS patterns
- **Minimum charge**: 10-minute minimum per proxy status change

## Mental Models
- **RDS Proxy as insurance**: You pay for it to prevent connection-related outages, not to save money
- **Convenience fee**: RDS Proxy is the managed, premium option vs PgBouncer's free but DIY approach

## Ecosystem Usage

- **Laravel Forge**: Deploys servers within same AZ by default; cross-AZ placement requires manual VPC configuration\n- **Laravel Vapor**: Vapor-managed VPC with NAT Gateway; Vapor abstracts network cost but passes through to AWS billing\n- **Laravel Cloud**: Fargate-based with RDS Proxy integration for database connection management\n- **Laravel Octane**: Each Octane worker maintains persistent database connections; connection pooling is essential

## Performance Considerations

- NAT Gateway adds ~1-3ms latency per packet; VPC endpoints add <1ms\n- RDS Proxy adds ~1-2ms per database connection; negligible for most workloads\n- Cross-AZ latency: within same region, <2ms; acceptable for synchronous operations but adds to tail latency\n- Connection pooling (RDS Proxy/PgBouncer) reduces connection establishment overhead from ~10ms to <1ms

## Production Considerations

- Use VPC endpoints for S3, DynamoDB, ECR, CloudWatch to minimize NAT Gateway data processing\n- Monitor NAT Gateway BytesProcessed and ActiveConnections; right-size or split across AZs if needed\n- RDS Proxy: enable ConnectionBorrowTimeout to prevent requests waiting indefinitely for connections\n- PgBouncer: configure pool_mode=transaction for most Laravel workloads; session mode for prepared statements

## Failure Modes

- NAT Gateway bandwidth saturation: 10Gbps limit for largest gateway; traffic spikes may drop packets; monitor BytesProcessed\n- RDS Proxy max connections: default 1000 connections per proxy; plan for scale if using with many Fargate tasks\n- PgBouncer memory exhaustion: each pooled connection consumes ~2KB; memory is rarely an issue but monitor\n- Cross-AZ data transfer cost surprise: unaccounted multi-AZ traffic can significantly increase monthly bills

## Architectural Decisions

- NAT Gateway vs VPC endpoints: use VPC endpoints for AWS services to avoid NAT costs\n- RDS Proxy vs PgBouncer: RDS Proxy is AWS-managed (.015/hour) vs PgBouncer on EC2 (free + EC2 cost)\n- Single-AZ vs Multi-AZ: Multi-AZ doubles NAT Gateway costs; evaluate if HA justifies the network cost\n- Cross-AZ vs same-AZ: place application and database in same AZ unless HA requires different AZs

## Tradeoffs

- **NAT Gateway vs VPC endpoints**: VPC endpoints have hourly charge but no data processing fee; cheaper for high-volume AWS traffic\n- **RDS Proxy vs PgBouncer**: Managed (.015/hour) vs self-managed (EC2 cost + maintenance)\n- **Single-AZ vs Multi-AZ**: Lower network cost vs higher availability and fault tolerance\n- **PrivateLink vs NAT**: Secure private connectivity vs internet-based with NAT processing fees

## Patterns

- Minimize NAT Gateway count: one per AZ is required but avoid unnecessary AZ expansion\n- Use VPC endpoints for AWS services (S3, DynamoDB, ECR) to avoid NAT Gateway data processing charges\n- Consolidate workloads in same AZ to reduce cross-AZ data transfer\n- RDS Proxy: use with Lambda/Fargate to manage connection bursts without scaling RDS connections\n- PgBouncer alternative: self-managed connection pooling on EC2/ECS for Postgres at lower cost than RDS Proxy

## Internal Mechanics

NAT Gateway costs .045/hour per AZ plus .045/GB data processed. Each AZ typically needs its own NAT Gateway to avoid cross-AZ data transfer charges. Data transfer between AZs within same VPC costs .01-0.02/GB each way. RDS Proxy costs .015/hour per Aurora instance plus data processing charges. Connection pooling reduces database connection overhead by reusing connections across application requests.

## Common Mistakes

- Running multiple NAT Gateways without evaluating if cross-AZ traffic justifies the cost\n- Not using VPC endpoints for high-volume AWS services (S3, ECR, DynamoDB), resulting in unnecessary NAT costs\n- Placing application and database in different AZs without accounting for cross-AZ data transfer costs\n- Using RDS Proxy for low-traffic apps where connection pooling benefit doesn't offset hourly cost\n- Not right-sizing NAT Gateway: smallest size (1Gbps) is sufficient for most Laravel applications

## Related Knowledge Units
- K35: PgBouncer Alternative
- K06: Aurora Serverless v2 Pricing

## Research Notes
RDS Proxy's 8 ACU minimum with Aurora Serverless v2 is a significant cost trap. Many teams enable Serverless v2 + RDS Proxy and discover a $300/month baseline charge. For small serverless databases, proxy costs exceed database costs. Recommendation: use PgBouncer for non-Aurora PostgreSQL, RDS Proxy only when Lambda concurrency demands it. For Aurora Serverless v2, evaluate whether you need RDS Proxy or can use native connection pooling.
