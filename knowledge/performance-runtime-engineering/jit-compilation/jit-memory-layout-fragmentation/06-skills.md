# Skill: Diagnose and Mitigate JIT Buffer Fragmentation

## Purpose

Identify JIT buffer fragmentation in long-running processes and mitigate it through worker recycling, buffer sizing, and compilation threshold tuning.

## When To Use

- JIT buffer shows high total usage but low effective compiled function count
- CPU usage gradually increases over hours/days in long-running workers
- JIT buffer free space is fragmented — cannot accommodate new compilation even though total free is sufficient

## When NOT To Use

- For PHP-FPM workers that recycle frequently (fragmentation never accumulates)
- When JIT buffer utilization is <50% and no symptoms are present
- Without first measuring buffer fragmentation via opcache_get_status()

## Prerequisites

- JIT enabled and running in a long-lived process (Octane, Swoole, RoadRunner)
- Access to `opcache_get_status(false)['jit']` metrics
- Worker recycling (max_requests) configured

## Inputs

- JIT buffer free space percentage
- Number of compiled functions
- Worker uptime and request count
- Gradual CPU usage trend over worker lifetime

## Workflow (numbered steps)

1. Check JIT buffer metrics: `$jit = opcache_get_status(false)['jit']` — examine buffer_size, buffer_free, and compiled_funcs
2. If buffer_free is low (<20%) but compiled_funcs is also low (<500), fragmentation is likely — evicted functions leave gaps
3. Monitor compiled_funcs over time: if it increases then plateaus while buffer_free continues decreasing, fragmentation is occurring
4. Reduce max_requests to recycle workers before fragmentation becomes severe (e.g., from 2000 to 1000)
5. Increase jit_buffer_size by 50-100% to provide more contiguous space — reduces fragmentation probability
6. If the application has many rarely-called functions compiled by JIT, raise hot path thresholds (jit_hot_func, jit_hot_loop)
7. After changes, monitor for 24 hours: verify buffer_free stabilizes and CPU does not increase over time
8. Document the fragmentation issue and mitigation configuration

## Validation Checklist

- [ ] JIT buffer fragmentation diagnosed (low free + low compiled count)
- [ ] max_requests adjusted to limit fragmentation accumulation
- [ ] Buffer size increased if needed
- [ ] Hot path thresholds adjusted if too many functions compiled
- [ ] Buffer metrics monitored for 24 hours after changes
- [ ] CPU trend flattened after mitigation

## Common Failures

- **Confusing fragmentation with undersized buffer**: Both present as low free space — check compiled_funcs to distinguish
- **Setting max_requests too low**: Recycling every 50 requests prevents JIT from ever reaching steady state — keep 500+ if possible
- **Only increasing buffer without recycling**: Larger buffer delays fragmentation but doesn't prevent it — combine strategies
- **Ignoring the root cause**: If many rarely-called functions are compiled, fix the threshold, not the buffer

## Decision Points

- If compiled_funcs is stable and buffer_free <20%: primarily an undersized buffer issue — increase size
- If compiled_funcs is decreasing over time while buffer_free stays low: fragmentation is active — reduce max_requests
- If compiled_funcs is very high (>5000) and buffer_free <20%: too many functions being compiled — raise thresholds
- If all three metrics are stable: no fragmentation issue — continue monitoring

## Performance Considerations

- JIT buffer fragmentation can increase CPU usage by 10-20% over 24 hours as functions are repeatedly evicted and recompiled
- Each recompilation costs 50-500µs of CPU — multiplied across thousands of functions, this adds significant overhead
- Worker recycling is the most reliable mitigation — fresh worker starts with a clean buffer
- Larger buffer reduces fragmentation frequency but increases per-worker memory allocation

## Security Considerations

- JIT buffer fragmentation is a performance issue, not a security issue
- Worker recycling is safe — state is properly cleaned on each recycle
- No security implications from buffer configuration changes

## Related Rules (from 05-rules.md)

- Monitor JIT Buffer Utilization
- Set max_requests to 500-1000
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Buffer Sizing Guidelines
- JIT Configuration for Production
- Worker Recycling and Max Requests Tuning

## Success Criteria

- JIT buffer fragmentation diagnosed and documented
- Mitigation strategy implemented (buffer increase, max_requests reduction, or threshold tuning)
- CPU trend flattened over 24-hour observation period
- Buffer free space stabilized above 20%
