# KU-01-VM-SIZING: VM Sizing

## Metadata
- **ID**: KU-01-VM-SIZING
- **Subdomain**: Compute Optimization
- **Topic**: VM Sizing
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
VM sizing matches instance compute capacity (CPU, memory, network) to actual workload requirements. For Laravel applications, typical bottlenecks are CPU for PHP execution, memory for PHP-FPM pools, and network for data transfer. Graviton (ARM) instances offer 20% better price-performance than x86 for Laravel. Right-sizing eliminates 30-50% waste from over-provisioned instances while maintaining performance.

## Core Concepts
- **Instance families**: General purpose (t4g, m7g), compute optimized (c7g), memory optimized (r7g, x2g)
- **Graviton vs x86**: ARM-based Graviton (g6/g7) is 20% cheaper than equivalent x86 (i7) for Laravel
- **Burstable instances (t4g)**: CPU credits for baseline performance; burst for spikes; cost-effective for low-traffic
- **Dedicated vs shared tenancy**: Shared tenancy (default) is cheaper; dedicated tenancy for licensing
- **vCPU-to-memory ratio**: m7g = 1:4, r7g = 1:8, c7g = 1:2; choose based on app profile
- **EBS-optimized**: Dedicated bandwidth for EBS; essential for database servers

## Mental Models
- Default: Graviton family for all new instance recommendations
- Start small, monitor for 2 weeks, then right-size
- Distinguish t4g (burstable) from m7g (sustained) use cases

## Internal Mechanics
- Graviton vs x86: Identical PHP execution (PHP 8.x JIT works on ARM); 5-10% better perf on some workloads due to better cache architecture
- CPU credits on t4g: Earn 1 credit per vCPU hour; 1 credit = 1 minute at 100% CPU; exhaust credits = throttled to baseline (20-40% CPU)
- EBS bandwidth scales with instance size; large instances get more EBS throughput
- Network bandwidth scales with instance size; consider for high-traffic API servers

## Patterns
- Always choose Graviton
- Right-size with monitoring
- Start small, scale out
- Use t4g for burstable workloads

## Architectural Decisions
- Web servers: m7g.large or m7g.xlarge (1:4 CPU:mem ratio) for balanced workloads
- Queue workers: m7g.large (CPU-bound) or r7g.large (memory-bound for large payloads)
- Database servers: r7g.large or r7g.xlarge (memory optimized for database performance)
- Cache nodes: r7g.large for Redis (memory is primary constraint)
- Dev/staging: t4g.medium or t4g.large (burstable, lower cost)
- CI/CD runners: c7g.large (compute-optimized for build speed)

## Tradeoffs
**When To Use:**
- t4g instances: Dev/staging, low-traffic production (<100 req/s), burstable workloads
- m7g instances: Standard web/app servers; balanced CPU and memory
- r7g instances: Memory-bound apps (large cache, in-memory processing)
- c7g instances: CPU-intensive (image processing, PDF generation, data analysis)
- Graviton: All new deployments (ARM is the future, 20% cheaper)

**When NOT To Use:**
- t4g for sustained high CPU: Burstable instances exhaust credits; sustained >20% CPU needs m7g
- x86 for new deployments: Graviton is cheaper and performs equivalently for Laravel
- r7g for I/O-bound apps: Memory optimized doesn't help I/O bottlenecks; use m7g instead
- Large instances (xlarge+) for single-process workloads: Multiple PHP workers need multiple cores; one large instance > two mediums if CPU-bound

## Performance Considerations
- Graviton vs x86: Identical PHP execution (PHP 8.x JIT works on ARM); 5-10% better perf on some workloads due to better cache architecture
- CPU credits on t4g: Earn 1 credit per vCPU hour; 1 credit = 1 minute at 100% CPU; exhaust credits = throttled to baseline (20-40% CPU)
- EBS bandwidth scales with instance size; large instances get more EBS throughput
- Network bandwidth scales with instance size; consider for high-traffic API servers

## Production Considerations
- Dedicated instances prevent multi-tenant CPU co-residency (compliance requirement)
- Nitro hypervisor provides hardware-level isolation for all modern instances
- Instance metadata service (IMDSv2) should be enforced (prevents SSRF-based credential theft)
- Use instance-level security groups, not just subnets, for fine-grained access control

## Common Mistakes
- **Using t4g for production with sustained load**: Running 24/7 production at 40-60% CPU on t4g (Cause: t4g is labeled "general purpose"; Consequence: CPU credits exhausted, performance throttled; Better: use m7g for sustained workloads; t4g only for bursty/spiky loads)
- **Over-provisioning based on peak**: Sizing for 5-minute peak of 500 req/s when average is 50 req/s (Cause: sizing for worst case; Consequence: paying 10x for capacity used 1% of time; Better: use Auto Scaling to handle peaks, right-size for average)
- **Ignoring Graviton**: Deploying new instances on m7i/x86 instead of m7g/Graviton (Cause: inertia, "ARM compatibility concerns"; Consequence: 20% higher cost; Better: ARM compatibility is excellent for Laravel/PHP 8.x; benchmark confirms identical performance)

## Failure Modes
- **One big instance instead of multiple small**: Single m7g.2xlarge instead of 2 m7g.xlarge (reduced fault tolerance)
- **x86 default**: Accepting default instance type in launch templates without considering Graviton
- **Sizing for peak without Auto Scaling**: Instances idle 90% of time; wastes 40-70% of compute budget

## Ecosystem Usage
- **Low-traffic Laravel app (100 req/s)**: 2 x t4g.medium (burstable) fronted by ALB; cost ~$30/month
- **Mid-traffic app (1000 req/s)**: 3 x m7g.large in ASG with target tracking; cost ~$180/month
- **High-traffic app (10000 req/s)**: 6 x m7g.xlarge + Auto Scaling to 12 at peak; cost ~$700/month
- **Worker fleet**: 2 x m7g.large baseline + Spot scaling to 10 at peak

## Related Knowledge Units
- Server Provisioning (ku-02)
- Auto Scaling Policies
- Graviton Price-Performance

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.