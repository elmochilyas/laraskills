# Skill: Calculate PM Max Children Using P95 Request Concurrency

## Purpose

Determine `pm.max_children` based on the P95 percentile of concurrent requests rather than peak, balancing resource usage against capacity.

## When To Use

- Right-sizing FPM pools for cost efficiency
- Traffic has predictable peaks and troughs
- Auto-scaling infrastructure where over-provisioning is unnecessary
- When peak traffic is very rare (monthly campaigns, flash sales)

## When NOT To Use

- For latency-sensitive applications where any queueing is unacceptable
- When P95 is close to P99 (very bursty traffic)
- Without historical request concurrency data

## Prerequisites

- Historical request concurrency data (from APM or web server logs)
- Understanding of P95 vs peak traffic ratios
- Worker RSS information

## Inputs

- Request concurrency time series (24+ hours)
- P95, P99, and max concurrent request counts
- Per-worker RSS memory
- Total server RAM available for FPM

## Workflow (numbered steps)

1. Collect request concurrency data over 7+ days (include weekends and weekdays)
2. Calculate P95, P99, and max concurrent request values
3. For most production APIs: max_children = P95_concurrency × 1.2 (20% headroom)
4. For latency-sensitive applications: max_children = P99_concurrency × 1.2
5. For cost-optimized environments: max_children = P95_concurrency (no headroom, accept rare queueing)
6. Cross-check with memory budget: max_children × per_worker_RSS must be <= available RAM
7. If memory budget cannot accommodate P95-based calculation, reduce workers or increase RAM
8. If P95 and P99 are very different (ratio > 2), the traffic is highly variable — use higher percentile
9. Monitor after deployment: if max_children_reached > 0, increase max_children
10. Document the percentile-based calculation

## Validation Checklist

- [ ] Request concurrency data collected over 7+ days
- [ ] P95, P99, max values calculated
- [ ] max_children calculated using selected percentile + headroom
- [ ] Cross-checked against memory budget
- [ ] max_children_reached = 0 after deployment (or tracked and acceptable)
- [ ] Calculation documented with percentile data

## Common Failures

- **Using max instead of P95**: max occurs once in 7 days — sizing for it wastes 30-50% capacity
- **Using average instead of P95**: Average hides the spikes — under-provisioning leads to 502 errors
- **Not accounting for burst ratio**: P95/P50 ratio > 3 indicates bursty traffic — need higher percentile or auto-scaling
- **Ignoring memory budget**: P95-based worker count may exceed available RAM — must cross-check

## Decision Points

- Standard API (predictable traffic): P95 × 1.2
- Latency-sensitive (finance, real-time): P99 × 1.2
- Cost-optimized (background, batch): P95 × 1.0 (accept rare queueing)
- Bursty traffic (P95/P50 > 3): use P99 or implement auto-scaling
- Auto-scaled environment: P95 (scale out during P99+ events)

## Performance Considerations

- max_children = P95 × 1.2: 5% of requests may experience queueing — acceptable for most applications
- max_children = P99 × 1.2: <1% of requests may queue — suitable for sensitive applications
- Over-provisioning cost: each extra worker consumes 30-50MB RAM at idle
- Queueing under max_children: requests wait for available worker — adds latency but does not fail
- Queueing above max_children: 502 errors (gateway timeout)

## Security Considerations

- max_children_reached = true indicates capacity failure — may be exploited for DoS
- Proper percentile-based sizing prevents accidental DoS from under-provisioning
- Monitor max_children_reached as a security metric (capacity health indicator)

## Related Rules (from 05-rules.md)

- Calculate max_children from P95 Concurrency, Not Max
- Always Apply Headroom to Percentile-Based Calculation
- Cross-Check Memory Budget After Calculation

## Related Skills

- Capacity Planning and Safety Margins
- Pool Sizing Formula Rationale
- CPU vs IO Bound Worker Ratios
- FPM Status Page Monitoring

## Success Criteria

- max_children calculated from P95 (or selected percentile) concurrency
- Cross-checked against memory budget
- max_children_reached = 0 or acceptably rare
- Worker utilization optimized (not over-provisioned)
- Calculation documented with percentile data
