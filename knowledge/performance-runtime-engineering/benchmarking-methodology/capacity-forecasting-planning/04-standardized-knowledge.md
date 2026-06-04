# Standardized Knowledge: Capacity Forecasting and Planning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | Capacity Forecasting and Planning |
| Difficulty | Enterprise |
| Lifecycle | Plan, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Capacity forecasting predicts when infrastructure will be saturated based on traffic growth trends. Request growth modeling (linear vs exponential traffic increase), worker scaling calculations (max_children / thread count needed at projected traffic), and hardware upgrade planning (CPU/memory/network requirements 6-12 months out) prevent reactive capacity management.

## Core Concepts

- **Request Growth Modeling**: Analyze traffic trends (daily/weekly/monthly). Apply growth rate to project future peak traffic. Use P95 daily peak, not average. Formula: `projected_peak_RPS = current_peak_RPS × (1 + growth_rate)^months`.
- **Worker Scaling**: `Required_workers = projected_peak_RPS / (RPS_per_worker × safety_factor)`. RPS_per_worker measured from benchmarks. Safety factor = 0.7 for headroom during spikes.
- **Hardware Planning**: CPU cores = `required_workers × CPU_time_per_request / 1000ms` (for CPU-bound). RAM = `required_workers × P95_RSS × 1.5 safety factor`.
- **Downgrade Scenarios**: Plan for 2x unexpected traffic spike. Over-provision by 100% for critical services. Over-provision by 30% for standard services.

## When To Use

- Annual infrastructure budgeting and procurement planning
- Before major traffic events (product launches, marketing campaigns, seasonal peaks)
- When current infrastructure approaches 70% utilization during peak hours
- As part of regular capacity review cycles (monthly or quarterly)

## When NOT To Use

- Day-to-day operations without growth concerns
- Services with flat or declining traffic
- Very early-stage products where traffic patterns haven't stabilized
- Environments where auto-scaling handles capacity without human planning

## Best Practices

- **Forecast from peak traffic, not average**: Average traffic is typically 30-50% of peak. Sizing for average guarantees saturation during peak hours. Always use P95 daily peak for capacity planning.
- **Calculate 6-month forecast**: Determine current headroom. At projected growth rate, calculate months until headroom reaches 10%. That's the upgrade deadline. Plan procurement 2 months before.
- **Include safety margins**: 1.2x for normal operations, 1.5x for critical services, 2x for services without auto-scaling. Safety margins absorb traffic spikes and deployment headroom.
- **Model multiple growth scenarios**: Best case (current growth continues), expected case (growth slows 50%), worst case (growth doubles). Plan for the expected case but have budget for the worst case.
- **Review forecasts monthly**: Actual traffic may diverge from projections. Compare forecast vs actual monthly and adjust plans accordingly.

## Architecture Guidelines

- **Capacity Planning as a Process**: Not a one-time calculation. Monthly review: compare forecast vs actual, adjust growth rate, recalculate upgrade timeline. Quarterly: review hardware plan and budget.
- **Headroom Calculation**: Headroom = `(current_capacity - current_demand) / current_capacity × 100`. Below 30% headroom: investigate capacity increase. Below 15%: critical — plan immediate upgrade.
- **Horizontal vs Vertical Scaling**: Horizontal (more servers) is preferred for stateless PHP workloads. Vertical (bigger servers) when horizontal scaling is constrained by database connections or licensing.
- **Auto-Scaling Integration**: Design for auto-scaling but plan for base capacity. Auto-scaling handles spikes above the base. Base capacity handles normal peak traffic without scaling delay.

## Performance Considerations

- P95 worker RSS should be measured after 30+ minutes of steady-state operation
- RPS_per_worker varies by endpoint complexity. Measure per-endpoint for accurate planning.
- CPU time per request changes with optimizations. Re-measure after significant performance work.
- Database connection limits (max_connections) often become the bottleneck before CPU or memory.

## Security Considerations

- Capacity data reveals infrastructure scale. Treat as confidential business information.
- Capacity planning documents should be access-restricted — they detail your scaling limits and growth strategy.
- OOM risks from miscalculated capacity are security availability issues. Always include safety margins.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forecasting from average traffic | Convenience | Saturation during peak hours, performance degradation | Use P95 daily peak traffic for capacity planning |
| Not including safety margins | Cost optimization | No headroom for traffic spikes or deployments | Include 1.2x-2x safety margin based on criticality |
| One-time capacity plan | Assuming traffic won't change | Stale plan doesn't reflect actual growth | Review and adjust forecasts monthly |
| Ignoring database connection limits | Focus on application capacity | Database max_connections exceeded before app capacity is reached | Budget database connections alongside app workers |

## Anti-Patterns

- **Procrastinating capacity upgrades**: Waiting until saturation causes performance degradation. Plan upgrades when headroom reaches 30%, not 10%.
- **Oversizing without data**: Guessing capacity needs without measurement leads to waste. Measure RPS, latency, and RSS before planning.
- **Ignoring seasonal patterns**: Traffic varies by day of week, month, and season. Capacity for Black Friday shouldn't be the same as average Tuesday.
- **Assuming linear scaling**: Doubling servers doesn't always double capacity. Bottlenecks in shared infrastructure (database, cache) limit scaling.

## Examples

```
6-Month Capacity Forecast:
Current peak: 2,000 RPS at 80 workers (25 RPS/worker, 128MB RSS/worker)
Monthly growth rate: 8%
Projected peak in 6 months: 2,000 × (1.08)^6 = 3,173 RPS
Required workers: 3,173 / (25 × 0.7) = 182 workers
Required RAM: 182 × 128MB × 1.5 = 34.9GB
Current RAM available: 24GB
Upgrade needed: Add 16GB (from 24GB → 40GB) by month 4
Deadline: Month 4 (before 6-month peak)
Procurement deadline: Month 2 (2 months lead time)
```

## Related Topics

- Capacity Planning Safety Margins
- PM Max Children P95 Calculation
- Horizontal Scaling Architecture
- Worker RSS Capacity Ceiling

## AI Agent Notes

- Capacity planning must use peak traffic (P95 daily peak), not average. Average-based planning guarantees saturation.
- Safety margins of 1.2x-2x are essential for absorbing traffic spikes and deployment headroom.
- Monthly forecast review ensures plans stay current with actual traffic growth.
- Database connection limits often become the bottleneck before compute resources. Always include database capacity in plans.

## Verification

- [ ] Current peak traffic measured (P95 daily peak RPS)
- [ ] Growth rate calculated from historical data
- [ ] 6-month forecast modeled with safety margins
- [ ] RPS_per_worker measured from current benchmarks
- [ ] P95 worker RSS measured after 30+ minutes steady state
- [ ] Database connection budget included in calculations
- [ ] Expected, best, and worst case scenarios modeled
- [ ] Procurement timeline established with 2-month lead time buffer
- [ ] Monthly forecast review scheduled
