## Benchmark Octane on Existing Infrastructure First
---
## Testing
---
Always benchmark Octane on your existing Forge/EC2 deployment before migrating to Cloud; never assume Filament's 3x gains apply to your workload.
---
Filament's 3x throughput and 4x replica reduction are specific to their workload pattern; your app may see different gains. Isolate variables: test Octane first, then migrate platform.
---
Deploy Octane to Forge staging; measure req/s, p95 latency, memory; compare to PHP-FPM baseline.
---
Migrating to Cloud + Octane simultaneously without testing Octane on current infrastructure.
---
Apps already running Octane; migration benefits can be modeled from existing metrics.
---
Cannot attribute cost changes to Octane vs Cloud factors; wrong migration ROI calculation.
---
## Migrate Runtime, Then Platform
---
## Architecture
---
Always migrate the runtime (PHP-FPM → Octane) before migrating the platform (Forge/EC2 → Cloud).
---
If Octane doesn't help your workload, Cloud won't fix it. Sequential migration isolates variables and allows rollback at each step.
---
Sprint 1: Octane on Forge/EC2. Sprint 2: Validate. Sprint 3: Migrate to Cloud.
---
Migrating to Cloud + Octane simultaneously with a single cutover.
---
Workloads where Forge/EC2 and Cloud Octane configuration are identical; simultaneous cutover saves time.
---
No clear attribution of cost savings, no Octane rollback path without platform rollback.
---
## Target Fewer, Larger Replicas
---
## Architecture
---
Prefer fewer, larger replicas with Octane over many small PHP-FPM replicas.
---
Octane handles more requests per process; larger instances with Octane outperform many smaller PHP-FPM instances. Fewer replicas also reduce ALB connection overhead.
---
Before: 8 x t3.medium (PHP-FPM). After: 2 x Fargate 4 vCPU/8GB (Octane).
---
8 small replicas with Octane; each replica under-utilized.
---
I/O-bound workloads where small instances handle concurrent requests efficiently.
---
Under-utilized compute capacity, higher ALB costs, unnecessary complexity.
---
## Enable Auto-Scaling Post-Migration
---
## Architecture
---
Always configure ECS Service Auto Scaling on Cloud after migration; base targets on measured traffic, not estimates.
---
Right-sizing is a continuous process; auto-scaling adjusts to actual traffic patterns. Cloud's auto-hibernation scales to zero when idle.
---
Service Auto Scaling: target CPU 60%, min=2, max=10, scale-in cooldown=300s.
---
Fixed 5 containers after migration regardless of traffic variation.
---
Over-provisioned during low traffic, under-provisioned during peaks.
---
## Budget Migration TCO Including Engineering
---
## Cost Optimization
---
Always include engineering hours, testing, and rollback capacity in migration TCO calculation.
---
Migration saves 50-75% monthly but costs 2-4 weeks engineering time; breakeven is typically 2-4 months. Including TCO prevents "surprise" in payback period.
---
Migration cost: 3 weeks × $10K engineering. Monthly savings: $800. Breakeven: 12.5 months.
---
Comparing only monthly infra costs: "$1,200 → $400 = $800/month savings."
---
Very small apps where engineering time is sunk cost; still model for decision making.
---
Underestimating true migration cost by $10-40K, unrealistic payback expectations.
---
## Maintain Rollback Plan
---
## Reliability
---
Always keep Forge/EC2 deployment running for 2 weeks after Cloud migration for rollback capability.
---
Cloud configuration may need tuning; DNS changes take time to propagate. Maintaining old infrastructure provides safety net and enables gradual traffic shift.
---
Forge servers running in parallel; DNS weighted 90% Cloud, 10% Forge for 2 weeks.
---
Terminating Forge servers on migration day "to save money."
---
No rollback path; 24-48h downtime to reprovision if Cloud issues arise.
