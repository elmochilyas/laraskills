# Skill: Size and Validate memory_limit for Production Workloads

## Purpose

Determine the optimal `memory_limit` value for each SAPI pool based on profiled peak usage, capacity planning, and container boundaries.

## When To Use

- Setting up a new production environment
- Responding to OOM errors
- Performing capacity planning for scaling
- Configuring container resource limits

## When NOT To Use

- Development environments — raise limits arbitrarily for debugging
- Isolated one-off CLI scripts with no concurrency constraints

## Prerequisites

- Access to production or staging environment with representative traffic
- Profiling tools (Xdebug, Blackfire, Tideways) or `memory_get_peak_usage(true)`
- Understanding of FPM pool configuration and container resource limits

## Inputs

- `pm.max_children` or desired concurrency
- Available RAM per host or container limit
- Profiled `memory_get_peak_usage(true)` across diverse request types
- RSS trend data (for persistent runtimes)

## Workflow (numbered steps)

1. Deploy a profiling middleware that logs `memory_get_peak_usage(true)` and URL for every request in staging or production-debug mode.
2. Collect peak memory for at least 10,000 requests covering all major endpoints — web, API, queue jobs.
3. Determine the P95 and P99 of peak memory across all requests. Use P95 as the baseline for web, P99 for queue.
4. Set `memory_limit = P95 × 2` for web pool. Set `memory_limit = P99 × 1.5` for queue pool.
5. Calculate `pm.max_children = (available_RAM × 0.7) / memory_limit`. Round down.
6. Deploy the new limits to a canary pool or staging environment first. Monitor for errors over 24 hours.
7. Check FPM status page or Octane metrics for worker RSS. Verify no worker exceeds 80% of `memory_limit` over its lifetime.
8. Add CI check: `php -r 'echo memory_get_peak_usage(true);'` after test suite run. Fail if > threshold × 0.8 to catch regressions.
9. Document the limit, peak distribution, and total RSS budget per host for the team runbook.

## Validation Checklist

- [ ] P95 peak memory profiled across >= 10,000 requests
- [ ] `memory_limit` set to 2× P95 for web pool
- [ ] `memory_limit` set to 1.5× P99 for queue pool
- [ ] Total RSS budget calculated and verified against available RAM
- [ ] Container PHP limit set to 80% of cgroup limit (if containerized)
- [ ] No validated OOM errors in 24-hour canary period
- [ ] CI enforces memory budget with automated check

## Common Failures

- **Profiling only one endpoint**: A single heavy endpoint (report export, CSV generation) can have 10× the peak of a standard route. Profile across the full surface.
- **Using real memory without overhead**: `memory_get_usage(false)` reports only Zend MM usage. Use `memory_get_usage(true)` for the real OS footprint.
- **Ignoring fragmentation growth**: In Octane, per-request peak is stable but fragmentation increases RSS over time. Set `max_requests` to cap this.
- **Not updating after code changes**: A new package or feature can double memory usage. Re-profile after significant changes.

## Decision Points

- P95 peak ≤ 64MB → `memory_limit = 128M`
- P95 peak 64-128MB → `memory_limit = 256M`
- P95 peak 128-256MB → `memory_limit = 512M` — consider deferring to queue
- P95 peak > 256MB → Must defer to queue or refactor memory hotspots

## Performance Considerations

- Each pool with different memory limits increases `pm.max_children` flexibility — but adds configuration surface.
- Over-provisioning `memory_limit` by 2× is safe: Zend MM allocates lazily. The waste is in the total RSS budget calculation, not in actual per-request memory.
- Setting `memory_limit` too close to actual peak increases OOM risk from fragmentation or request variation — the 2× rule is production-proven.

## Security Considerations

- A compromised request can allocate up to `memory_limit`. Rate limiting and input validation are the first line of defense.
- Container OOM events may not be logged in PHP. Always log `memory_get_peak_usage(true)` at the end of each request to detect near-OOM conditions.
- Multi-tenant pools must enforce both per-request limits and per-pool worker counts to prevent tenant isolation breaches.

## Related Rules (from 05-rules.md)

- Set memory_limit based on profiled peak usage
- Keep PHP memory_limit below container cgroup limit
- Segregate memory_limit by SAPI and workload

## Related Skills

- Memory Limit Exceeded Strategies
- PM Max Children Sizing
- Capacity Planning with Safety Margins

## Success Criteria

- Zero OOM errors attributable to undersized limits
- Worker RSS stays below 80% of limit across full lifecycle
- Total per-host RSS stays within 70% of available RAM
- Memory budget documented in runbook
