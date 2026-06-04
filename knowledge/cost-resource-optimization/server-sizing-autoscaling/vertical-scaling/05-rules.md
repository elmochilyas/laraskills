# Vertical Scaling — Rules

## R1: Prefer Horizontal Scaling for Web Tier, Vertical for Databases/Cache

**Category**: Scaling Strategy

**Rule**: ALWAYS use horizontal scaling (add instances) for stateless web and worker tiers. ALWAYS use vertical scaling (bigger instances) for stateful database and cache tiers. NEVER use vertical scaling for web tiers with variable traffic.

**Reason**: Web/worker tiers are stateless — any instance can handle any request. Horizontal scaling provides fault tolerance (survive instance failure), granular cost control (add/remove small capacity units), and cheap Spot diversification. Databases and cache nodes are stateful — they hold the source of truth. Horizontal scaling for databases requires read replicas, sharding, or clustering, adding significant complexity. Vertical scaling (bigger RDS/ElastiCache instance) is simpler and maintains data consistency without application changes.

**Bad Example**: A Laravel web team increases instance size from m7g.large to m7g.xlarge ($130/month to $260/month) to handle peak traffic. When traffic drops, they're stuck paying $260/month for capacity they don't need. Single instance failure = complete outage.

**Good Example**: The web tier uses 3 x m7g.large in an ASG that scales to 6 during peak and back to 3 off-peak. The database tier uses Aurora Serverless v2 that scales vertically (4-16 ACU) based on CPU. Web: horizontal (cost-efficient, resilient). Database: vertical (simple, consistent).

**Exceptions**: For small deployments (<3 instances, <500 req/s), vertical scaling for web tier is acceptable due to simplicity. For database/cache tiers using Aurora Auto Scaling or ElastiCache with replicas, horizontal read scaling is possible.

**Consequences Of Violation**: Web tier incurs cost from over-provisioning (vertical) or lacks fault tolerance (single instance). Database tier suffers from complexity if horizontally scaled without need.

---

## R2: Right-Size Before Vertical Scaling — 2-Week Monitoring First

**Category**: Pre-Scaling Validation

**Rule**: ALWAYS monitor CPU, memory, and connection utilization for 2 weeks before scaling vertically. ONLY scale up if sustained utilization >70% for the monitored period. NEVER scale vertically "just in case."

**Reason**: Vertical scaling doubles cost for each size step (m7g.large → m7g.xlarge: 2x cost, ~2x capacity). Scaling up without verification often results in "capacity cushion" — paying 2x for a 10% utilization improvement. Two weeks of monitoring shows actual peak utilization patterns; scaling up only when sustained >70% ensures the cost increase is justified by actual demand. Multi-AZ RDS vertical scaling also requires downtime (5-30 minutes).

**Bad Example**: A team upgrades the database from r6g.large ($175/month) to r6g.xlarge ($350/month) because "quarter-end is coming." Pre-upgrade monitoring shows average CPU: 22%, peak: 45%. Post-upgrade: average CPU 11%, peak 22%. They doubled the database cost for capacity they didn't need. Quarter-end traffic: exactly the same as pre-upgrade.

**Good Example**: The team monitors for 2 weeks. Average CPU: 65%, peak: 85% (during end-of-month processing). They upgrade to r6g.xlarge during a maintenance window. Post-upgrade: average CPU 32%, peak 42%. The upgrade was justified — CPU was consistently >70% during peak. Cost increase: $175/month. Benefit: eliminated CPU-related query queueing.

**Exceptions**: For cache nodes where used_memory/maxmemory > 80%, the constraint is memory, not CPU — scaling up is justified without 2-week monitoring if cache evictions are increasing.

**Consequences Of Violation**: Paying 2x more for capacity that isn't needed. The "just in case" vertical scaling doubles costs without corresponding throughput improvement. The extra capacity sits idle.

---

## R3: Understand Vertical Limits — Plan Horizontal Migration Before Hitting Them

**Category**: Capacity Planning

**Rule**: ALWAYS know the maximum instance size for your instance family. Plan for horizontal scaling (read replicas, sharding) before reaching 80% of that maximum. NEVER let vertical scaling hit the ceiling without a migration plan.

**Reason**: Every instance family has a maximum size (e.g., r6g.24xlarge = 128 vCPUs, 1024GB RAM). Once you hit this ceiling, vertical scaling is no longer an option — you cannot increase capacity further. If you reach 80% utilization at 80% of the family max, you have limited runway. Migrating to a different family (e.g., r7g) or horizontally scaling (read replicas) takes planning and testing. Starting early avoids the pressure of a capacity emergency.

**Bad Example**: A team runs their production database on r6g.16xlarge (64 vCPUs). Monthly traffic growth: 8%. They reach 80% CPU. The next step is r6g.24xlarge (128 vCPUs) — 50% more capacity. If they outgrow that, there is no larger r6g. They must migrate to r7g or implement read replicas. They start planning only when CPU hits 80% at r6g.16xlarge, leaving limited time.

**Good Example**: The team tracks instance size utilization relative to the family maximum. At r6g.8xlarge (50% of family max, 50% CPU), they document the upgrade path: r6g.16xlarge → r6g.24xlarge → r7g migration or read replicas. At r6g.16xlarge (75% of family max, 55% CPU), they start testing read replicas. When they need to scale beyond r6g.24xlarge, the replica architecture is already validated.

**Exceptions**: For small instances (t4g.nano/small/medium), the maximum is rarely a concern — you'll likely consolidate or migrate to a different family before hitting limits.

**Consequences Of Violation**: Hitting the vertical scaling ceiling without a migration plan causes a capacity emergency. The team must scramble to implement read replicas or migrate instance families under pressure, with increased risk of migration failure.

---

## R4: Consider Octane for CPU-Intensive Vertical Scaling

**Category**: Optimization

**Rule**: ALWAYS consider switching to Laravel Octane before vertically scaling CPU-intensive applications. AVOID vertical scaling for CPU-bound web apps without evaluating Octane first.

**Reason**: PHP-FPM's process-per-request model uses memory, not CPU, as the primary constraint. A CPU-bound app on PHP-FPM cannot effectively utilize more than 4-8 vCPUs because each request is a separate process. Octane's worker model keeps the app booted in memory and can effectively utilize 16+ vCPUs. Before paying 2x for a larger instance, switching to Octane can provide 2-10x throughput improvement on existing hardware — a better ROI than any vertical scaling.

**Bad Example**: A CPU-bound Laravel app on PHP-FPM runs at 80% CPU on m7g.xlarge (4 vCPU). The team upgrades to m7g.2xlarge (8 vCPU, $520/month vs $260/month). PHP-FPM's per-request overhead means the additional CPU cores are underutilized — throughput increases only 40%. Cost increases 100% for 40% throughput gain.

**Good Example**: The team switches from PHP-FPM to Octane on the existing m7g.xlarge ($260/month). Octane's in-memory architecture eliminates per-request bootstrap overhead, improving throughput 3x on the same hardware. CPU utilization drops from 80% to 35%. No vertical scaling needed. Savings: $260/month avoided.

**Exceptions**: For I/O-bound apps (waiting on database queries, external APIs), Octane's benefit is smaller — vertical scaling on the database tier may be more impactful. Evaluate the bottleneck before choosing Octane vs vertical scaling.

**Consequences Of Violation**: Overpaying for CPU capacity that PHP-FPM cannot effectively utilize. Vertical scaling for CPU-bound apps without Octane provides diminishing returns — 2x cost for 1.4x throughput at best.

---

## R5: Use Scripted Resizes — Never Manual Console Changes

**Category**: Automation

**Rule**: ALWAYS script instance type changes using AWS CLI or Lambda. NEVER manually resize instances through the AWS console.

**Reason**: Manual vertical scaling is error-prone — wrong instance type selected, tags not updated, instance not returned to ASG, incorrect subnet specified. Scripted resizes are repeatable, testable, and documented. They can be run from CI/CD pipelines, included in deployment playbooks, and executed consistently. A 5-minute manual console change with a 30-minute error recovery time is worse than a 1-hour script that runs correctly every time.

**Bad Example**: An ops engineer manually resizes an RDS instance from r6g.large to r6g.xlarge via the console. During the maintenance window, they select the wrong instance class (r6g.x2g instead of r6g.xlarge — a 2x more expensive instance). The bill increases by $350/month. The mistake is discovered 2 months later. Waste: $700.

**Good Example**: A Terraform change updates `instance_class` from `db.r6g.large` to `db.r6g.xlarge`. CI/CD pipeline runs `terraform plan` (shows the change), then `terraform apply` (executes the resize). The change is reviewed, approved, and logged. If the wrong instance class is specified, the code review catches it. Cost: correct from day 1.

**Exceptions**: For emergency scaling (immediate capacity need during an incident), console changes are acceptable. Document the change and update IaC immediately after the incident.

**Consequences Of Violation**: Human error during manual resizing causes misconfiguration, wrong instance types, or cost overruns. The lack of audit trail makes post-hoc cost attribution impossible.
