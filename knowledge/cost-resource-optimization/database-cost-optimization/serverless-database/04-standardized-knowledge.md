# Serverless Database

## Metadata
- **ID**: KU-07-SERVERLESS-DATABASE
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Serverless Database
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Serverless databases (Aurora Serverless v2, Neon) automatically scale compute capacity based on demand, charging only for what you use. For Laravel applications with variable traffic, serverless databases eliminate over-provisioning waste: you don't pay for idle capacity during low traffic. Aurora Serverless v2 scales in ACU increments (0.5-256 ACU). Neon Serverless Postgres offers pay-per-use with instant branching for development and preview environments.

## Core Concepts
- **Aurora Serverless v2**: Scales compute 0.5-256 ACUs; pay $0.12/ACU-hour; sub-second scaling; supports all Aurora features
- **Neon Serverless Postgres**: Pay-per-use ($0.04/hour compute + $0.15/GB-month storage); instant branching; serverless
- **ACU (Aurora Capacity Unit)**: ~2GB memory + corresponding CPU; min 0.5 ACU (1GB RAM, $0.06/hour)
- **Auto-pause**: Aurora Serverless v1 pauses after inactivity (not in v2); Neon pauses compute after 5 minutes
- **Scaling range**: Min and max ACU; set min for baseline, max for peak; wider range = more scaling flexibility
- **Connection pooling**: RDS Proxy automatically configures with Aurora Serverless

## When To Use
- Aurora Serverless v2: Variable traffic, infrequent peaks, or unpredictable workloads
- Neon: Development/staging/CI databases; preview environments; branch-per-feature workflow
- Serverless: When you don't want to manage database instance sizing
- Serverless: Spiky workloads (marketing campaigns, seasonal apps)
- Serverless: Multi-tenant SaaS with variable per-tenant load
- Neon branching: Parallel development teams needing isolated database branches

## When NOT To Use
- Aurora Serverless: Predictable high-traffic workloads > 100 ACU sustained (RIs are cheaper)
- Serverless v1: Aurora Serverless v1 has cold start (5-30 seconds); not suitable for production
- Serverless for steady 24/7 load: Provisioned RDS with 3-year RI is 60-70% cheaper at sustained load
- Serverless during warm-up: Scaling takes 1-5 seconds for large jumps; not suitable for instant burst
- Neon for production data > 50GB: Neon's pricing model favors smaller databases (<50GB)

## Best Practices
- **Use Aurora Serverless v2 for variable workloads**: Set min ACU to handle baseline traffic, max for peak (WHY: over-provisioning for peak costs 3x more than serverless scaling; serverless pays only for what you use; min 0.5 ACU handles light traffic, max 64 ACU handles holiday spikes)
- **Compare break-even with RDS Reserved**: Serverless 24/7 at 4 ACU = $350/month; RDS r7g.large with 3-year RI = ~$60/month (WHY: serverless is cheaper for variable/spiky workloads; RDS with RI is cheaper for steady 24/7 workloads; calculate break-even before choosing)
- **Use Neon for ephemeral environments**: Create database branch per PR/feature; delete when merged (WHY: Neon branching is instant (copy-on-write); branch costs $0 until compute is active; eliminates shared dev database contention)
- **Set min ACU for baseline, not 0.5**: If app has 100 req/s baseline, set min ACU to handle it (WHY: scaling from 0.5 ACU to 8 ACU on traffic spike takes 1-5 seconds; during that time, queries queue up; set min ACU to baseline needs)
- **Use RDS Proxy with Aurora Serverless**: RDS Proxy manages connection scaling as ACUs change (WHY: connections must scale with compute; RDS Proxy handles this transparently; without it, application connections break during ACU scaling)
- **Monitor ACU utilization**: CloudWatch `ServerlessDatabaseCapacity` metric; adjust min/max if at limits (WHY: consistently at max ACU means under-provisioned; consistently at min ACU means over-provisioned; adjust range monthly)

## Architecture Guidelines
- Set min ACU = (baseline_queries_per_second / 1000) * 2 (rough estimate)
- Set max ACU = (peak_queries_per_second / 1000) * 2 or budget limit
- Always use RDS Proxy with Aurora Serverless v2
- Use Neon for: development, staging, CI/CD, preview deployments, feature branches
- Use Aurora Serverless v2 for: production with variable traffic, seasonal apps
- Monitor scaling events: CloudWatch `CapacityChange` events indicate scaling activity

## Performance Considerations
- Cold start (Neon): ~500ms for idle compute to resume (after 5-minute pause)
- Aurora v2 scaling: 1-5 seconds for large ACU jumps; sub-second for small adjustments
- ACU = ~2GB memory + 1 vCPU (roughly); 4 ACU = comparable to t4g.medium
- Maximum ACU scale: 256 ACU (Aurora Serverless v2), ~512GB memory
- Query throughput scales with ACU; more ACU = more connections, faster queries

## Security Considerations
- Aurora Serverless: Same security as provisioned Aurora (encryption, VPC, IAM)
- Neon: SOC 2 compliant; encryption at rest/transit; VPC peering available
- Database branches contain all data; ensure branch pruning for deleted environments
- Serverless database connections may change IP addresses; use DNS-based connections
- Auto-pause can cause connection timeouts; configure wait time appropriately

## Common Mistakes
1. **Using Aurora Serverless v1 for production**: 5-30 second cold start on every request after idle (Cause: Aurora v1 is labeled "serverless" and seems ideal; Consequence: requests timeout or experience multi-second latency; Better: use Aurora Serverless v2 (sub-second scaling) or provisioned RDS)
2. **Setting min ACU to 0.5 for production**: Database scales from 0.5 ACU on every traffic increase (Cause: cost minimization; Consequence: 1-5 second scaling lag causes request queuing; Better: set min ACU based on baseline traffic)
3. **Not considering break-even**: Running Aurora Serverless v2 24/7 at 8 ACU = $700/month; RDS r7g.large 3yr RI = $60/month (Cause: "serverless is always cheaper" assumption; Consequence: paying 12x more for steady workload; Better: calculate break-even: serverless for <50% utilization, provisioned for >50% utilization)
4. **Neon for production with large data (>50GB)**: Neon's compute-storage separation adds latency for large datasets (Cause: Neon is great for dev; Consequence: query latency increases with data size; Better: use Aurora or RDS for production > 50GB)

## Anti-Patterns
- **Aurora Serverless v2 + single AZ**: Serverless doesn't support multi-AZ in all configurations; check HA requirements
- **Neon for all environments including production**: Neon is great for dev/preview but production may need Aurora
- **No max ACU cap**: Unlimited scaling budget; a traffic spike could cost thousands per hour
- **Serverless for steady-state workloads**: Paying premium for scaling you don't need

## Examples
- **Laravel SaaS (variable traffic, 100-10000 req/day)**: Aurora Serverless v2, min=2 ACU, max=16 ACU; cost ~$150/month
- **Development environment**: Neon, 0.25 compute/hour active, $10/month; branch-per-feature for 10 developers
- **CI/CD pipelines**: Neon branch created per PR, deleted on merge; auto-pause after 5 min idle; <$0.50 per PR
- **Steady-state app wrong choice**: 24/7 app at 4 ACU constant; switch to RDS r7g.large with 3yr RI saves 60%

## Related Topics
- Reserved Instances (ku-01 in compute-commitment)
- Read Replicas Cost (ku-05)
- Data Archival (ku-03)

## AI Agent Notes
- Default: Aurora Serverless v2 for variable workloads; RDS RI for steady
- Default: Neon for dev/staging/CI environments
- Always calculate break-even before recommending serverless

## Verification
- [ ] Serverless vs provisioned break-even analyzed
- [ ] Aurora Serverless v2 min ACU set to baseline needs (not 0.5)
- [ ] RDS Proxy configured with Aurora Serverless
- [ ] ACU utilization monitored (adjust min/max range)
- [ ] Aurora Serverless v1 not used for production
- [ ] Neon used for dev/staging/CI (not production)
- [ ] Max ACU cap set for budget control
