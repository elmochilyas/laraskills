# K36: Cross-AZ and NAT Gateway Cost

## Metadata
- **ID**: K36
- **Subdomain**: Connection Pooling & Network Cost
- **Topic**: Cross-AZ and NAT Gateway Cost
- **Source**: AWS Documentation, CloudZero (2025), Wring Blog (2026)
- **Reliability**: High

## Executive Summary
Cross-AZ data transfer costs $0.01/GB each direction ($0.02/GB round-trip) Ã¢â‚¬â€ this adds up significantly for chatty microservice communication. NAT Gateway costs ~$32/month + $0.045/GB processed. For a multi-AZ Laravel deployment with 10TB cross-AZ traffic/month, networking costs can reach $200-300/month. Collocating compute and database in the same AZ and using VPC endpoints for AWS services eliminates these costs entirely.

## Core Concepts
- **Cross-AZ transfer**: $0.01/GB each direction
- **NAT Gateway**: $0.045/hour (~$32/month) + $0.045/GB data processing
- **VPC endpoints**: Free (per-hour charge but eliminates NAT/transfer costs)
- **Same-AZ traffic**: Free (private IP, same AZ)
- **Cross-region**: $0.02/GB (more expensive)
- **S3/DynamoDB endpoints**: Free (VPC Gateway Endpoints, no hourly charge)

## Mental Models
- **AZ as free zone**: Within an AZ, data transfer is free; every byte that crosses AZ boundaries costs
- **NAT as toll road**: $32/month just for access + per-GB processing fee

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
- K51: Cross-Region Data Transfer

## Research Notes
Network cost optimization hierarchy: (1) Collocate resources in same AZ (highest impact), (2) Use VPC Gateway Endpoints for S3/DynamoDB, (3) Use VPC Interface Endpoints for other AWS services (eliminates NAT), (4) Minimize cross-AZ traffic through service placement. For Laravel apps, the highest-impact change is placing web servers and RDS in the same AZ Ã¢â‚¬â€ eliminating query data transfer costs.
