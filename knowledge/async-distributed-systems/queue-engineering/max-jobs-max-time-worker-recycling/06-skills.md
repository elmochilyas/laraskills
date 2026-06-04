# Skill: Configure --max-jobs and --max-time for Worker Recycling

## Purpose
Set `--max-jobs` and `--max-time` on all queue workers to prevent unbounded memory growth and stale state accumulation through periodic graceful restarts.

## When To Use
Every production queue worker using `queue:work` daemon mode. Always set both for defense-in-depth.

## When NOT To Use
Workers that process fewer than 50 jobs total (local development, CI pipelines).

## Prerequisites
- Process supervisor (Supervisor/systemd) with autorestart configured
- Knowledge of worker RSS growth over time
- Worker `--memory` limit determined

## Inputs
- Observed RSS growth rate (MB per job)
- Worker `--memory` limit
- Maximum acceptable time between worker restarts

## Workflow
1. Set `--max-jobs=500` and `--max-time=3600` as safe starting values
2. Add to worker command: `php artisan queue:work redis --max-jobs=500 --max-time=3600`
3. Verify Supervisor `autorestart=true` or systemd `Restart=always` is set
4. Monitor RSS growth: check that worker stays below `--memory` limit within the window
5. Tune up if RSS stays low: increase `--max-jobs` to reduce restart frequency
6. Tune down if RSS approaches limit: decrease `--max-jobs` or `--max-time`

## Validation Checklist
- [ ] Both `--max-jobs` AND `--max-time` set on every worker
- [ ] Values tuned based on observed memory growth
- [ ] Process supervisor autorestart confirmed
- [ ] Worker RSS stays below `--memory` limit during full lifetime
- [ ] Restarts are graceful (no jobs lost)
- [ ] Restart frequency is acceptable (not more than once per 15 minutes)

## Common Failures
- Only one limit set — the other gap allows unbounded growth
- No Supervisor autorestart — worker recycles once and queue stops
- `--max-jobs` too low (e.g., 10) — worker restarts every few minutes

## Decision Points
- Quick memory leak (high MB/job): prioritize `--max-jobs`
- Slow leak (low MB/hour): prioritize `--max-time`
- Start conservatively (500 jobs / 1 hour) and tune up

## Performance Considerations
- Each restart costs ~50-200ms (PHP + Laravel boot)
- At 500 jobs/restart: ~0.02% overhead per job — negligible
- Restart resets RSS to baseline (~20MB)

## Security Considerations
- Recycling prevents stale connections and cached credentials from accumulating
- Worker restart clears any in-memory sensitive data

## Related Rules
- Rule 1: Always Set Both --max-jobs and --max-time on Workers
- Rule 2: Tune Limits Based on Observed Memory Growth
- Rule 3: Ensure autorestart=true in Supervisor

## Related Skills
- Manage Queue Worker Memory Growth with Limits and Recycling
- Configure Supervisor for Production Queue Workers

## Success Criteria
Workers exit gracefully after processing N jobs or running for N seconds, Supervisor restarts them immediately, RSS never exceeds `--memory` limit, and memory-related OOM crashes are eliminated.
