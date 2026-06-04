# Supervisor `stopwaitsecs` and Graceful Shutdown — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K083 — Supervisor `stopwaitsecs` and Graceful Shutdown
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Supervisor SIGTERM → SIGKILL sequence
- [ ] Know relationship between `stopwaitsecs`, `--timeout`, and job runtime
- [ ] Familiar with `stopasgroup` and `killasgroup` directives

## Implementation Checklist
- [ ] `stopwaitsecs` set to max expected job runtime + 10 seconds
- [ ] `stopasgroup=true` set (signal entire process group)
- [ ] `killasgroup=true` set (SIGKILL entire process group if timer expires)
- [ ] `stopwaitsecs` > `--timeout` (guaranteed)
- [ ] Default 10-second `stopwaitsecs` overridden (dangerously low for production)

## Verification Checklist
- [ ] Worker finishes current job before exiting after SIGTERM
- [ ] No SIGKILL sent before worker completes graceful shutdown
- [ ] Child processes cleaned up on worker termination
- [ ] `stopwaitsecs` timer measured and verified sufficient

## Security Checklist
- [ ] `stopasgroup` prevents orphaned subprocesses (zombie processes)
- [ ] Workers have time to clean up resources on shutdown

## Performance Checklist
- [ ] `stopwaitsecs` timer has no CPU cost (wall-clock wait only)
- [ ] Worker holds memory during shutdown wait
- [ ] SIGKILL immediately frees all process memory (fast but ungraceful)

## Production Readiness Checklist
- [ ] `stopwaitsecs` value documented in operations runbook
- [ ] All Supervisor configs audited for correct `stopwaitsecs`
- [ ] Longest job runtime measured and documented
- [ ] `stopwaitsecs` reviewed when job runtimes change

## Common Mistakes to Avoid
- [ ] Default `stopwaitsecs=10` (worker always SIGKILLed mid-job)
- [ ] `stopwaitsecs` < `--timeout` (guaranteed SIGKILL during job)
- [ ] No `stopasgroup` (orphaned subprocesses accumulate)
