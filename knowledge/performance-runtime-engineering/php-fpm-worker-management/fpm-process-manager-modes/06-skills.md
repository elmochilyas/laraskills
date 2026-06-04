# Skill: Select and Configure the FPM Process Manager Mode

## Purpose

Choose between static, dynamic, and ondemand process manager modes based on traffic pattern, memory constraints, and latency requirements.

## When To Use

- Initial PHP-FPM pool configuration
- Re-evaluating pm mode after traffic pattern changes
- Tuning existing FPM configuration for performance

## When NOT To Use

- For Octane or alternative runtimes (they use different worker management)
- Without understanding the traffic pattern
- When pm.max_children is not yet determined

## Prerequisites

- Traffic pattern data (steady vs variable, peak rate, trough rate)
- Server memory capacity
- Latency requirements
- Understanding of spawn latency (~10-50ms per worker spawn)

## Inputs

- Average and peak requests per second
- Traffic pattern description (steady, variable, bursty, low-traffic)
- Total server RAM available for PHP-FPM
- Calculated pm.max_children from capacity planning

## Workflow (numbered steps)

1. Analyze traffic pattern: is traffic steady throughout the day, or does it vary significantly?
2. If traffic > 100 req/s and steady: use `pm = static` — zero spawn latency, full memory always committed
3. If traffic varies (10-100 req/s range): use `pm = dynamic` — adaptive memory, occasional spawn latency
4. If traffic < 10 req/s: use `pm = ondemand` — minimum memory, spawn latency on cold requests
5. For static: set `pm.max_children` to the calculated value — all workers start at FPM startup
6. For dynamic: set `pm.max_children`, `pm.start_servers` (25-50% of max), `pm.min_spare_servers`, `pm.max_spare_servers`
7. For ondemand: set `pm.max_children`, `pm.process_idle_timeout` (10-30s) to kill idle workers
8. Set `pm.max_children` for ALL modes — even ondemand needs an upper bound
9. Monitor spawn events in FPM error log — frequent spawning indicates mode mismatch
10. Document the mode selection and rationale

## Validation Checklist

- [ ] Traffic pattern analyzed (steady, variable, low)
- [ ] pm mode selected based on traffic pattern
- [ ] pm.max_children set for all modes
- [ ] Dynamic: start_servers, min_spare, max_spare configured
- [ ] Ondemand: process_idle_timeout configured
- [ ] No excessive spawn events in FPM error log
- [ ] Mode selection documented

## Common Failures

- **Using ondemand for >50 req/s**: Spawn latency on every cold request — server spends more time spawning than serving
- **Static for low-traffic servers**: Wastes RAM on idle workers 24/7
- **Dynamic with static-like settings**: Setting min_spare = max_spare = max_children simulates static with spawn overhead
- **No max_children in ondemand mode**: No upper bound — server OOM under traffic spike

## Decision Points

- Steady traffic >100 req/s: static (eliminates spawn latency)
- Variable traffic 10-100 req/s: dynamic (memory adapts to load)
- Low traffic <10 req/s: ondemand (maximum memory efficiency)
- Memory constrained: ondemand or dynamic (never static)
- Latency sensitive: static (no spawn latency) or dynamic with high min_spare

## Performance Considerations

- Static: zero spawn latency, full memory cost always paid
- Dynamic: spawn latency ~10-50ms during traffic increases, spawn rate limited to 1/sec
- Ondemand: spawn latency on every cold request (~10-50ms)
- Unix sockets vs TCP: 15-25% faster for FPM communication
- Spawn rate limiter (1/sec default): limits how quickly the pool can grow under sudden traffic

## Security Considerations

- Ondemand can be overwhelmed by traffic spikes (spawn rate limiting + latency)
- Static is the most predictable and easiest to capacity-plan for security
- Dynamic with high min_spare_servers wastes resources that could be used for other services
- Always set max_children to prevent resource exhaustion DoS

## Related Rules (from 05-rules.md)

- Use Static Process Manager for Steady High-Traffic Workloads
- Never Use Ondemand for Production APIs Above 50 req/s
- Always Set pm.max_children for All Process Manager Modes

## Related Skills

- Capacity Planning and Safety Margins
- PM Max Children P95 Calculation
- Pool Sizing Formula Rationale
- FPM Status Page Monitoring

## Success Criteria

- pm mode matched to traffic pattern
- No excessive spawn events in logs
- Memory utilization appropriate for the mode
- Workers available when needed (no 502 errors from no available workers)
- Mode selection documented with rationale
