# Aurora Global Database Cost — Rules

## R1: Always Use Headless DR for Secondary Regions — Never Run Idle Compute

**Category**: Secondary Region Configuration

**Rule**: ALWAYS configure secondary regions with headless DR (storage replicated, zero compute). NEVER provision running database instances in secondary regions unless they serve active read traffic.

**Reason**: Compute is 40-60% of Aurora cost. A headless DR cluster replicates storage to the secondary region without running any database instances. When failover triggers, Aurora provisions compute automatically. This eliminates 100% of secondary compute spend during normal operation. A secondary r7g.large at $0.175/hour costs $126/month idle — headless DR costs $0 for compute.

**Bad Example**: A team provisions an r7g.xlarge ($0.42/hour = $302/month) in the eu-west-1 secondary region "for DR." The instance runs 24/7 for 12 months, serving zero traffic. Wasted: $3,628/year.

**Good Example**: Aurora Global Database configured with headless DR in eu-west-1. Storage replicates continuously. Compute provisions only during monthly failover tests (10 minutes). Monthly DR compute cost: $0.07 instead of $302.

**Exceptions**: If the secondary region must serve read traffic during normal operation, use serverless v2 readers that scale to near-zero ACUs when idle rather than provisioned instances.

**Consequences Of Violation**: Paying $100-500/month per secondary region for compute that serves zero requests. Over 3 years: $3,600-18,000 of pure waste per secondary region.

---

## R2: Prefer Serverless v2 Readers Over Provisioned in Secondary Regions

**Category**: Compute Type Selection

**Rule**: ALWAYS use Aurora Serverless v2 for read-only instances in secondary regions. AVOID provisioned instances unless the read workload is completely predictable and continuous.

**Reason**: Serverless v2 scales down to near-zero ACUs when idle and scales up on demand. For secondary regions that serve sporadic read traffic (e.g., regional API reads during business hours only), serverless saves 60-80% compared to provisioned instances running 24/7. Provisioned instances charge by the hour regardless of actual query load.

**Bad Example**: A secondary region in eu-west-1 runs a provisioned r7g.large ($0.175/hour) serving 5,000 reads/hour during EU business hours (12 hours) and near-zero reads overnight — $126/month for 50% utilization.

**Good Example**: The same workload uses serverless v2. During business hours: 4 ACUs ($0.24/hour × 12 = $2.88/day). Overnight: 0.5 ACUs ($0.03/hour × 12 = $0.36/day). Monthly: ~$97 — 23% savings. If traffic is lighter, savings reach 60%+.

**Exceptions**: Use provisioned instances if you have predictable 24/7 read traffic that justifies the minimum spend of serverless v2 (1 ACU minimum = $96/month). Use provisioned if you need burst capacity above 128 ACUs per instance.

**Consequences Of Violation**: Over-paying for idle compute in secondary regions. Paying 24/7 provisioned rates for workloads that are active only 8-12 hours per day.

---

## R3: Monitor AuroraReplicatedWriteIO — Never Ignore Replication Costs

**Category**: Cost Monitoring

**Rule**: ALWAYS monitor the `AuroraReplicatedWriteIO` CloudWatch metric. NEVER add write-heavy workloads to Aurora Global Database without calculating replication I/O cost first.

**Reason**: Aurora Global Database charges $0.20 per million replicated write I/Os. For write-heavy applications (50M writes/month), this adds $10/month on top of base storage and compute. While small for most apps, write-heavy workloads (logging, event sourcing, IoT ingestion) can generate 500M+ writes/month, adding $100+/month in replication costs. This cost is invisible unless specifically monitored.

**Bad Example**: A Laravel app processes 100M write I/Os per month through Aurora Global Database. The team monitors only compute and storage costs. Six months in, they discover $20/month in replication charges that could have been reduced by batching writes (50% fewer I/Os).

**Good Example**: Before deploying Global Database, the team checks the current write I/O rate (50M writes/month). They calculate replication cost: 50M × $0.20/M = $10/month. They add a CloudWatch alarm on `AuroraReplicatedWriteIO` at 100M/month threshold ($20/month). After deployment, they review replication costs monthly in Cost Explorer.

**Exceptions**: Read-heavy applications with low write volume (<10M writes/month) have negligible replication costs ($2/month). Don't over-instrument for sub-$2 costs, but still enable the metric for visibility.

**Consequences Of Violation**: Surprise replication charges at scale. Write-heavy applications double the expected database cost. Inability to identify which workloads drive replication costs.

---

## R4: Use 2-Region Global Database — Never Default to 3 Regions

**Category**: Region Count Strategy

**Rule**: ALWAYS start with a 2-region Aurora Global Database (primary + one secondary). NEVER deploy 3+ regions without documented justification for each additional region.

**Reason**: Each secondary region adds full storage replication cost ($0.10/GB/month) plus potential compute cost. A 3-region setup triples storage cost for secondary regions (each secondary pays the same $0.10/GB as primary) plus adds data transfer for replication traffic. Two regions (e.g., us-east-1 primary, eu-west-1 secondary) cover 99% of DR scenarios. A third region is only needed for specific compliance requirements (data must stay in Asia) or geo-political isolation.

**Bad Example**: A Laravel app deploys Aurora Global Database across us-east-1, eu-west-1, and ap-southeast-1 "for maximum resilience." Storage: 500GB × $0.10 × 3 regions = $150/month. Plus compute in two secondary regions: $500/month. Total: $650/month for a single-region app with CloudFront.

**Good Example**: The same app deploys us-east-1 primary with eu-west-1 headless secondary. Storage: 500GB × $0.10 × 2 regions = $100/month. Secondary compute: $0 (headless). Total: $100/month for DR. After 6 months, they analyze usage — no need for third region.

**Exceptions**: Add a third region if: (1) compliance mandates data stay in three specific geographic areas (e.g., US, EU, Asia), (2) users in three continents need <50ms read latency, (3) you need isolation from both US-East and EU-West simultaneous failures.

**Consequences Of Violation**: Tripling storage cost unnecessarily ($100-300/month extra per TB). Adding operational complexity (3-region failover procedures, 3-region monitoring) without business justification.

---

## R5: Use Write Forwarding from Secondary — Never Write Cross-Region at Application Level

**Category**: Write Pattern Optimization

**Rule**: ALWAYS use Aurora Global Database write forwarding for writes initiated from secondary regions. NEVER write cross-region at the application level using separate database connections.

**Reason**: Writing from the application in a secondary region directly to the primary region database creates two network hops (app → secondary → primary) and exposes connection strings in code. Aurora write forwarding handles this transparently: the app connects to the local secondary cluster writer endpoint, Aurora forwards the write to the primary, and returns the result. This simplifies application code, reduces latency (Aurora handles routing), and avoids storing cross-region connection credentials in app configuration.

**Bad Example**: A Laravel app in eu-west-1 connects directly to the us-east-1 writer endpoint for all writes. Every CREATE/UPDATE travels 70-100ms cross-region. The database connection string for the primary is hardcoded in the secondary app config. Network hop: app → cross-region → primary.

**Good Example**: The Laravel app in eu-west-1 connects to the local Aurora Global Database writer endpoint. Write forwarding is enabled. The app writes to the local endpoint; Aurora forwards to us-east-1 primary. Network hop: app → local endpoint (1ms) + Aurora-managed forwarding (20ms). Total: ~21ms vs 100ms.

**Exceptions**: If you need to control the region of write execution for compliance logging, or if write forwarding adds latency spikes under heavy load (>50K writes/second), implement application-level dual-write with async confirmation.

**Consequences Of Violation**: Doubling write latency (100ms vs 21ms) by making the application itself route cross-region writes. Hard-coding cross-region database connections increases security risk and complicates failover (connection strings must change per region).

---

## R6: Size Secondary Instances for Read Workload, Not Primary Capacity

**Category**: Instance Sizing

**Rule**: ALWAYS size secondary region database instances based on actual read traffic, not primary compute capacity. NEVER match primary instance size in secondary regions.

**Reason**: The secondary region serves read traffic only (no writes). The compute required to serve 1,000 reads/second is significantly less than the compute required for 1,000 writes/second (writes are 5-10x more CPU-intensive). If secondary read traffic is 30% of primary traffic, secondary instances can be 50-70% smaller. This saves 30-50% on secondary compute without performance impact.

**Bad Example**: Primary runs r7g.xlarge ($0.42/hour) handling 2,000 writes/sec + 5,000 reads/sec. Secondary runs r7g.xlarge ($0.42/hour) handling 0 writes/sec + 500 reads/sec. Secondary compute is 90% idle. Waste: $302/month.

**Good Example**: Primary runs r7g.xlarge. Secondary runs r7g.large ($0.175/hour) handling 500 reads/sec with 40% CPU utilization (adequate headroom). If read traffic grows, secondary can scale up independently of primary. Savings: $227/month (58% reduction in secondary compute).

**Exceptions**: If secondary must be promoted to primary within <1 minute and cannot scale up during promotion, pre-size for write workload. If secondary serves write-forwarded traffic (handles writes as pass-through), consider the CPU overhead of write forwarding.

**Consequences Of Violation**: Paying 2x compute for identical instance sizes when secondary workload is 30-50% of primary. $200-500/month waste per secondary region for capacity never used.
