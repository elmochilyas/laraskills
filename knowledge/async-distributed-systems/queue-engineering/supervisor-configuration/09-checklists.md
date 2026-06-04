# Supervisor Configuration for Queue Workers — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K059 — Supervisor Configuration for Queue Workers
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Supervisord installed on worker servers
- [ ] Familiar with Supervisor configuration directives
- [ ] Know the relationship between `stopwaitsecs`, `--timeout`, and `retry_after`

## Implementation Checklist
- [ ] `autorestart=true` set (workers exit after `--max-jobs`/`--max-time`)
- [ ] `stopasgroup=true` and `killasgroup=true` set (prevent orphaned subprocesses)
- [ ] `stopwaitsecs` set to max job runtime + buffer (> `--timeout`)
- [ ] `user=forge` (or appropriate non-root user) set
- [ ] `numprocs` set based on workload: CPU-bound ≤ core count, I/O-bound up to 2-3x core count
- [ ] `autostart=true` set
- [ ] `redirect_stderr=true` and `stdout_logfile` configured

## Verification Checklist
- [ ] Workers restart automatically after crash or recycling exit
- [ ] Graceful shutdown works (SIGTERM → finish job → exit)
- [ ] Children processes cleaned up on worker termination
- [ ] Workers run as non-root user
- [ ] Log files are written and rotated
- [ ] Multiple worker processes run concurrently as expected

## Security Checklist
- [ ] Workers run as non-root user (`user=forge`)
- [ ] Log files have restricted permissions
- [ ] Supervisor control socket secured (if exposed)
- [ ] `stopasgroup` prevents orphan processes

## Performance Checklist
- [ ] Each worker uses ~20-40MB RAM. 20 workers = 400-800MB baseline
- [ ] Process spawning: ~100ms per worker
- [ ] High `numprocs` on low-CPU: context switching reduces throughput

## Production Readiness Checklist
- [ ] Supervisor config files version-controlled
- [ ] Per-queue worker groups defined (different queues, different configs)
- [ ] Monitoring on worker process count and restart events
- [ ] Log rotation configured for worker log files
- [ ] Configuration tested in staging before production deployment

## Common Mistakes to Avoid
- [ ] `autorestart` not set (worker exits and never restarts)
- [ ] `stopwaitsecs` too short (default 10s — worker SIGKILLed mid-job)
- [ ] No `stopasgroup` (zombie subprocesses accumulate)
- [ ] Worker as root (security risk)
