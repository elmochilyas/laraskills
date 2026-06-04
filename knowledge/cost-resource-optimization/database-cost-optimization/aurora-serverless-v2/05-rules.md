## Set Minimum 4 ACU for Production
---
## Performance
---
Always set minimum ACU to at least 4 for production Aurora Serverless v2 databases; never use 0.5 ACU minimum.
---
0.5 ACU = 1GB memory, insufficient for any production working set; causes constant buffer pool thrashing, increasing I/O costs by 50-200% and degrading query performance.
---
Production: min ACU = 4, max ACU = 16. Working set fits in 8GB buffer pool.
---
min ACU = 0.5 for production database with 6GB working set.
---
True dev/test or staging databases where performance degradation is acceptable.
---
50-200% higher I/O costs, severely degraded query performance, constant buffer pool thrashing.
---
## Use Auto-Pause for Dev/Test
---
## Cost Optimization
---
Always set min ACU to 0 (auto-pause) for all non-production Aurora Serverless v2 instances.
---
Dev/test databases used intermittently; auto-pause drops compute charges to zero when idle, saving 60-80% vs always-on. Storage-only cost when paused.
---
Dev: min ACU = 0, auto-pause after 5 minutes idle. Compute cost = $0 when not in use.
---
Dev database running 24/7 at 0.5 ACU minimum ($43/month), used 8 hours/day.
---
Performance testing environments that must remain warm; still consider auto-pause for off-hours.
---
Paying $43/month minimum for idle compute; 60-80% unnecessary non-production spend.
---
## Evaluate I/O-Optimized When I/O > 25% of Compute
---
## Cost Optimization
---
Switch Aurora Serverless v2 to I/O-Optimized configuration when I/O charges exceed 25% of compute cost.
---
Standard charges $0.20/M I/O requests; I/O-Optimized charges higher ACU rate but eliminates per-I/O charges. Breakeven at ~25% I/O-to-compute ratio. Switching is instant with no downtime.
---
I/O cost = $100/month, compute cost = $300/month (33% ratio). Switch to I/O-Optimized.
---
Staying on Standard configuration with I/O charges exceeding compute costs.
---
Very low I/O workloads where I/O charges are <10% of compute; Standard is cheaper.
---
I/O charges exceed any potential ACU savings on I/O-Optimized.
---
## Monitor Buffer Pool Hit Ratio
---
## Monitoring
---
Always monitor Aurora Serverless v2 buffer pool hit ratio; target >95%.
---
Buffer pool hit ratio directly indicates whether working set fits in memory; <95% means too many I/O requests from disk. Increase min ACU until hit rate exceeds 95%.
---
BufferPoolHitRatio = 97%. Working set fits in 8GB (4 ACU). Current min ACU = 4 is correct.
---
BufferPoolHitRatio = 82% with min ACU = 0.5; 18% of reads hit disk.
---
No common exceptions; buffer pool hit ratio is the definitive metric for ACU right-sizing.
---
Excessive I/O charges from disk reads, poor query performance, incorrect ACU sizing.
---
## Right-Size Max ACU With Headroom
---
## Cost Optimization
---
Always set max ACU to peak traffic capacity + 20% headroom; never leave max ACU unlimited.
---
Without a max ACU limit, Aurora can scale unbounded during traffic spikes, creating surprise bills during unusual events (marketing campaigns, DDoS, viral traffic).
---
Peak observed: 8 ACU. Set max = 12 ACU (50% headroom for unexpected spikes).
---
No max ACU limit; database scales from 4 ACU to 64 ACU during traffic spike, cost jumps 16x.
---
Enterprise with dedicated budget and capacity planning; still set max ACU as safety net.
---
Surprise bills from unbounded Aurora scaling during traffic anomalies.
---
## Don't Use Serverless v2 for Steady Workloads
---
## Cost Optimization
---
Never use Aurora Serverless v2 for steady workloads with <2:1 peak-to-trough ratio; provisioned + RI is 20-60% cheaper.
---
Serverless v2 has no RI equivalent; provisioned instances with 3-year RI are 60% cheaper per compute-hour. For steady workloads, the premium is unjustified.
---
Peak 8 ACU, trough 6 ACU (1.3:1 ratio). Provisioned r6g.large + RI = 60% cheaper.
---
Serverless v2 for a steady 24/7 API database with minimal traffic variation.
---
Highly variable workloads (>5:1 ratio) where Serverless v2's pay-per-use model wins.
---
Paying 2-3x more for database compute than necessary with provisioned + RI.
