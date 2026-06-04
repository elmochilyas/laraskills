# Skill: Calculate FPM Capacity with Safety Margins

## Purpose

Determine the optimal number of PHP-FPM workers that maximizes throughput while maintaining safety margins for traffic spikes and memory constraints.

## When To Use

- Initial PHP-FPM pool sizing
- Re-evaluating capacity after application changes
- Right-sizing servers to reduce cost
- Planning for traffic growth

## When NOT To Use

- For Octane or alternative runtimes (they have different capacity models)
- When the application's memory profile is unknown
- Without first profiling per-request memory usage

## Prerequisites

- Worker RSS measurement (average per-idle and per-busy worker)
- Total server RAM available for PHP-FPM
- Peak traffic rate and expected growth
- Understanding of pm mode selection

## Inputs

- Total server RAM (minus OS, database, web server overhead)
- Average worker RSS at idle and at peak
- Expected peak traffic (requests per second)
- Average request processing time
- Desired safety margin (typically 20-30%)

## Workflow (numbered steps)

1. Measure baseline: average worker RSS at idle (after processing a request) and at peak (during request)
2. Calculate per-worker memory budget: worker RSS + headroom (typically 10MB per worker for temporary allocations)
3. Calculate max workers with safety: (total_RAM_for_FPM / per_worker_memory) * (1 - safety_margin)
4. Apply safety margin: 20% for predictable traffic, 30% for variable traffic, 50% for burst-prone traffic
5. Round down to the nearest reasonable number
6. Set `pm.max_children` to the calculated value
7. For dynamic mode: set `pm.start_servers` to 25-50% of max_children
8. For static mode: set `pm.max_children` = calculated value (all workers always exist)
9. Monitor after deployment: if workers are always busy (spawning events in logs), recalculate
10. Document the calculation with assumptions

## Validation Checklist

- [ ] Worker RSS measured at idle and peak
- [ ] Total RAM budget calculated (minus non-FPM processes)
- [ ] Safety margin applied based on traffic predictability
- [ ] pm.max_children set to calculated value
- [ ] No worker spawning events in steady state
- [ ] Server does not swap during peak traffic
- [ ] Calculation documented with assumptions

## Common Failures

- **Not accounting for non-PHP RAM**: OS, database, web server, monitoring agents all consume RAM — leave room
- **Zero safety margin**: A 10% traffic spike causes worker contention, 502 errors, and potential OOM
- **Using peak worker RSS for all workers**: Workers at idle use less memory than at peak — use peak for calculation
- **Not re-evaluating after upgrades**: New features or packages may increase per-worker memory

## Decision Points

- Predictable traffic (steady 24/7): 20% safety margin
- Variable traffic (day/night cycles): 30% safety margin
- Burst-prone traffic (flash sales, events): 50% safety margin
- Auto-scaling environment: 20% safety margin (scale out instead of over-provisioning)
- Memory-constrained: use ondemand or dynamic mode with lower max_children

## Performance Considerations

- Each worker at idle: 30-50MB for framework apps
- Each worker at peak: 50-200MB depending on request complexity
- Over-provisioning: wastes RAM, may cause swap
- Under-provisioning: 502 errors, queue buildup, degraded latency
- Target: 70-80% worker utilization at peak (leaves headroom for spikes)

## Security Considerations

- Worker OOM can expose error messages or partial responses to users
- Swap usage degrades performance and indicates capacity planning failure
- Proper capacity planning prevents resource exhaustion DoS conditions
- Monitor for workers stuck in abnormal state (long-running requests)

## Related Rules (from 05-rules.md)

- Size pm.max_children to Available RAM, Not Traffic
- Always Apply 20-30% Safety Margin
- Never Use Ondemand for Production APIs Above 50 req/s

## Related Skills

- PM Max Children P95 Calculation
- Worker RSS Capacity Ceiling
- Pool Sizing Formula Rationale
- CPU vs IO Bound Worker Ratios

## Success Criteria

- pm.max_children calculated with safety margin
- No worker spawning events during steady-state traffic
- Server does not swap at peak traffic
- 70-80% worker utilization at peak
- Calculation documented with all assumptions
