# Skill: Tune PM Max Requests for Worker Lifecycle Management

## Purpose

Configure `pm.max_requests` to recycle PHP-FPM workers at the right frequency, balancing memory drift, OpCache fragmentation, and bootstrap overhead.

## When To Use

- Configuring pm.max_requests for the first time
- Workers show increasing memory or degrading performance over time
- Optimizing worker lifetime for specific workload patterns

## When NOT To Use

- For Octane workers (use Octane-specific configuration)
- When worker memory is stable and no drift is observed
- Without first measuring memory drift and bootstrap cost

## Prerequisites

- Understanding of worker memory drift
- Profiling data showing memory growth per request
- Bootstrap overhead time measured
- pm mode configured (static, dynamic, or ondemand)

## Inputs

- Memory drift per request (KB)
- Bootstrap overhead time (ms)
- Expected worker lifetime target (hours)
- OpCache and JIT warm-up requirements

## Workflow (numbered steps)

1. Measure worker RSS at start and after N requests to determine drift rate
2. Calculate how many requests until worker RSS exceeds 80% of memory_limit — this is the upper bound for max_requests
3. Calculate how many requests are needed to amortize bootstrap cost: cost / (bootstrap_time / request_time) — typically 50-100 requests
4. Set max_requests to a value between lower bound (amortization) and upper bound (memory limit)
5. Start with 1000 for most production workloads — balances drift and amortization
6. If drift is high (>10KB/req), reduce to 500
7. If drift is low (<1KB/req) and OpCache is stable, increase to 5000
8. Never set below 500 for production — bootstrap cost becomes significant
9. Monitor after setting: check for worker OOM or performance degradation before recycling
10. Document the max_requests value and rationale

## Validation Checklist

- [ ] Memory drift per request measured
- [ ] Bootstrap overhead time measured
- [ ] Lower bound calculated (amortization requirement)
- [ ] Upper bound calculated (memory limit)
- [ ] max_requests set within bounds
- [ ] No worker OOM observed
- [ ] Bootstrap overhead acceptable (amortized across worker lifetime)
- [ ] Configuration documented

## Common Failures

- **Setting max_requests too low (50-100)**: Worker spends 10-40ms on bootstrap per 100 requests — 0.1-0.4ms per request waste
- **Setting max_requests too high or infinite**: Memory drift accumulates — eventual OOM
- **Not measuring drift**: Guessing at values without data — may not address memory growth
- **Assuming OpCache is the only recyclable resource**: JIT buffer fragmentation also benefits from worker recycling

## Decision Points

- Drift <1KB/req: max_requests = 10000+ (recycle for hygiene)
- Drift 1-10KB/req: max_requests = 2000-5000 (balanced)
- Drift >10KB/req: max_requests = 500-1000 (address drift)
- OpCache/JIT fragmentation: max_requests = 1000-2000 (defragments via recycling)
- Maximum memory efficiency: max_requests as high as drift allows

## Performance Considerations

- Bootstrap cost per worker life: 10-40ms (initial request, OpCache warm)
- At max_requests = 1000: 0.01-0.04ms bootstrap overhead per request — negligible
- At max_requests = 100: 0.1-0.4ms per request — small but unnecessary
- Worker recycling: worker unavailable for 50-200ms during bootstrap
- JIT buffer fragmentation clears on recycle — workers restart with clean buffer

## Security Considerations

- Worker recycling clears any stale state between requests
- max_requests = 0 (unlimited) can lead to OOM with any memory drift
- Rapid recycling (max_requests < 500) increases CPU from repeated bootstrap — affects co-located services
- Document the chosen value for operational awareness

## Related Rules (from 05-rules.md)

- Set pm.max_requests Based on Measured Drift
- Never Set max_requests Below 500 for Production
- Monitor Worker RSS Trends for Drift

## Related Skills

- Memory Drift and Recycling Overhead
- Worker RSS Capacity Ceiling
- Memory Leak Detection Patterns

## Success Criteria

- max_requests set within calculated bounds
- No worker OOM from memory drift
- Bootstrap overhead acceptable (<0.05ms per request)
- Worker RSS stable at recycling interval
- Configuration documented with drift data
