# Spot Interruption Costs — Rules

## R1: Calculate Net Spot Savings — Never Assume Gross Discount = Net Savings

**Category**: Savings Validation

**Rule**: ALWAYS calculate net Spot savings (gross savings - recovery costs - fallback costs - engineering overhead) before scaling Spot beyond 20% of fleet. NEVER assume the gross Spot discount (70-90%) represents actual savings.

**Reason**: LeanOps 2026 research found that 41% of Spot workloads lose money after factoring interruption overhead. Recovery costs (re-executing interrupted work, checkpoint writes), fallback On-Demand usage, and engineering time for managing Spot complexity can offset the gross savings. For long-running jobs without checkpointing, the recovery cost may exceed the Spot discount entirely. A 30-day measurement period reveals whether Spot is net positive or net negative for each specific workload.

**Bad Example**: A team migrates a 2-hour data processing pipeline to Spot — saves $2,000/month gross (70% discount). But interruptions cause 8 restarts/month, wasting 16 hours of compute = $400 in recovery. Fallback On-Demand during high-interruption periods: $600/month. Engineering time to manage interruptions: $500/month. Net savings: $2,000 - $1,500 = $500/month (25% of gross).

**Good Example**: The same team measures for 30 days before scaling. They find net savings are only $500/month. They implement checkpointing at 5-minute intervals, reducing recovery cost to $50/month. Net savings increases to $1,850/month. They continue with confidence that Spot is net positive.

**Exceptions**: For queue workers with jobs <1 minute, recovery cost is negligible (<1% of gross savings) — skip the 30-day measurement and go direct to Spot.

**Consequences Of Violation**: Scaling Spot blindly leads to negative ROI on 41% of workloads. Teams believe they're saving money but are actually losing it. The hidden costs of recovery and fallback are invisible in standard billing reports.

---

## R2: Prioritize Spot for Short-Lived Stateless Jobs (<5 Minutes)

**Category**: Job Duration Selection

**Rule**: ALWAYS use Spot instances for jobs shorter than 5 minutes. AVOID Spot for jobs longer than 30 minutes without checkpointing.

**Reason**: Recovery cost is proportional to job duration. A job interrupted at 4 minutes loses 4 minutes of work. A job interrupted at 4 hours loses 4 hours of work. Short jobs restart quickly and the recovery cost (re-execution time) is a small fraction of total compute. For long jobs, the recovery cost can exceed the Spot savings — especially if interruptions are frequent.

**Bad Example**: A team runs a 2-hour log processing job on Spot. Interruption rate: 5%/hour. Average recovery: 1 hour of lost work per interruption (60% of job progress lost). Over a month: 10 interruptions = 20 hours of wasted compute = $120 recovery cost vs $200 Spot savings. Net: $80 saved on $400 On-Demand equivalent. Savings rate: 20% (not 70%).

**Good Example**: The team runs 500,000 individual 2-second SQS message processing jobs on Spot. Interruption affects only in-flight jobs (maybe 10-20 messages). Recovery cost: 20-40 seconds of re-processing. Savings rate: 69.5% (virtually the full gross discount).

**Exceptions**: If long-running jobs implement checkpointing every 5 minutes, they behave like short jobs in terms of recovery cost. In that case, Spot with checkpointing is acceptable for any job duration.

**Consequences Of Violation**: Long-running jobs on Spot without checkpointing have net savings near zero or negative. The team mistakenly believes they're saving 70% when the actual savings are 10-20%.

---

## R3: Implement Checkpointing for Jobs Longer Than 5 Minutes

**Category**: Interruption Mitigation

**Rule**: ALWAYS implement checkpointing for any job running longer than 5 minutes on Spot instances. Save progress at regular intervals (<5 minute granularity) to persistent storage (DynamoDB, S3).

**Reason**: Checkpointing limits the recovery cost of an interruption to the time since the last checkpoint, not the entire job duration. A 2-hour job with 5-minute checkpointing loses only 5 minutes of work on interruption — not 2 hours. This transforms the economics of Spot for long-running jobs, reducing recovery cost by 95%+.

**Bad Example**: A 4-hour ETL pipeline runs on Spot without checkpointing. Interrupted at 3 hours. Recovery restarts from scratch — 3 hours of work lost. Over a month: 5 interruptions = 15 hours of re-execution. Recovery cost: $90. Spot savings: $120. Net: $30.

**Good Example**: Same pipeline with 5-minute checkpointing. Interrupted at 3 hours. Recovery resumes from last checkpoint (2h55m). Only 5 minutes of work repeated = $0.50 recovery cost. Over a month: 5 interruptions = $2.50 recovery. Net savings: $117.50.

**Exceptions**: Jobs that run in a single database transaction cannot checkpoint (state is all-or-nothing). For these, split into smaller transactional units or run on On-Demand.

**Consequences Of Violation**: Long-running jobs on Spot without checkpointing are economic losers. Recovery cost may exceed Spot savings, making On-Demand the cheaper, more reliable choice.

---

## R4: Monitor Spot Interruption Rate Per Instance Pool

**Category**: Rate Tracking

**Rule**: ALWAYS monitor Spot interruption rate per instance type and AZ combination. AVOID using instance types or AZs with consistently high interruption rates.

**Reason**: Different instance types have materially different interruption rates. GPU instances (g-series, p-series) have 15-25% hourly interruption rates due to high demand. General-purpose (m-series, t-series) have 1-5% rates. Memory-optimized (r-series) are in the middle at 3-8%. If you're using a high-interruption pool, the recovery costs may negate the savings. Monitoring per pool lets you switch to lower-interruption types.

**Bad Example**: A team uses g4dn.xlarge (GPU) instances for a batch job because they're cheap on Spot. Hourly interruption rate: 20%. Every 5 hours, a job is interrupted. Recovery cost: $50/hour x 5 interruptions = $250/month. Spot savings: $300/month. Net: $50/month. Not worth the operational headache.

**Good Example**: The team monitors interruption rates and switches to m7g.large (general-purpose, <3% interruption rate). Interruption rate drops from 20% to 2%. Recovery costs drop to $25/month. Net savings: $275/month. Same workload, dramatically better Spot economics.

**Exceptions**: If the workload specifically requires GPU or high-compute instance types (ML training, video encoding), accept higher interruption rates and mitigate with aggressive checkpointing.

**Consequences Of Violation**: Using high-interruption pools without awareness. Recovery costs silently erode Spot savings. The team attributes poor savings to "Spot not working" rather than the specific pool choice.

---

## R5: Use Capacity-Rebalancing for Proactive Instance Replacement

**Category**: Replacement Strategy

**Rule**: ALWAYS enable capacity-rebalancing on Spot-enabled Auto Scaling groups. Use the "capacity-optimized" allocation strategy for new instances.

**Reason**: Capacity-rebalancing proactively replaces Spot instances when AWS sends a rebalance recommendation (2+ minutes before termination). It launches new instances in different capacity pools before the old instances terminate, maintaining desired capacity without interruption. The "capacity-optimized" strategy selects instance pools with the least interruption risk, reducing future replacement needs.

**Bad Example**: Standard Spot ASG without capacity-rebalancing. Instance receives termination notice. ASG waits for instance to terminate, then launches a replacement. During the gap, capacity drops below desired. New instance takes 3 minutes to boot. Service runs at reduced capacity for 3-5 minutes.

**Good Example**: ASG with capacity-rebalancing enabled. Instance receives rebalance recommendation. ASG immediately launches a replacement in a different pool. Old instance continues serving traffic until termination. Replacement boots and joins. Zero capacity gap. Zero service impact.

**Exceptions**: For workloads that tolerate short capacity gaps (batch jobs, CI/CD), capacity-rebalancing is nice-to-have but not critical. For user-facing services, it is essential.

**Consequences Of Violation**: Brief capacity gaps during Spot replacement cycles. For user-facing services, this causes latency spikes. For queue workers, it causes processing delays that accumulate across the fleet.
