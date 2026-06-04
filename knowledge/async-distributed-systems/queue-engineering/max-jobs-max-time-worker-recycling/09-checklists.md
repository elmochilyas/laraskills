# `--max-jobs` and `--max-time` for Worker Recycling — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K058 — `--max-jobs` and `--max-time` for Worker Recycling
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand PHP daemon worker memory accumulation
- [ ] Know how process supervisors (Supervisor/systemd) auto-restart workers
- [ ] Familiar with `queue:work` CLI options

## Implementation Checklist
- [ ] `--max-jobs` set to standard value (500) on all production workers
- [ ] `--max-time` set to standard value (3600) on all production workers
- [ ] Both limits set for defense in depth (covers rapid + slow leaks)
- [ ] Supervisor `autorestart=true` configured
- [ ] Tune limits based on observed memory growth (RSS monitoring)
- [ ] Horizon equivalent: `maxJobs` and `maxTime` set per supervisor

## Verification Checklist
- [ ] Worker exits cleanly after processing N jobs
- [ ] Worker exits cleanly after running for N seconds
- [ ] Process supervisor detects exit and spawns new worker
- [ ] No jobs lost during worker recycling
- [ ] Memory usage stays within acceptable limits between restarts

## Security Checklist
- [ ] Worker restarts as correct user (non-root)
- [ ] Exit codes logged for troubleshooting

## Performance Checklist
- [ ] Each restart costs ~50-200ms (PHP + Laravel boot)
- [ ] At 500 jobs/restart, overhead is ~0.02% per job (negligible)
- [ ] After restart, worker starts at baseline memory (~20MB)

## Production Readiness Checklist
- [ ] Recycling limits documented in operations runbook
- [ ] Monitoring on worker restart frequency
- [ ] `--max-jobs` not set too low (excessive boot overhead)
- [ ] `--max-time` not set too low (worker processes too few jobs per lifetime)

## Common Mistakes to Avoid
- [ ] Neither limit set (memory grows unbounded → OOM)
- [ ] `--max-jobs` too low (frequent restarts kill throughput)
- [ ] No Supervisor `autorestart` (worker exits and never returns)
