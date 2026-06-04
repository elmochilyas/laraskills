# K35: PgBouncer Alternative

## Metadata
- **ID**: K35
- **Subdomain**: Connection Pooling & Network Cost
- **Topic**: PgBouncer Alternative
- **Source**: Industry Knowledge, JP Camara (2024)
- **Reliability**: High

## Executive Summary
PgBouncer is free, open-source connection pooling software that runs on a small EC2 instance ($5-20/month compute). It provides comparable connection pooling to RDS Proxy at 10-20% of the cost. The tradeoffs: (1) Transaction mode breaks session-level features (advisory locks, prepared statements); (2) No IAM authentication; (3) Requires operational management. For non-Lambda workloads with stable connection pools, PgBouncer is the cost-effective choice.

## Core Concepts
- **Cost**: Free software + $5-20/month EC2 compute
- **vs RDS Proxy**: 10-20% of RDS Proxy cost
- **Modes**: Session mode (safe), Transaction mode (efficient but breaks some features)
- **Transaction mode traps**: Advisory locks, prepared statements, temp tables, SET commands
- **Best for**: Non-Lambda workloads, stable connection pools, cost-sensitive teams

## Mental Models
- **PgBouncer as DIY plumbing**: Works great but you need to understand how it works
- **Free but not cheap**: PgBouncer is free software but requires operational expertise

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
- K34: RDS Proxy Pricing
- K36: Cross-AZ and NAT Gateway Cost

## Research Notes
PgBouncer is the most widely deployed connection pooler for PostgreSQL. Key decision factor: if you need IAM auth, automatic failover detection, or Lambda-scale connection handling, RDS Proxy is justified. If you have a stable EC2/ECS fleet with standard connection needs, PgBouncer saves $15-100/month. The hidden cost of PgBouncer is operational: monitoring, updates, and handling the transaction mode pitfalls.
