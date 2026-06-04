# Read Replicas Cost

## Metadata
- **ID**: KU-05-READ-REPLICAS-COST
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Read Replicas Cost
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Read replicas offload SELECT queries from the primary database, reducing CPU contention and enabling the primary to handle more write capacity. For Laravel applications, read replicas enable separating read-heavy queries (reports, dashboards, public listings) from write operations. However, each replica doubles (or more) database cost. The decision to use replicas must balance query throughput needs against additional instance costs.

## Core Concepts
- **Read replica**: Database instance that mirrors primary asynchronously; processes SELECT queries only
- **Replication lag**: Async replication delay (typically <100ms, can spike under load)
- **Read/write splitting**: Laravel's `DB::connection('mysql-read')` or automatic `sticky` mode
- **Aurora replicas**: Up to 15 read replicas sharing same storage; cheaper than RDS replicas (no storage copy)
- **RDS cross-region replicas**: Read replicas in different regions; adds $0.02/GB transfer cost
- **Replica compute cost**: Same instance cost as primary (RDS replica = full instance price)
- **Aurora reader cost**: 0.2x-0.5x of write instance cost (can use smaller instance for reader)

## When To Use
- Read replicas: Query-heavy apps where reads > 80% of database operations
- Report/dashboard queries: Heavy analytical queries that shouldn't impact user-facing writes
- Geo-distribution: Cross-region replicas for global users (low latency reads)
- Scaling read capacity: When primary database CPU > 70% from SELECT queries
- Aurora replicas: Cost-effective multi-AZ reads (no storage cost, smaller instances possible)

## When NOT To Use
- Write-heavy apps: If 80%+ of queries are writes, replicas don't help (primary is still bottleneck)
- Low-traffic apps: <1000 queries/second; single database handles it fine
- Real-time consistency needs: Replication lag may serve stale data (<100ms usually acceptable)
- Budget-constrained: Each replica doubles database cost; optimize queries first before adding replicas
- Small data ( <50GB ): Query optimization + caching usually sufficient without replicas

## Best Practices
- **Optimize queries before adding replicas**: A single missing index can cause 80% of database load (WHY: adding a replica costs $50-500/month; fixing a query costs $0; eliminate the root cause before scaling horizontally)
- **Use Aurora replicas for cost-effective read scaling**: Aurora reader instances share storage (no storage cost) and can be smaller instance (WHY: RDS replica costs 100% of primary (compute + storage); Aurora reader costs only compute (50-100% of writer), storage is shared)
- **Implement read/write splitting in Laravel**: Configure `'read'` and `'write'` connections in `config/database.php` (WHY: Laravel's native read/write splitting directs SELECTs to replica, INSERT/UPDATE to primary; zero application code changes needed)
- **Monitor replication lag**: CloudWatch `ReplicaLag` metric; alert if > 5 seconds (WHY: excessive lag means replica can't keep up; queries return stale data; indicates replica under-provisioning or network issues)
- **Scale down replica size**: Aurora readers can be smaller than writer; RDS replicas must be same size (WHY: Aurora's shared storage allows readers to use smaller instances; saves 30-50% on replica cost)
- **Use cross-region replicas for disaster recovery**: Aurora Global Database replicates to another region with <1s lag (WHY: DR without double write cost; promotes to primary in <1 minute during region failure)

## Architecture Guidelines
- For RDS: Same instance class for primary and replica (required for replication)
- For Aurora: Reader can be smaller (e.g., writer = r7g.xlarge, reader = r7g.large)
- Place replica in different AZ for HA (same region, avoid cross-region latency)
- Maximum replicas: RDS = 5, Aurora = 15 (more replicas = more replication overhead)
- Use Aurora Auto Scaling for reader fleet (scale readers based on CPU/connections)
- For heavy reporting, create a dedicated read replica (not shared with production reads)

## Performance Considerations
- Replication lag: Typical 10-100ms; can spike to seconds during large transactions
- Read capacity: Each replica adds 100% more read throughput (if identical to primary)
- Aurora reader scaling: Adding reader adds throughput linearly (2 readers = 2x read capacity)
- Replication overhead: Primary uses 5-10% more CPU for replication (WAL shipping)
- Sticky reads: Laravel's `sticky` mode sends reads to primary for 1 second after writes (ensures consistency)

## Security Considerations
- Enable encryption in-transit for replication (TLS between primary and replica)
- Cross-region replicas need VPC peering or VPN for encryption
- Replicas inherit IAM roles and security groups from primary
- Replicas can be promoted to primary; test promotion procedures
- Log replication status via CloudTrail for auditing

## Common Mistakes
1. **Read replica for query optimization instead of fixing queries**: Adding replica when one index fix would solve problem (Cause: "hardware is easier than fixing code"; Consequence: paying $50-500/month instead of $0 for index; Better: profile slow queries with Performance Insights, add indexes first)
2. **No read/write splitting code**: Adding replica but Laravel still sends all queries to primary (Cause: adding replica in AWS but not updating `config/database.php`; Consequence: replica unused, paying for idle instance; Better: configure read/write connections in Laravel)
3. **Using RDS replicas (not Aurora) for small reads**: RDS replicas cost same as primary, even for light read load (Cause: unaware of Aurora's shared storage; Consequence: doubling cost for minimal benefit; Better: consider Aurora readers or optimize queries/cache first)

## Anti-Patterns
- **Single replica for everything**: One replica handling reports + read traffic + DR; overloading it
- **Cross-region replica for active-active writes**: Both regions accepting writes causes conflicts
- **Replica without monitoring**: No ReplicaLag alarm; silent lag accumulates over time

## Examples
- **Before replica**: Primary CPU 80% (60% from SELECT, 20% from writes); queries pile up
- **After replica + read/write split**: Primary CPU 25% (writes only); Replica CPU 40% (reads); no query queuing
- **Aurora scaling**: Writer = r7g.xlarge; 3 readers = r7g.large; auto-scaling adds reader when CPU > 70%
- **Cross-region**: Primary in us-east-1, cross-region replica in eu-west-1; local users read from replica

## Related Topics
- Query Optimization Cost (ku-01)
- Serverless Database (ku-07)
- Storage Tier Selection (ku-04)

## AI Agent Notes
- Default: optimize queries + cache before adding replicas
- Default: Aurora readers (shared storage) over RDS replicas for cost
- Always set ReplicaLag alarm (>5s threshold)

## Verification
- [ ] Queries optimized and cache added before considering replicas
- [ ] Read/write splitting configured in Laravel (if replica added)
- [ ] ReplicaLag monitored (CloudWatch alarm)
- [ ] Aurora readers preferred over RDS replicas (for cost)
- [ ] Replica instance size appropriate for read workload
- [ ] No cross-region active-active writes
