# Vertical Scaling

## Metadata
- **ID**: KU-02-VERTICAL-SCALING
- **Subdomain**: server-sizing-autoscaling
- **Domain**: cost-resource-optimization
- **Topic**: Vertical Scaling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Vertical scaling increases the size of individual server instances (more CPU, memory, network) instead of adding more instances. For Laravel applications, vertical scaling is appropriate for stateful workloads (databases, cache nodes) and applications that can't easily be horizontally scaled. While simpler to implement (no architecture changes), vertical scaling has limits (instance max size) and provides no fault tolerance. The key cost consideration: a large instance costs less than multiple smaller ones for the same total capacity, but the lack of granularity often leads to over-provisioning.

## Core Concepts
- **Instance size progression**: t4g.nano -> micro -> small -> medium -> large -> xlarge -> 2xlarge -> 4xlarge -> ...
- **Cost scaling**: Cost doubles approximately per size step (2x cost for 2x capacity)
- **Vertical limit**: Maximum instance size is ceiling; cannot scale beyond largest available instance
- **Downtime**: RDS vertical scaling requires downtime (5-30 minutes); EC2 requires stop/start (minutes)
- **Multi-threading**: PHP-FPM workers use multiple cores; Octane workers benefit from more cores
- **Memory-bound workloads**: Databases benefit from vertical scaling (more memory = larger buffer pool)
- **Vertical vs horizontal cost**: 1 x large often costs same as 2 x medium; vertical simpler, horizontal more resilient

## When To Use
- Database tier: RDS/Aurora instances; vertical scaling is the primary scaling method (read replicas help read scaling)
- Cache tier: ElastiCache Redis; memory is primary constraint; vertical scaling adds memory
- Stateful applications: Apps that can't easily be horizontally scaled
- Small deployments: 1-2 instances; vertical scaling is simpler than setting up ASG
- Octane workers: Vertical scaling adds CPU cores = more Octane workers per instance
- Legacy applications: Monolithic apps that aren't designed for horizontal scaling

## When NOT To Use
- Web tier with variable traffic: Horizontal scaling provides better cost efficiency (match capacity to load)
- Fault-tolerant requirements: Vertical scaling is single point of failure; use multi-instance horizontal
- Near-instance limits: If you're at 4xlarge or larger, consider horizontal scaling (instance limit approaching)
- Cost-sensitive scaling: Vertical scaling often leads to over-provisioning (coarse granularity)
- Rapid scaling needs: Vertical scaling takes 5-30 minutes of downtime; horizontal scaling is instant (add another instance)
- Stateless workloads: Horizontal scaling is always better for stateless apps

## Best Practices
- **Prefer horizontal for web, vertical for databases**: Web tier scales horizontally (add instances); database scales vertically (bigger instance) (WHY: web tier is stateless and benefits from horizontal's resilience; database is stateful and vertical scaling maintains data consistency; mixing both strategies optimizes cost and reliability)
- **Right-size before vertical scaling**: Monitor utilization for 2 weeks; scale up only if sustained >70% CPU/memory (WHY: vertical scaling is expensive and irreversible (can only scale up, not down easily); ensure you actually need the capacity before paying for it)
- **Consider Octane for vertical efficiency**: Octane uses more CPU cores efficiently; vertical scaling to larger instances benefits Octane more than PHP-FPM (WHY: PHP-FPM workers scale with memory, not CPU; Octane workers scale with CPU cores; vertical CPU scaling directly improves Octane throughput)
- **Use burstable instances for irregular vertical load**: t4g instances provide CPU credits for occasional spikes; vertical scaling to larger t4g gives more credits (WHY: if average CPU <20% with occasional spikes, t4g is cheaper than m7g; vertical scaling within t4g family maintains burst advantage)
- **Plan for vertical limits**: Most instance families max at 24xlarge (128 vCPUs, 1024GB RAM); beyond that scale horizontally (WHY: even databases have vertical limits; Aurora Serverless v2 scales to 256 ACU; beyond that, need read replicas or sharding)
- **Use resize scripts for common sizes**: Automate instance type changes with AWS CLI or Lambda (WHY: vertical scaling should not require manual console work; scripted resize with appropriate downtime handling)

## Architecture Guidelines
- Database: Start with r7g.large, monitor, scale up to r7g.xlarge if sustained >70% CPU
- Cache: Start with cache.r7g.large, monitor used_memory/maxmemory ratio, scale up when >80%
- Octane: Start with m7g.xlarge (4 vCPUs for 4-8 Octane workers), scale up for more workers
- Web server: Prefer horizontal scaling over vertical for web tier
- Vertical scaling path: Define instance upgrade path (medium -> large -> xlarge -> 2xlarge)
- No automatic vertical scaling: Vertical resizing requires manual action (or scheduled change for known events)

## Performance Considerations
- Instance size vs throughput: Not linear for PHP (memory-bound apps benefit more than CPU-bound)
- Octane scaling: 2x CPU cores = ~1.8x throughput (near-linear); PHP-FPM: 2x memory = ~1.5x workers
- EBS bandwidth scales with instance size; larger instances get more EBS throughput
- Network bandwidth scales with instance size; relevant for high-traffic API servers
- RDS vertical scaling: Larger instance = more connections, more IOPS, larger buffer pool

## Security Considerations
- Vertical scaling to larger instances inherits same security boundary (Nitro hypervisor)
- Larger instances may have different Trusted Platform Module (TPM) support
- Instance metadata service v2 settings persist across resize
- EBS encryption settings persist; no re-encryption needed
- KMS key policies may need updating for cross-service access at scale

## Common Mistakes
1. **Vertical scaling the web tier instead of horizontal**: Adding bigger web servers instead of adding more of them (Cause: familiar with traditional server scaling; Consequence: no fault tolerance, coarse scaling, over-provisioning; Better: use ASG with smaller instances for web)
2. **Skipping right-sizing before scaling up**: Going from m7g.large to m7g.xlarge without checking utilization (Cause: "more is better" assumption; Consequence: paying 2x for 10% utilization improvement; Better: monitor CPU/memory for 2 weeks; scale only if sustained >70%)
3. **Vertical-only strategy**: Scaling every tier vertically; hitting instance limits on database, no fault tolerance anywhere (Cause: simple architecture; Consequence: production without redundancy; single instance failure = outage; Better: horizontal for web, vertical for DB; add read replicas)
4. **Vertical scaling without considering Octane**: Adding memory when the app is CPU-bound (Cause: assuming all scaling is same; Consequence: more memory doesn't help CPU-bound app; Better: identify bottleneck; if CPU-bound, scale vertically or switch to Octane)

## Anti-Patterns
- **Vertical-only architecture**: All tiers scaled vertically; no horizontal capacity, no redundancy
- **Instances at 80%+ max size**: Running at limits; vertical scaling maxed out; should have scaled horizontally earlier
- **Right-sizing to peak**: Sizing for absolute peak (r7g.4xlarge) when average is 20%; pay 5x for unused capacity
- **Manual vertical scaling**: Console-clicks for every resize; not scripted; error-prone

## Examples
- **Database vertical scaling**: r7g.large (2 vCPUs, 16GB) -> r7g.xlarge (4 vCPUs, 32GB) -> r7g.2xlarge (8 vCPUs, 64GB) based on sustained CPU > 70%
- **Cache vertical scaling**: cache.r7g.large (13GB) -> cache.r7g.xlarge (26GB) -> cache.r7g.2xlarge (53GB) based on used_memory > 80% of maxmemory
- **Octane vertical scaling**: m7g.xlarge (4 vCPUs, 8 Octane workers) -> m7g.2xlarge (8 vCPUs, 12 Octane workers)

## Related Topics
- Horizontal Scaling (ku-01)
- Predictive Autoscaling (ku-03)
- VM Sizing
- Octane Resource Usage

## AI Agent Notes
- Default: horizontal for web, vertical for databases/cache
- Right-size before scaling; 2-week monitoring
- Know your vertical limit and plan horizontal migration before hitting it

## Verification
- [ ] Database/cache: vertical scaling strategy defined
- [ ] Web tier: horizontal scaling preferred over vertical
- [ ] Right-sizing analysis done before scaling up
- [ ] Vertical scaling path documented (medium->large->xlarge...)
- [ ] Octane considered for CPU-intensive vertical scaling
- [ ] Instance limits understood and monitored
- [ ] No vertical-only architecture (no fault tolerance)
