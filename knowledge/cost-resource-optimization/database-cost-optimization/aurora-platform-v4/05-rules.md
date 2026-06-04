## Upgrade Aurora v3 to v4 Immediately
---
## Cost Optimization
---
Always upgrade existing Aurora v3 clusters to v4 immediately — the 28% cost reduction is free and requires no code changes.
---
v4 delivers 27% faster query completion and 28% lower cost vs v3; upgrade is a parameter group change with full backward compatibility. There is no downside.
---
Modify DB cluster parameter group: aurora_version = 4.0. Schedule during maintenance window.
---
Waiting 6 months "for stability" on v3, paying 28% more than necessary.
---
Aurora v4 not yet available in the target AWS region; check regional availability.
---
28% higher database cost for every month of delay; unnecessary.
---
## Re-Evaluate Instance Sizing After v4 Upgrade
---
## Cost Optimization
---
Always evaluate downsizing Aurora instances after upgrading to v4; the 27% performance improvement may allow a smaller instance class.
---
If your instance was sized for v3 performance, v4's improvement means same throughput with less compute. Consider one tier down after 2 weeks of monitoring.
---
Pre-v4: r6g.large ($200/month). Post-v4: monitor for 2 weeks; downsize to r6g.small ($100/month).
---
Staying on r6g.xlarge after v4 upgrade; v4 gives 27% more performance than needed.
---
Instances already at minimum size for workload; still verify with metrics.
---
Paying for 27% more compute capacity than needed after v4's efficiency improvements.
---
## Combine v4 With Graviton
---
## Cost Optimization
---
Always combine Aurora v4 (28% savings) with Graviton instances (20% savings) for maximum total database cost reduction (~42%).
---
v4 and Graviton are independent optimizations; v4 savings come from storage/execution improvements; Graviton savings from ARM pricing. Both apply simultaneously.
---
Aurora v4 on db.r7g.large: 28% (v4) + 20% (Graviton) = ~42% total vs v3 on x86.
---
Upgrading to v4 but staying on x86 instances — leaving 20% savings on the table.
---
Workloads with x86-only binary dependencies; rare for Aurora.
---
Missing 20% additional database cost reduction from Graviton migration.
---
## Test Query Performance After Upgrade
---
## Testing
---
Always benchmark critical queries with Performance Insights before and after v4 upgrade to identify any execution plan changes.
---
v4's optimizer changes may alter query execution plans; 27% faster is average — some queries may see regression. Benchmarking catches regressions before they affect users.
---
Run Performance Insights for 48h pre-upgrade; compare top-5 queries post-upgrade; verify no regression.
---
Upgrading without monitoring; discovering query regression through user complaints.
---
No common exceptions; query execution plans can always change with engine upgrades.
---
Undetected query performance regression, user-facing latency degradation.
