## Run Cost Model With Actual 90-Day Traffic
---
## Cost Optimization
---
Always model Aurora Serverless v2 vs provisioned cost with your actual 90-day traffic pattern; never rely on the 3:1 rule of thumb alone.
---
3:1 is for on-demand vs on-demand comparison; with RIs, breakeven shifts to ~5:1. Your specific traffic shape (diurnal, weekly, seasonal) affects the calculation.
---
90-day CloudWatch: 4 ACU peak, 1 ACU trough = 4:1 ratio. With RI: provisioned 60% cheaper. Choose provisioned.
---
Using 3:1 rule without RI impact; Serverless v2 appears 30% cheaper than provisioned + RI — actual is 20% more expensive.
---
No common exceptions; actual traffic data always beats rules of thumb.
---
Wrong database platform choice; paying 20-60% more than optimal.
---
## Consider Hybrid Provisioned + Serverless Readers
---
## Cost Optimization
---
Evaluate hybrid architecture: provisioned writer (with RI) + Serverless v2 readers for variable read workloads.
---
Writes are typically steady and predictable; reads vary with traffic. Provisioned writer gets RI discount; Serverless reader ACUs scale to match read traffic. Often cheaper than either pure approach.
---
Writer: db.r7g.large with 3-year RI ($0.10/ACU-hour). Readers: 2-8 ACU Serverless v2 ($0.12/ACU-hour).
---
Pure Serverless v2 for a workload with steady writes and variable reads.
---
Write-heavy or uniformly variable workloads where hybrid adds complexity without savings.
---
Paying Serverless premium on steady writes or provisioned premium on variable read capacity.
---
## Set Minimum ACU to Working Set Size
---
## Performance
---
Always set Aurora Serverless v2 minimum ACU based on buffer pool working set size, not the absolute minimum (0.5 ACU).
---
Minimum 0.5 ACU (1GB) causes buffer pool thrashing, increasing I/O costs; set minimum to hold working set in memory. Each ACU adds ~2GB buffer pool.
---
Working set: 6GB. Min ACU = 4 (8GB buffer pool, 2GB headroom). Max ACU = 16.
---
Min ACU = 0.5 for a 6GB working set; 83% of buffer pool misses go to disk.
---
Dev/test or staging where performance degradation is acceptable.
---
50-200% higher I/O charges from buffer pool thrashing, severe query degradation.
---
## Factor RDS Proxy Cost Into Breakeven
---
## Cost Optimization
---
Always include RDS Proxy's minimum 8 ACU charge (~$300/month) when comparing Serverless v2 to provisioned Aurora.
---
RDS Proxy scales with Aurora Serverless ACU; minimum 8 ACU charge persists even if Aurora is at 0.5 ACU. This can negate Serverless cost advantage for small workloads.
---
Serverless v2 at 2 ACU average + RDS Proxy 8 ACU minimum = 10 ACU effective cost.
---
Comparing Serverless v2 "$0.24/hour" + RDS Proxy "$0.015/hour" without factoring 8 ACU minimum.
---
Using PgBouncer instead of RDS Proxy (no minimum ACU charge).
---
Serverless v2 appears cheaper than it is; RDS Proxy minimum negates small-workload savings.
---
## Re-Evaluate Quarterly
---
## Cost Optimization
---
Always re-evaluate Aurora Serverless v2 vs provisioned cost quarterly as traffic patterns evolve.
---
A 3:1 ratio today may become 2:1 after optimization; Serverless v2 that was optimal may now be more expensive than provisioned + RI. Quarterly review captures changes.
---
Q1: 5:1 ratio, Serverless v2 optimal. Q2: 2:1 ratio after optimization, switch to provisioned + RI.
---
Choosing Serverless v2 at deployment and never re-evaluating.
---
No common exceptions; traffic patterns always evolve.
---
Paying premium for wrong platform as traffic patterns change.
