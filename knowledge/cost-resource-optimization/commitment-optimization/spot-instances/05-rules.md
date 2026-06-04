# Spot Instances — Rules

## R1: Use Spot for All Queue Workers

**Category**: Workload Selection

**Rule**: ALWAYS use Spot instances for queue worker fleets (SQS consumers, Laravel Horizon workers, Redis queue workers). AVOID running queue workers on On-Demand.

**Reason**: Queue workers are inherently fault-tolerant — when a worker is interrupted, the unprocessed message returns to the queue and is retried by another worker. SQS has a 4-day retention and built-in retry mechanism. Laravel Horizon handles job timeouts and retries automatically. Interrupting a queue worker causes zero data loss and minimal duplication. Running queue workers on Spot saves 70-90% compared to On-Demand with no reliability impact.

**Bad Example**: A team runs 10 Laravel Horizon workers on On-Demand (r6g.large, $0.1008/hour each). Monthly compute: $725.76. The workers process SQS messages — if one fails, SQS retries. There is no benefit to On-Demand.

**Good Example**: The team switches to Spot instances for all 10 workers (r6g.large Spot, $0.0202/hour typical). Monthly compute: $145.44. Savings: $580.32/month (80% reduction). On rare Spot interruption, SQS retries the message within seconds. No user-facing impact.

**Exceptions**: Workers handling idempotent operations with external side effects (sending emails, charging credit cards) — still safe on Spot if jobs are idempotent (which they should be). Workers with very long jobs (>30 minutes) may need checkpointing.

**Consequences Of Violation**: Paying 3-10x more for queue workers with no reliability benefit. Annual waste of $5,000-15,000+ for mid-scale worker fleets.

---

## R2: Implement Graceful Shutdown Handling via SIGTERM

**Category**: Interruption Resilience

**Rule**: ALWAYS implement SIGTERM signal handling in Laravel workers to gracefully shut down before Spot termination. NEVER rely on hard-kill termination without cleanup.

**Reason**: AWS sends a SIGTERM signal 2 minutes before Spot instance termination. This 2-minute window allows the worker to: (1) stop accepting new jobs from the queue, (2) finish the current in-flight job, and (3) return any unprocessed jobs to the queue. Without this handling, the instance is hard-killed after 2 minutes, potentially with jobs in-flight that either duplicate (if already partially processed) or are lost.

**Bad Example**: A Spot worker is processing a job that sends welcome emails to 1000 new users. After 500 emails, the instance is terminated without SIGTERM handling. 500 users get welcome emails, 500 do not. The job is retried — 500 users get duplicate welcome emails.

**Good Example**: On SIGTERM, the worker stops dequeuing new jobs, finishes the current batch, and marks the job as "needs retry" at the last checkpoint. On restart, the new worker resumes from the checkpoint. Zero duplicate emails, zero missed emails.

**Exceptions**: For truly stateless jobs that take <1 second and have zero side effects (e.g., cache warming), SIGTERM handling is less critical but still recommended for best practices.

**Consequences Of Violation**: Duplicate processing, partial job execution, or data corruption on Spot interruption. The savings from Spot are offset by recovery cleanup efforts.

---

## R3: Diversify Across 3+ Instance Types and 2+ AZs

**Category**: Capacity Diversification

**Rule**: ALWAYS configure Spot requests with a minimum of 3 instance types across 2+ Availability Zones. NEVER use a single instance type or single AZ for Spot capacity.

**Reason**: Spot capacity varies independently per instance type per AZ (each combination is a separate "capacity pool"). A diversified strategy reduces the probability of total capacity loss: if r6g.large is reclaimed in us-east-1a, r6i.large in us-east-1b may still be available. Diversification reduces the effective interruption rate from 10-20% (single pool) to 1-5% (diversified pools).

**Bad Example**: A Spot request specifies only r6g.large in us-east-1a. When r6g.large Spot capacity is reclaimed in that AZ, all 20 Spot instances terminate simultaneously. Zero capacity remains. Service degrades.

**Good Example**: Mixed instances group specifies r6g.large, r6i.large, and r6a.large across us-east-1a and us-east-1b — 6 capacity pools total. When one pool is reclaimed, the 33% of instances in that pool terminate, but the remaining 67% continue. The ASG launches replacement instances from other pools. No service impact.

**Exceptions**: For Fargate Spot, diversification is handled by the capacity provider (multiple underlying instance types are managed automatically). For single-AZ workloads that cannot be multi-AZ, use at least 3 instance types within that AZ.

**Consequences Of Violation**: Single-pool Spot configuration causes total capacity loss when that pool is reclaimed. 100% interruption instead of 15-30%. Service degrades or goes down.

---

## R4: Set Max Price to On-Demand Rate — Never Lower

**Category**: Pricing Configuration

**Rule**: ALWAYS set the max Spot price to the On-Demand rate for the instance type. NEVER set max price below the current Spot price to "save more."

**Reason**: The max price is the ceiling you're willing to pay. Setting it to the On-Demand rate means you never pay more than On-Demand, and typically pay far less (current Spot price). Setting a lower max price (e.g., 50% of On-Demand) causes immediate termination when the Spot price rises above your ceiling — even if the increase is temporary (minutes). Price spikes happen frequently for popular instance types, and the brief increase at On-Demand is far cheaper than recovering from a termination.

**Bad Example**: A team sets max price to $0.05/hour for r6g.large (50% of $0.1008 On-Demand). Spot price normally runs at $0.0202 but spikes to $0.06/hour for 10 minutes due to demand in another account. All 10 Spot instances are terminated. Recovery time: 5 minutes. Cost of recovery + missed requests: $50. Price savings from capped price: $0.03 x 10 instances = $0.30.

**Good Example**: Max price set to $0.1008 (On-Demand rate). Spot price spikes to $0.06/hour for 10 minutes. Spot instances continue running, paying $0.06/hour (still 40% off On-Demand). No interruption. Cost difference vs capped approach: $0.30 vs $50 recovery.

**Exceptions**: For interruptible batch jobs where interruption is truly acceptable (no user impact), you can set a lower max price to filter for cheaper Spot pools. But even here, the complexity tradeoff rarely justifies it.

**Consequences Of Violation**: Frequent, unnecessary Spot terminations due to temporary price spikes. Recovery overhead and possible service disruption for savings of pennies.

---

## R5: Use Auto Scaling Groups with Mixed Instances — Never Manual Spot Requests

**Category**: Management Automation

**Rule**: ALWAYS use Auto Scaling Groups with mixed instances policies to manage Spot capacity. NEVER request Spot instances manually or through single-instance Spot requests.

**Reason**: ASGs with mixed instances policies provide automatic capacity maintenance across instance types — if one pool is depleted, the ASG launches from another pool. They automatically replace interrupted instances, maintain desired capacity, and integrate with ALB health checks. Manual Spot requests require human intervention when capacity changes, leading to gaps in coverage and operational overhead.

**Bad Example**: A team manually launches 10 Spot instances via the AWS console for a batch job. 3 instances are interrupted during the job. No automatic replacement. The batch job runs 30% slower. The team must manually check and re-request.

**Good Example**: The team creates an ASG with mixed instances policy (3 types, On-Demand base 20%). The ASG maintains desired capacity automatically. When Spot instances are interrupted, the ASG replaces them from remaining pools within 2 minutes. The batch job completes on time. Zero manual intervention.

**Exceptions**: For one-off batch jobs that can tolerate long delays (24+ hour tolerance), simple Spot requests are acceptable. For any workload that needs reliable completion time, use ASGs.

**Consequences Of Violation**: Operational overhead of monitoring and re-requesting Spot capacity. Interruption gaps cause workload delays. No automatic diversification or health check integration.
