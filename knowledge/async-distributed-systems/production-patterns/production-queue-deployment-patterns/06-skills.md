# Skill: Deploy Queue Workers with Zero Downtime

## Purpose
Safely deploy code changes that affect queue jobs without losing jobs or processing with old code, using `horizon:terminate`, canary deployments, and post-deploy monitoring.

## When To Use
Every production deployment that modifies job classes; any deploy where queue workers run continuously; critical job changes requiring canary rollout.

## When NOT To Use
Trivial infrastructure-only changes; development environments; hotfixes requiring immediate global rollout (emergency exception).

## Prerequisites
- Supervisor or similar process manager with `autorestart=true`
- Horizon or queue worker running on one or more servers
- Monitoring access (Pulse, Horizon, failed_jobs table)

## Inputs
- Deployment type (full rollout or canary)
- Queue names affected
- Post-deploy monitoring window (30 min default)

## Workflow
1. Pre-deploy: run `php artisan horizon:terminate` (or `queue:restart`) to signal graceful shutdown
2. Wait for workers to finish current jobs (supervisor `stopwaitsecs` = `retry_after + 10`)
3. Deploy new code (git pull, composer install, migrate)
4. Supervisor automatically restarts workers with new code (`autorestart=true`)
5. For destructive jobs: canary deploy to one server first, monitor 10 min, then roll to rest
6. Post-deploy: monitor failed jobs for 30 min — spike indicates deployment issue
7. Verify a test job processes successfully in the new code

## Validation Checklist
- [ ] `horizon:terminate` called before code deploy
- [ ] `stopwaitsecs` configured to `retry_after + 10` in supervisor config
- [ ] Supervisor `autorestart=true` for automatic restart after termination
- [ ] Canary deployment used for destructive job changes
- [ ] Failed jobs monitored intensively for 30 min post-deploy
- [ ] Test job verified successful on new code
- [ ] Queue jobs tested in staging before production deploy
- [ ] Pulse/Horizon dashboard checked for anomalies

## Common Failures
- No `horizon:terminate` — old code runs indefinitely after deploy
- No post-deploy monitoring — silent failures unnoticed until backlog grows
- Global rollout of destructive jobs — bug corrupts all data at once
- Not testing jobs in staging — CLI context differs from web SAPI
- `stopwaitsecs` too low — workers killed mid-job, causing duplicate processing

## Decision Points
- Full rollout: standard deploys with `horizon:terminate` on all servers
- Canary: destructive job changes — limit to one server first
- Emergency: skip canary for critical hotfixes (accept risk)

## Related Rules
- Rule 1: always-terminate-horizon-on-deploy
- Rule 2: test-queue-jobs-in-staging
- Rule 3: use-canary-deploy-for-destructive-jobs
- Rule 4: monitor-failed-jobs-after-deploy

## Related Skills
- Configure Supervisor for Queue Workers
- Set Deployment Restart Strategies
- Configure Horizon Supervisor Configuration

## Success Criteria
Deployments always include `horizon:terminate`, workers restart with new code automatically, destructive jobs use canary rollout, and post-deploy monitoring catches failures within the 30-minute window.
