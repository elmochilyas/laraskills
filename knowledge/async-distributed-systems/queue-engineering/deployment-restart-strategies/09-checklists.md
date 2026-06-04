# Deployment Restart Strategies — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K061 — Deployment Restart Strategies
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand `queue:work` daemon lifecycle
- [ ] Familiar with `queue:restart` and `horizon:terminate` commands
- [ ] Process supervisor (Supervisor/systemd) configured with autorestart

## Implementation Checklist
- [ ] `queue:restart` included in deployment script (standard workers)
- [ ] `horizon:terminate` included in deployment script (Horizon)
- [ ] Rolling restart strategy documented for multi-server deployments
- [ ] Shared cache (Redis/Memcached) used for `queue:restart` on multi-server
- [ ] Supervisor `autorestart=true` configured for automatic worker restart

## Verification Checklist
- [ ] Workers pick up new code after deployment
- [ ] Workers finish current job before exiting (graceful shutdown)
- [ ] No jobs lost during deployment restart
- [ ] Rolling restart process doesn't cause complete processing halt
- [ ] `queue:restart` signal received by all workers (multi-server)

## Security Checklist
- [ ] Queue restart commands restricted to deployment users/scripts
- [ ] Deployment script doesn't expose credentials
- [ ] Horizon terminate restricted to authorized users

## Performance Checklist
- [ ] `queue:restart` propagation delay matches `--sleep` interval (~3s at default)
- [ ] `horizon:terminate` uses Redis pub/sub — near-instant (~10ms)
- [ ] Rolling restart capacity reduction (1/N per server) accounted for

## Production Readiness Checklist
- [ ] Deployment runbook includes queue restart step
- [ ] Grace period for worker drain documented (max job runtime + buffer)
- [ ] Rollback procedure includes worker restart
- [ ] Zero-downtime deployment strategy verified in staging

## Common Mistakes to Avoid
- [ ] Not restarting after deploy (workers run old code indefinitely)
- [ ] `queue:restart` with file cache on multi-server (only one server restarts)
- [ ] `horizon:terminate` without auto-restart (Horizon stops permanently)
- [ ] Not waiting for graceful shutdown (workers killed mid-job)
