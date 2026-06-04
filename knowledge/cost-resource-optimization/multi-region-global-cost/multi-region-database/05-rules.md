# Multi-Region Database — Rules

## R1: Always Use a Single Writer Region — Never Write from Multiple Regions

**Category**: Write Architecture

**Rule**: ALWAYS designate a single primary region for database writes. NEVER accept writes from multiple regions unless you have a documented conflict resolution strategy.

**Reason**: Multi-region writes (active-active) require conflict resolution for concurrent updates to the same records. Last-writer-wins (LWW) causes data loss; CRDTs require significant application complexity; manual resolution is operationally infeasible at scale. A single writer region with async replication to read-only secondary regions eliminates conflict resolution entirely. For 99% of Laravel applications, this is the correct approach.

**Bad Example**: Two regions (us-east-1, eu-west-1) both accept user profile writes. A user updates their email from us-east-1 at the same time an admin updates it from eu-west-1. LWW means one update is silently lost. The user's email reverts to an old value. Support ticket volume spikes.

**Good Example**: Only us-east-1 accepts writes. eu-west-1 has read-only Aurora Global Database readers. User profile updates go to us-east-1 (async queue from EU) or are routed via Route53 to us-east-1 for write operations. Zero data conflicts. Simple application logic.

**Exceptions**: If your application requires active-active writes (two regions independently accepting writes to the same dataset), implement: (1) CRDT-based data structures (conflict-free data types), (2) user-level data partitioning (User A always writes to us-east-1, User B to eu-west-1), (3) DynamoDB Global Tables (handles conflict resolution automatically with LWW or custom resolvers).

**Consequences Of Violation**: Silent data corruption from unresolved write conflicts. Customer-facing data inconsistency (user sees old data, wrong email, duplicate orders). Complex debugging of data inconsistency issues. Support team overloaded with "my data disappeared" tickets.

---

## R2: Prefer Aurora Global Database Over RDS Cross-Region Replicas for Read-Heavy Global Apps

**Category**: Service Selection

**Rule**: ALWAYS use Aurora Global Database for global read workloads (multiple regions serving reads). AVOID RDS cross-region read replicas when you need readers in 2+ regions serving production read traffic.

**Reason**: Aurora Global Database replicates at the storage layer — no per-GB replication fee, no query replay overhead. Cost: compute per region only. RDS cross-region replicas: pay for compute in each region + $0.02/GB for replication data transfer. For a read-heavy global app with 500GB/month replication traffic: Aurora Global = compute only ($300/region); RDS replicas = compute ($300) + data transfer ($10) per region. The gap widens as data grows: 5TB/month replication = $100/month in RDS data transfer vs $0 for Aurora.

**Bad Example**: A global Laravel SaaS uses RDS cross-region replicas in eu-west-1 and ap-southeast-1 for regional reads. Monthly: 2 replicas ($600 compute) + 5TB replication data transfer ($100) = $700/month for replication. Plus replication lag of 2-5 seconds under write load.

**Good Example**: Aurora Global Database with readers in eu-west-1 and ap-southeast-1. Monthly: 2 readers ($600 compute) + $0 replication data transfer. Replication lag: <1 second. Same cost for compute, $100/month savings on data transfer, lower lag, simpler management.

**Exceptions**: Use RDS cross-region replicas when: (1) you use MySQL or PostgreSQL (not Aurora), (2) DR is the only need (no regional reads) — single smaller replica is cheaper than Aurora Global, (3) you need a replica in <30 minutes (RDS replica can be created quickly vs Aurora Global requires initial setup).

**Consequences Of Violation**: Paying $0.02/GB indefinitely for replication data transfer. At 5TB/month: $100/month ($3,600/3yr) for zero benefit over Aurora Global. Higher replication lag means regional users see stale data.

---

## R3: Use Smaller Instances in Read Regions — Never Match Writer Instance Size

**Category**: Instance Sizing

**Rule**: ALWAYS size read region database instances based on read workload, not writer capacity. NEVER run the same instance size in all regions.

**Reason**: Writer instances handle writes (CPU-intensive: index updates, constraint checks, transaction log writes) plus reads. Read regions handle only reads (CPU-light: SELECT, cache lookups). A writer running r7g.xlarge (4 vCPU) handling 2,000 writes/sec + 3,000 reads/sec may be at 60% CPU. A read region handling 1,000 reads/sec can run r7g.large (2 vCPU) at 30% CPU. Savings: 58% on read region compute ($302/month vs $126/month per instance).

**Bad Example**: Aurora Global Database: us-east-1 writer r7g.xlarge, eu-west-1 reader r7g.xlarge, ap-southeast-1 reader r7g.xlarge. All 3 regions: $906/month compute. EU reader serves 500 reads/sec at 15% CPU. Asia reader serves 200 reads/sec at 8% CPU.

**Good Example**: Writer r7g.xlarge ($302/month). EU reader r7g.large ($126/month — sufficient for 500 reads/sec). Asia reader r7g.large ($126/month — sufficient for 200 reads/sec). Total compute: $554/month. Savings: $352/month (39%) with zero performance impact.

**Exceptions**: If a read region might be promoted to writer during failover AND you need full write capacity immediately after promotion, pre-size for write workload. If read regions serve write-forwarded traffic, consider the CPU overhead of forwarding.

**Consequences Of Violation**: Paying 2-3x the necessary compute cost for read-only regions. $200-600/month per read region in wasted compute for capacity never used.

---

## R4: Monitor Replication Lag — Never Assume It's Under 1 Second

**Category**: Operational Monitoring

**Rule**: ALWAYS set CloudWatch alarms on Aurora Global Database replication lag. NEVER assume replication stays under 1 second without monitoring.

**Reason**: Aurora Global Database replication lag is typically 0.5-1 second under normal conditions. Under heavy write load (bulk imports, migrations, flash crowds), lag can spike to 10+ seconds. Without monitoring, you won't know secondary regions are serving stale data. Set a CloudWatch alarm on `AuroraGlobalDBReplicationLag` at >2 seconds for Aurora and >5 seconds for RDS cross-region replicas. Lag >10 seconds means read regions serve data that is significantly out of date.

**Bad Example**: A Laravel app uses Aurora Global Database for global reads. During a Black Friday sales event, write volume spikes 10x. Replication lag reaches 15 seconds. EU users see inventory as "in stock" (actually sold out 15 seconds ago). 500 customers place orders for out-of-stock items. Manual refunds: $15K in processing + customer trust damage.

**Good Example**: CloudWatch alarm on replication lag at 2 seconds. During the sales event, the alarm triggers. The team identifies the bottleneck (writer instance CPU at 95%) and scales up the writer. Replication lag drops back to 1 second within 5 minutes. No stale data served. No overselling.

**Exceptions**: If your application tolerates eventual consistency of 30+ seconds (analytics dashboards, reporting), you can set alarms at higher thresholds (10s for Aurora, 30s for RDS). For applications requiring strict read-after-write consistency, always route reads to the writer region (cross-region latency accepted).

**Consequences Of Violation**: Serving stale data to users in secondary regions. Lost revenue from overselling inventory. Customer trust damage from data inconsistency. Cascading failures if replicas can't keep up with write volume.

---

## R5: Use Local Cache Per Region — Never Share a Cross-Region Cache

**Category**: Caching Strategy

**Rule**: ALWAYS deploy independent ElastiCache Redis clusters in each region. NEVER use a single cross-region cache or attempt cache synchronization between regions.

**Reason**: Cross-region cache sharing adds 50-200ms latency per cache operation (vs <1ms for local cache) and generates significant data transfer costs. For a Laravel app with 5,000 cache operations/second (session reads, rate limits, cached queries), cross-region cache would add $200-500/month in data transfer + 100ms+ latency on every operation. Local caches per region cost $0 in cross-region transfer and provide <1ms latency.

**Bad Example**: A global Laravel app uses a single ElastiCache Redis cluster in us-east-1. All regions read/write cache cross-region. EU users: 100ms per cache operation (vs 1ms). Monthly cross-region cache transfer: $350/month. Any outage in us-east-1 breaks caching for ALL regions.

**Good Example**: Each region has an independent ElastiCache Redis cluster. us-east-1 Redis serves US users (<1ms). eu-west-1 Redis serves EU users (<1ms). ap-southeast-1 Redis serves Asia users (<1ms). Cross-region cache cost: $0. If cache needs invalidation globally, use SNS (event-driven invalidation, not data sync).

**Exceptions**: If your application requires globally consistent rate limiting or distributed locks, use DynamoDB Global Tables (handles cross-region replication natively) or a purpose-built global rate limiter service — not cross-region cache sync.

**Consequences Of Violation**: 100-200ms added latency on every cache operation from non-primary regions. $200-500/month in unnecessary data transfer costs. Single point of failure for caching (cache region outage affects all regions).

---

## R6: Test DR Failover Quarterly — Never Assume It Works

**Category**: Disaster Recovery

**Rule**: ALWAYS test multi-region database failover at least quarterly. NEVER go more than 6 months without a documented, successful failover test.

**Reason**: Database failover is the most critical and most fragile part of multi-region DR. Schema changes, Aurora version upgrades, network configuration changes, and IAM role changes can silently break failover. A quarterly test (30 minutes) exposes broken failover procedures while they're fixable. Teams that test quarterly achieve >95% failover success rate; teams that test annually or never achieve <50%.

**Bad Example**: A team configures Aurora Global Database DR but never tests it. During a real us-east-1 outage, they attempt failover: (1) promotion script fails — Aurora version mismatch between primary and secondary, (2) application connection strings point to old primary endpoint, (3) DBAs scramble for 45 minutes to fix. Total downtime: 47 minutes. Business loss: $200K+.

**Good Example**: The team runs a quarterly failover drill: (1) promote secondary to primary (2 minutes), (2) verify application connects and functions (5 minutes), (3) run smoke tests (10 minutes), (4) fail back to primary (3 minutes), (5) document issues. Total test: 20 minutes. When real outage hits, automated failover completes in 90 seconds.

**Exceptions**: For development/staging environments with no production data or RTO, bi-annual testing is acceptable. For applications with RTO > 1 hour and zero revenue per hour, annual testing with documented procedure suffices.

**Consequences Of Violation**: False confidence in DR capability. Failover fails during real incident, causing extended downtime (30-60+ minutes). Data loss if failover procedure is incorrect. Regulatory compliance violations if RTO/RPO are not met.
