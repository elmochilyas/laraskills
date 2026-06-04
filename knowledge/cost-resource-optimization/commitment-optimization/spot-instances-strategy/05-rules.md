# Spot Instances Strategy — Rules

## R1: Default to Spot for All Queue Workers and CI/CD Runners

**Category**: Workload Prioritization

**Rule**: ALWAYS configure queue workers and CI/CD runners to use Spot instances by default. NEVER use On-Demand for these workloads unless a specific barrier is identified.

**Reason**: Queue workers and CI/CD runners are the highest-ROI Spot candidates because they are inherently fault-tolerant. SQS queues retry failed messages automatically when a worker is interrupted. CI/CD pipelines restart on interruption without data loss (build artifacts can be cached externally). These workloads typically represent 30-50% of total compute spend and can achieve 70-90% savings with Spot. There is no functional reason to use On-Demand.

**Bad Example**: A team runs 20 Laravel Horizon workers on On-Demand r6g.large at $0.1008/hour each. Monthly: $1,451.52. They also run 5 CI/CD runners on On-Demand: $362.88/month. Total: $1,814.40/month.

**Good Example**: Workers switch to Spot r6g.large at ~$0.0202/hour. CI/CD runners on Spot. Monthly: $290.30 + $72.58 = $362.88. Savings: $1,451.52/month (80%). On the rare occasion Spot interrupts, SQS retries the message and CI/CD restarts the build.

**Exceptions**: CI/CD runners with very long builds (2+ hours) where restart cost exceeds Spot savings. Workers handling non-idempotent operations (charging credit cards multiple times due to retry) — fix idempotency, then use Spot.

**Consequences Of Violation**: Paying 3-10x more for workloads that are perfectly suited for Spot. $10,000-50,000+ annual waste for mid-to-large scale deployments.

---

## R2: Always Pair Spot with On-Demand Fallback or RI Baseline

**Category**: Capacity Safety

**Rule**: ALWAYS ensure there is either an On-Demand fallback percentage (in mixed instances ASG) or RI baseline coverage beneath the Spot capacity. NEVER run 100% Spot without a fallback mechanism.

**Reason**: Spot capacity can be completely unavailable in rare circumstances (region-wide shortage, major event demand). Without fallback, the service goes down entirely. A mixed instances ASG with a 20-30% On-Demand base ensures that even if all Spot capacity is unavailable, the service runs at 20-30% capacity — degraded but functional. Alternatively, RIs provide a cheaper baseline than On-Demand as the fallback layer.

**Bad Example**: An ASG is configured with 100% Spot (0% On-Demand base). A region-wide GPU demand surge reduces Spot capacity for compute instances to zero. The ASG cannot launch any instances. The service is completely down for 4 hours until Spot capacity returns.

**Good Example**: The ASG has mixed instances: 70% Spot, 30% On-Demand. When Spot is completely unavailable, the ASG launches On-Demand instances for 30% capacity. Service operates at reduced capacity but stays online. When Spot returns, ASG shifts back to 70% Spot.

**Exceptions**: For truly non-critical workloads (internal dev tools, personal projects), 100% Spot without fallback is acceptable. For any revenue-generating or user-facing service, always have fallback.

**Consequences Of Violation**: Complete service outage when Spot capacity is unavailable. The savings from running Spot are meaningless if the service goes down for hours.

---

## R3: Implement SIGTERM Handlers in Laravel Workers

**Category**: Interruption Handling

**Rule**: ALWAYS implement SIGTERM signal handling in Laravel worker processes when running on Spot instances. NEVER deploy Spot workers without graceful shutdown logic.

**Reason**: AWS sends a SIGTERM signal 2 minutes before Spot termination. Laravel Horizon has built-in signal handling that can be configured to stop accepting new jobs and finish current jobs before termination. Without this, in-flight jobs are interrupted mid-execution — they may be retried (causing duplication) or lost entirely. Proper SIGTERM handling ensures clean job completion and no data loss.

**Bad Example**: A Spot worker is processing a batch of 500 email sends. Hard termination occurs at email 200. The job times out in SQS after the visibility timeout expires and is retried. All 500 emails are re-sent — 200 recipients get duplicates.

**Good Example**: On SIGTERM, Horizon's signal handler stops picking new jobs from the queue. The worker finishes the current batch of 500 emails within 90 seconds and completes cleanly. Next worker picks up remaining jobs. No duplicates, no lost jobs.

**Exceptions**: CI/CD runners and short-lived (<5 second) job workers have lower risk, but SIGTERM handling is still recommended for consistency. In all cases, jobs should be idempotent as a safety net.

**Consequences Of Violation**: Duplicate job execution, partial job completion, data corruption. The savings from Spot are partially offset by the cost of fixing data integrity issues.

---

## R4: Diversify Across 3+ Instance Types and 2+ AZs

**Category**: Pool Diversification

**Rule**: ALWAYS specify a minimum of 3 instance types across 2+ Availability Zones for Spot capacity. NEVER configure a single-instance-type Spot fleet.

**Reason**: Each (instance type, AZ) combination is a separate capacity pool. If you use only one pool and it runs out of capacity, 100% of your Spot instances are interrupted. With 3 types across 2 AZs (6 pools), losing any single pool affects only ~17% of capacity. AWS recommends 3+ instance types for production Spot usage. Diversification is the single most effective way to reduce Spot interruption impact.

**Bad Example**: Spot request uses only r6g.large in us-east-1a. When this specific pool is reclaimed, all 20 Spot instances terminate. Service loses 100% of Spot capacity.

**Good Example**: Mixed instances ASG includes r6g.large, r6i.large, r6a.large across us-east-1a and us-east-1b. When r6g.large in us-east-1a is reclaimed, only ~17% of instances are affected. The ASG launches replacements from the other 5 pools within minutes.

**Exceptions**: Fargate Spot handles diversification automatically. For workloads requiring specific instance types (GPU for ML training), diversify across available GPU types within the same budget.

**Consequences Of Violation**: 100% Spot capacity loss during pool-specific shortage. Service degradation or outage. The 60-80% interruption rate reduction from diversification is entirely missed.

---

## R5: Avoid Spot for Laravel Octane (Long-Lived Stateful Processes)

**Category**: Workload Exclusion

**Rule**: NEVER run Laravel Octane on Spot instances. ALWAYS use On-Demand or RIs for Octane-based applications.

**Reason**: Octane keeps the Laravel application booted in memory across requests — workers maintain state (cached config, loaded services, database connections, in-memory data). Spot interruption terminates all Octane workers simultaneously, dropping all in-flight HTTP requests and losing in-memory state. Unlike queue workers (which SQS retries), HTTP requests terminated by Spot interruption are lost entirely — users see 502 errors. The cost savings do not justify the reliability impact.

**Bad Example**: A Laravel Octane app serves 500 req/s across 4 Spot instances. A Spot interruption terminates all 4 instances. All 500 in-flight HTTP requests are dropped. Users see "502 Bad Gateway." The 2-minute warning is insufficient to drain 500 concurrent requests.

**Good Example**: Octane runs on On-Demand or RI instances (reserved for stability). Queue workers and CI/CD runners use Spot (tolerant of interruption). The app remains stable while saving 80% on the suitable workloads.

**Exceptions**: If Octane uses external session storage (Redis) and has zero in-memory state across requests, Spot could be considered — but this defeats Octane's performance benefits. Better to use traditional PHP-FPM with Spot.

**Consequences Of Violation**: Dropped HTTP requests during Spot interruptions cause user-facing errors. Revenue loss from interrupted transactions. The savings from Spot are dwarfed by the cost of outages.
