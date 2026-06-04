## Right-Size Instance Families
---
## Cost Optimization
---
Always match instance family to workload profile: m7g for balanced web servers, r7g for memory-bound cache/database, c7g for CPU-intensive batch processing.
---
Each family optimizes a different resource ratio; mismatching wastes 20-50% of compute spend on underutilized capacity.
---
Use m7g.large for Laravel web server with Octane.
---
Use c7g.xlarge for a memory-bound Redis cache server.
---
Dev/staging environments where instance family impact is negligible.
---
Paying 2-3x more than necessary for equivalent throughput.
---
## Choose Graviton Over x86
---
## Cost Optimization
---
Always prefer Graviton (m7g/r7g/c7g/t4g) instance families over x86 (m7i/r7i/c7i) for all new deployments and migrations.
---
Graviton delivers 20% lower cost with identical PHP/Laravel execution performance; PHP 8.x compiles natively for ARM with no compatibility issues.
---
Launch template uses m7g.large instead of m7i.large.
---
Deploying new instances on m7i/x86 "because ARM compatibility concerns."
---
Workloads with native x86 binary dependencies (some compiled PHP extensions) or Windows workloads.
---
20% higher compute costs for every instance, compounding across all environments.
---
## Use t4g Only for Burstable Workloads
---
## Cost Optimization
---
Never use t4g burstable instances for sustained production workloads averaging >20% CPU; use m7g for sustained loads.
---
t4g instances earn CPU credits during idle and exhaust them under sustained load; once credits are exhausted, performance is throttled to 20-40% baseline CPU.
---
Low-traffic API at 5% avg CPU: 2 x t4g.medium saves 30% vs m7g.
---
Running 24/7 production web server at 60% CPU on t4g.large.
---
Dev/staging, low-traffic production <100 req/s, bursty/spiky workloads with average CPU <10%.
---
CPU credits exhausted, performance throttled by 60-80%, request timeouts during peak hours.
---
## Right-Size With 2-Week Monitoring
---
## Cost Optimization
---
Always collect 2 weeks of CloudWatch CPU/memory/network metrics before resizing instances; never resize based on 1-day measurements.
---
Single-day monitoring misses weekend lows, peak hours, and weekly patterns; 2-week data reveals true baseline and peak, preventing both over-provisioning and under-provisioning.
---
Monitor for 14 days, observe peak CPU at 40% at 3PM weekdays, right-size from xlarge to large.
---
Using a 1-hour load test to determine "peak" instance size.
---
Emergency capacity changes for immediate performance issues; revisit with full data later.
---
Over-provisioning by 1-2 instance tiers, wasting 30-50% of compute budget.
---
## Prefer Horizontal Over Vertical Scaling
---
## Architecture
---
Prefer 2 smaller instances over 1 larger instance when comparable total compute is needed.
---
Horizontal scaling provides better fault tolerance (survives AZ failure), more granular cost control, and enables Auto Scaling for traffic variation.
---
2 x m7g.large instead of 1 x m7g.xlarge.
---
Single m7g.2xlarge instead of 2 m7g.xlarge for "simplicity."
---
Workloads that cannot be distributed horizontally (legacy single-server licensing, ultra-low latency inter-process communication).
---
Reduced fault tolerance, single point of failure, less granular scaling.
