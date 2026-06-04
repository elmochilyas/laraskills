# Worker Daemon Architecture — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K056 — Worker Daemon Architecture
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand difference between `queue:listen` and `queue:work`
- [ ] Know that daemon workers boot Laravel once and reuse container
- [ ] Familiar with PHP memory management and `memory_get_usage()`

## Implementation Checklist
- [ ] `queue:work` used in production (never `queue:listen`)
- [ ] `--max-jobs` and `--max-time` set on all production workers
- [ ] `--memory` limit set (default 128MB, tune based on observed RSS)
- [ ] Worker runs under process supervisor (Supervisor/systemd)
- [ ] `queue:restart` called after every deploy

## Verification Checklist
- [ ] Worker processes jobs in a loop (pop → process → sleep → repeat)
- [ ] Worker exits cleanly after `--max-jobs` or `--max-time`
- [ ] Supervisor restarts worker after exit
- [ ] Memory usage is stable across job batches
- [ ] No stale state accumulation across jobs (static properties, facades)

## Security Checklist
- [ ] Worker runs as non-root user
- [ ] Long-running process doesn't accumulate sensitive data in memory
- [ ] Worker restarts after deploy to pick up new security patches

## Performance Checklist
- [ ] Daemon boot: ~50-200ms (one time)
- [ ] `queue:listen` would cost ~50-200ms PER JOB
- [ ] Memory check uses `memory_get_usage(true)` — RSS measurement
- [ ] Worker recycling overhead: ~50-200ms per 500 jobs (negligible)

## Production Readiness Checklist
- [ ] Process supervisor configured and verified working
- [ ] Worker limits documented in operations runbook
- [ ] Memory usage monitoring in place
- [ ] Deployment process includes `queue:restart` step
- [ ] Worker crash alerting configured

## Common Mistakes to Avoid
- [ ] `queue:work` without process supervisor (worker exits — queue stops)
- [ ] No `--max-jobs` / `--max-time` (memory grows unbounded → OOM)
- [ ] `queue:listen` in production (5-10x slower than daemon)
