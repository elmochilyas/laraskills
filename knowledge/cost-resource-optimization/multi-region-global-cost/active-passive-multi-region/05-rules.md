# Active-Passive Multi-Region — Rules

## R1: Always Prefer Active-Passive Over Active-Active for DR

**Category**: Architecture Pattern Selection

**Rule**: ALWAYS use active-passive architecture for disaster recovery multi-region deployments. NEVER default to active-active without a clear business requirement for sub-second failover or simultaneous multi-region writes.

**Reason**: Active-passive runs full compute only in the primary region; the secondary region runs minimal compute (or computes only on failover with headless DR). This reduces cross-region compute cost by 40-60% compared to active-active. Active-active requires full infrastructure in all regions, data sync costs, and conflict resolution complexity. For 95% of Laravel applications, active-passive with 1-5 minute RTO meets all DR requirements at half the cost.

**Bad Example**: A Laravel SaaS deploys active-active across us-east-1 and eu-west-1 — both regions serve traffic, both run full compute, both have write-capable databases. Monthly cost: $6,800 (2x compute + data sync). When asked about the failover requirement, the team admits a 5-minute RTO is acceptable.

**Good Example**: The same app deploys active-passive: primary in us-east-1 ($3,000/month compute), secondary in eu-west-1 with headless Aurora ($200/month storage replication only). Total: $3,200/month — 53% cheaper. Route 53 failover routing handles DR with 60-90 second RTO.

**Exceptions**: Use active-active only when both regions must serve reads and writes simultaneously (global real-time apps, financial trading) AND you have a documented conflict resolution strategy. For read-only active-active (both regions serve reads, single writer), evaluate if CloudFront + single-region origin suffices first.

**Consequences Of Violation**: Paying 2x compute cost for redundant capacity that sits idle 99.9% of the time. Adding complexity (data sync, conflict resolution, cross-region latency) without commensurate business value.

---

## R2: Use Headless Aurora for DR Region — No Compute Until Failover

**Category**: Secondary Region Configuration

**Rule**: ALWAYS configure the DR region with headless Aurora clusters (storage replicated, zero compute). NEVER provision running database instances in the DR region unless they serve read traffic.

**Reason**: Compute represents 40-60% of Aurora cost. A headless DR cluster replicates storage to the secondary region without running any database instances. When failover triggers, Aurora provisions compute automatically. This eliminates 100% of secondary compute spend during normal operation — saving $200-500/month per DR region. Storage replication cost (10-20% of full DR cost) is the only ongoing expense.

**Bad Example**: A team provisions an r7g.large ($0.175/hour = $126/month) in the DR region "just in case." The instance runs 24/7 for 12 months serving zero traffic. Wasted: $1,512/year.

**Good Example**: The team configures Aurora Global Database with headless DR. Storage replicates continuously ($50/month), but no compute runs. Failover testing (monthly) triggers compute provisioning for 10 minutes. Monthly DR cost: $50 instead of $176.

**Exceptions**: If the DR region must serve read traffic during normal operation (e.g., read replicas for local users), use serverless v2 readers scaled to near-zero when idle rather than provisioned instances.

**Consequences Of Violation**: Paying for compute that serves zero requests. Monthly cost of $100-500 per DR region for capacity used 0% of the time. Over 3 years: $3,600-18,000 of pure waste.

---

## R3: Put CloudFront Before Considering Multi-Region

**Category**: Global Architecture Evaluation

**Rule**: ALWAYS deploy CloudFront in front of a single-region origin before evaluating multi-region architectures. NEVER jump to multi-region deployment without confirming that CloudFront alone is insufficient.

**Reason**: CloudFront caches content at 400+ edge locations worldwide. For most Laravel applications, 80-95% of requests are cacheable (assets, API responses, pages). CloudFront reduces origin load, eliminates cross-region data transfer, and costs a fraction of multi-region infrastructure. Multi-region should only be evaluated when CloudFront cache hit rates are below 50% for dynamic content and latency requirements exceed anycast/edge capabilities.

**Bad Example**: A Laravel app deploys to us-east-1, eu-west-1, and ap-southeast-1 to "improve global latency" — no CloudFront. Monthly infra cost: $6,800. Analysis shows 85% of requests are cacheable GET responses. CloudFront with single-region origin would achieve 80ms edge latency at $3,300/month.

**Good Example**: The team deploys to us-east-1 with CloudFront. Six months of metrics show 90% cache hit rate, average edge latency of 30ms. Only 10% of requests (dynamic API) hit the origin. Multi-region is deferred — the cost benefit doesn't justify it.

**Exceptions**: If your application is 100% real-time (WebSockets, streaming) with zero cacheable content, or if you have compliance requirements that mandate data residency in specific regions, CloudFront alone is insufficient and multi-region architecture is justified.

**Consequences Of Violation**: 5-10x infrastructure cost for marginal latency improvement. Multi-region complexity (data sync, failover, cross-region traffic) deployed when CDN solves 80% of the use case.

---

## R4: Right-Size the Standby Region — Never Match Primary Capacity

**Category**: Standby Capacity Planning

**Rule**: ALWAYS right-size standby region instances to 50-70% of primary capacity. NEVER provision identical compute in primary and standby regions.

**Reason**: The standby region serves zero traffic during normal operation in active-passive architecture. Matching primary compute means paying for capacity that runs at 0-5% utilization 99.9% of the time. A properly right-sized standby uses smaller instances (e.g., r7g.large instead of r7g.xlarge) and scales up during failover. The scale-up is part of the failover procedure — not a blocker.

**Bad Example**: Primary runs 4 r7g.xlarge (16 vCPU, 32 GB each). Standby provisions 4 r7g.xlarge in the DR region "to match capacity." Monthly waste: $600/month for zero-traffic instances.

**Good Example**: Primary runs 4 r7g.xlarge. Standby provisions 2 r7g.large (2 vCPU, 8 GB each) — enough to run the control plane and accept traffic during scale-up. Failover procedure includes: (1) promote Aurora, (2) scale up standby ASG to 4 r7g.xlarge. Monthly savings: $400/month (67% reduction in standby compute).

**Exceptions**: If the standby region must serve read traffic during normal operation, size based on read workload, not primary capacity. If failover scale-up takes >5 minutes and <5 minute RTO is required, consider pre-provisioning more standby capacity.

**Consequences Of Violation**: Paying 2x compute for capacity used 0% of time. Over $5,000-20,000/year in wasted standby compute for medium-to-large deployments.

---

## R5: Test Failover Monthly — Never Assume It Works

**Category**: Operational Reliability

**Rule**: ALWAYS test multi-region failover at least monthly. NEVER go more than 90 days without a documented failover test.

**Reason**: Untested failover processes fail during real incidents. DNS TTL, application warm-up time, database promotion, cache warming, and configuration drift all conspire to break failover. Monthly tests take ~10 minutes and expose issues while they're fixable. Teams that test monthly achieve 95%+ failover success rate; teams that test annually achieve <50%.

**Bad Example**: A team configures active-passive DR but never tests it. During a real us-east-1 outage, they attempt failover: Route 53 health check doesn't detect the failure (misconfigured), DNS TTL is set to 300 seconds (5 minute propagation), and the Aurora promotion script was never updated after a schema change. Total downtime: 47 minutes. Business loss: $340K.

**Good Example**: The team runs a monthly failover drill: (1) simulate primary region failure, (2) verify Route 53 health check detects it within 30 seconds, (3) verify Aurora Global Database promotes within 2 minutes, (4) verify application healthy in DR region, (5) fail back. Each test takes 10 minutes. When real outage hits, failover completes in 90 seconds.

**Exceptions**: For development/staging environments, quarterly testing is acceptable. For applications with RTO > 15 minutes and no revenue impact from downtime, quarterly testing with documented procedure suffices.

**Consequences Of Violation**: False sense of DR readiness. Failover fails during real incident. Extended downtime (30-60 minutes) while diagnosing and fixing failover issues under pressure.

---

## R6: Never Deploy Multi-Region Without Route 53 Health Checks

**Category**: Traffic Management

**Rule**: ALWAYS configure Route 53 health checks on primary region endpoints for automated failover. NEVER rely on manual failover or DNS TTL alone.

**Reason**: Manual failover takes 10-30 minutes — someone must detect the issue, log in, update DNS, wait for propagation. Route 53 health checks detect failure in 15-30 seconds and automatically stop routing traffic to the unhealthy region. Combined with 60-second DNS TTL, total failover time is 60-90 seconds. Health checks cost $0.50/month per endpoint — negligible for the reliability benefit.

**Bad Example**: A team configures Route 53 failover routing but forgets health checks. When primary region has an issue, Route 53 continues sending traffic to the unhealthy endpoint. Users get errors for 45 minutes until someone manually updates DNS.

**Good Example**: Route 53 health check monitors the primary ALB endpoint every 30 seconds. When three consecutive health checks fail (90 seconds of failure), Route 53 marks primary as unhealthy and routes traffic to the DR region. Automated failover in <2 minutes.

**Exceptions**: For single-region deployments (no multi-region), health checks on the ALB still provide value for monitoring but aren't required for routing. For applications with manual failover approval processes, use health check + CloudWatch alarm + SNS notification rather than automatic DNS change.

**Consequences Of Violation**: Routing traffic to unhealthy regions. Users experiencing errors during regional outages. DR infrastructure sitting unused while primary is down.

---

## R7: Use Smaller Instances in Standby — Scale Up Is Part of Failover

**Category**: Standby Instance Sizing

**Rule**: ALWAYS provision the standby region with smaller instances than the primary and include scale-up in the automated failover procedure. NEVER require manual instance resizing during failover.

**Reason**: The standby region runs zero or minimal traffic during normal operation. Running primary-sized instances in standby wastes 40-60% of compute cost. Instead, provision instances sized for the control plane (monitoring, health checks, minimal request handling) and include an ASG scale-up step in the failover procedure. This saves 50-70% on standby compute while maintaining full capacity during failover.

**Bad Example**: Standby region runs 4 r7g.xlarge (identical to primary) at $1,200/month — 100% idle. During failover, the team manually SSHes into each instance to change configuration.

**Good Example**: Standby region runs 2 r7g.large at $250/month — just enough for control plane and light traffic. Failover procedure automatically triggers: (1) ASG scale-up to 4 r7g.xlarge target capacity, (2) instance warm-up via lifecycle hooks, (3) traffic switch via Route 53. Total standby compute saving: $950/month (79%).

**Exceptions**: If failover must complete in <30 seconds and instance warm-up takes >30 seconds, pre-provision full capacity in standby. If standby serves read traffic during normal operation, size based on read workload plus failover buffer.

**Consequences Of Violation**: Paying full compute cost for zero-traffic standby. Wasting $500-2,000/month per DR region on idle capacity. Not having automated scale-up means manual steps during high-pressure failover scenarios.
