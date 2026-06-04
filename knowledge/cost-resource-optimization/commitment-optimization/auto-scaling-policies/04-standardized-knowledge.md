# Auto Scaling Policies

## Metadata
- **ID**: KU-03-AUTO-SCALING-POLICIES
- **Subdomain**: compute-commitment-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Auto Scaling Policies
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Auto Scaling policies determine how compute capacity expands/contracts in response to load. For Laravel applications, the choice between dynamic (target tracking, step scaling) and predictive scaling significantly impacts both cost and performance. Predictive scaling is especially powerful for applications with predictable daily/weekly traffic patterns. Correctly configured scaling policies eliminate over-provisioning waste while preventing under-provisioning performance issues.

## Core Concepts
- **Target tracking scaling**: Maintains a metric at target value (e.g., CPU at 60%); simplest and most common
- **Step scaling**: Adds/removes capacity in steps based on alarm breach magnitude; more granular
- **Simple scaling**: Execute single scaling action based on alarm (deprecated; prefer target tracking)
- **Predictive scaling**: Uses ML to forecast daily/weekly load and proactively adjust capacity
- **Cool-down period**: Time between scaling activities to prevent thrashing
- **Warm-up time**: Time for new instance to become fully operational (minutes)
- **Scheduled scaling**: Time-based capacity changes for predictable events (marketing campaigns, peak hours)

## When To Use
- Target tracking: General web server auto-scaling; simplest and most effective for most workloads
- Step scaling: When you need different response magnitudes (e.g., add 2 instances at 70%, add 6 at 90%)
- Predictive scaling: Consistent daily/weekly traffic patterns (SaaS apps, business-hour apps)
- Scheduled scaling: Known events (product launches, marketing campaigns, end-of-month processing)
- Combined predictive + dynamic: Best approach; predictively scale ahead of known patterns, dynamically adjust for variance

## When NOT To Use
- Predictive scaling: Not for workloads with random, unpredictable traffic spikes (gaming, flash sales)
- Simple scaling: Never use (deprecated); target tracking or step scaling provides better control
- Target tracking with wrong metric: Using CPU for a memory-bound application (scale based on memory or request count instead)
- Aggressive scaling: Adding/removing instances too quickly (creates thrashing, increases cost)

## Best Practices
- **Use target tracking with ALB RequestCountPerTarget**: Set target to 1000-5000 requests/min per instance depending on app capacity (WHY: request count per target is the most meaningful metric for web apps; CPU can spike from non-traffic work; memory is less correlated with traffic)
- **Set sufficient warm-up time**: Configure 120-300 second warm-up in lifecycle hooks (WHY: Laravel boot + cache warming + PHP-FPM pool boot takes time; serving traffic before ready causes 50x errors)
- **Combine predictive + dynamic**: Enable predictive scaling for forecast-based capacity, overlay dynamic for real-time correction (WHY: predictive reduces lag by having capacity ready before traffic arrives; dynamic catches forecast errors)
- **Use instance refresh with RollingUpdate**: Replace instances gradually during AMI updates (WHY: zero-downtime deployments without scaling disruption; maintains desired capacity during update)
- **Set cooldown to 60-120 seconds**: Prevents rapid scale-in/out oscillation (WHY: shorter cooldowns cause thrashing; longer cooldowns cause under-provisioning during traffic spikes)

## Architecture Guidelines
- Web tier: Target tracking ALB RequestCountPerTarget (5000 req/min per instance) + Predictive scaling
- Worker tier: Target tracking SQS queue depth (1000 messages per instance) + Spot instances
- Set min capacity = 2 (for AZ redundancy), max = 20 (cost cap)
- Use lifecycle hooks for warm-up before registering with ALB
- Use mixed instances groups for Spot diversification in the scaling pool

## Performance Considerations
- Scaling lag: 2-5 minutes from traffic increase to new instance serving requests
- Predictive scaling eliminates lag by provisioning 15-30 minutes before forecasted traffic
- Cold start on new instances: Laravel boot is ~1-3 seconds; cache warming adds 5-30 seconds
- Scale-in protection: Prevent termination of instances with active connections (connection draining helps)

## Security Considerations
- Scaling actions should be logged via CloudTrail for audit
- Lifecycle hooks can trigger Lambda for custom actions (log cleanup, security patching)
- Ensure new instances are patched and scanned before registering with ALB
- Use launch template versions for immutable infrastructure (new version always has latest security patches)

## Common Mistakes
1. **Scaling on CPU only**: CPU-based scaling for Laravel apps with varying I/O wait (Cause: CPU is the default scaling metric; Consequence: scaling doesn't match actual request load; Better: use ALB RequestCountPerTarget for web tier)
2. **No predictive scaling for predictable traffic**: Manual scaling changes every day for known rush hours (Cause: unaware of predictive scaling feature; Consequence: over-provisioning before peak, under-provisioning after peak; Better: enable predictive scaling with 2 weeks of historical data)
3. **Too aggressive scale-in**: Terminating instances within 5 minutes of scale-out (Cause: short cooldown period; Consequence: instances terminated just as they are fully booted; Better: use 10+ minute scale-in cooldown, enable instance warm-up tracking)

## Anti-Patterns
- **Manual scaling**: Manually adjusting ASG desired count; defeats automation purpose
- **Scaling on CloudWatch metrics with 1-minute resolution**: Metric delays cause slow response; use 15-30 second resolution or ALB metrics
- **Identical min/max capacity**: Setting min = max = 5 means no actual scaling; overrides the purpose
- **No scale-in protection**: Critical instances (stateful workers) terminated during scale-in

## Examples
- **SaaS app (predictable)**: Predictive scaling adds 6 instances at 8:30 AM before 9 AM peak; target tracking adds more if traffic exceeds forecast
- **E-commerce (variable)**: Target tracking on RequestCountPerTarget (3000 req/min); step scaling: add 2 at 70%, add 6 at 90%
- **API service**: Target tracking on ALB latency (target 500ms); scale out before latency degrades

## Related Topics
- Scheduled Scaling (ku-04)
- Spot Instances (ku-02)
- Horizontal Scaling
- Predictive Auto Scaling (ku-03 in server-sizing-autoscaling)

## AI Agent Notes
- Default: target tracking + predictive for web tier
- Default: target tracking on SQS queue depth for worker tier
- Always recommend 2-5 minute warm-up time for Laravel apps

## Verification
- [ ] Target tracking scaling policy configured (ALB RequestCountPerTarget)
- [ ] Predictive scaling enabled with 2+ weeks of historical data
- [ ] Lifecycle hooks for instance warm-up
- [ ] Scale-in cool-down of 10+ minutes
- [ ] Min = 2 (multi-AZ), max = appropriate cap
- [ ] No manual scaling in place
