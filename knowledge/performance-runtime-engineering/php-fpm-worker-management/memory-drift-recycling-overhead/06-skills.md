# Skill: Balance Memory Drift Against Worker Recycling Overhead

## Purpose

Set `pm.max_requests` to recycle workers before memory drift causes problems, while avoiding excessive recycling that wastes the bootstrap cost.

## When To Use

- Configuring pm.max_requests for PHP-FPM
- Monitoring shows memory growth in long-lived workers
- Balancing between memory efficiency and CPU overhead
- Tuning worker lifetime for stability

## When NOT To Use

- For Octane workers (use Octane-specific max_requests setting)
- Without first measuring memory drift rate
- For applications with stable memory (no drift)

## Prerequisites

- Understanding of PHP-FPM worker memory drift (gradual RSS increase over time)
- Profiling data showing memory growth rate per 100 requests
- Confidence in OpCache configuration (hit rate >99%)

## Inputs

- Worker RSS at start vs after N requests (memory drift per request)
- Request processing time (to calculate amortization of bootstrap cost)
- Bootstrap overhead time

## Workflow (numbered steps)

1. Measure worker RSS immediately after start (post-first-request baseline)
2. Measure worker RSS after 100, 500, 1000, and 2000 requests
3. Calculate memory drift per request: (RSS_at_N - RSS_baseline) / N
4. If drift < 1KB per request: memory is stable — set max_requests to 10000+
5. If drift 1-10KB per request: moderate drift — set max_requests to 2000-5000
6. If drift > 10KB per request: significant drift — set max_requests to 500-1000
7. Calculate bootstrap amortization: max_requests × bootstrap_savings_per_request — ensure this exceeds recycling cost
8. Set pm.max_requests to the lower bound that balances drift against recycling overhead
9. Monitor after change: verify RSS is stable with worker recycling
10. Document the max_requests configuration and drift data

## Validation Checklist

- [ ] Worker RSS baseline measured
- [ ] Memory drift per request calculated
- [ ] pm.max_requests set based on drift rate
- [ ] Bootstrap amortization verified (recycling not too frequent)
- [ ] Observed RSS stable after configuration
- [ ] No excessive recycling (max_requests too low)
- [ ] Configuration documented with rationale

## Common Failures

- **Setting max_requests too low (50-100)**: Pays bootstrap cost too frequently — worker spends 10-40ms on bootstrap per recycled lifetime
- **Not measuring drift**: Guessing at max_requests values without data — may recycle too often or not often enough
- **Assuming all workers drift at the same rate**: Different endpoints cause different drift rates — measure across multiple workers
- **Confusing drift with legitimate memory use**: Cache warm-up and connection pools increase RSS legitimately — distinguish from leak drift

## Decision Points

- Drift < 1KB/req: set max_requests = 10000+ (recycle for hygiene, not drift)
- Drift 1-10KB/req: set max_requests = 2000-5000 (amortize bootstrap while managing memory)
- Drift 10-100KB/req: set max_requests = 500-1000 (address drift while limiting recycling overhead)
- Drift > 100KB/req: fix the memory leak first (max_requests is a bandage)
- No drift detected: max_requests = 0 (no limit) is acceptable for stable memory workloads

## Performance Considerations

- Bootstrap cost per worker life: 10-40ms (initial request only, due to OpCache)
- Recycling cost: 10-40ms of CPU per worker restart (bootstrap runs again)
- At max_requests = 1000: 0.01-0.04ms of bootstrap overhead per request (negligible)
- At max_requests = 100: 0.1-0.4ms per request (small but unnecessary)
- Memory savings from recycling: reclaims drifted memory, reduces OOM risk
- Each recycling event: worker unavailable for ~50-200ms (during bootstrap)

## Security Considerations

- Worker recycling clears any stale state that could leak between requests
- Frequent recycling may hide memory leaks that should be fixed
- max_requests = 0 (unlimited) can lead to OOM in workers with any drift
- OOM from unbounded drift is a service availability risk

## Related Rules (from 05-rules.md)

- Set pm.max_requests Based on Measured Drift
- Never Set max_requests Below 500 for Production
- Monitor Worker RSS Trends for Drift

## Related Skills

- Memory Leak Detection Patterns
- PM Max Requests Tuning
- Worker RSS Capacity Ceiling

## Success Criteria

- Memory drift measured and documented
- pm.max_requests set to balance drift against recycling overhead
- Worker RSS stable with recycling (observed over 24 hours)
- Bootstrap amortization verified (recycling cost justified)
- Configuration documented with drift data
