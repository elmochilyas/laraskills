# Skill: Queue Restart, Horizon Verification & Post-Deployment Monitoring

## Purpose
Complete the deployment cycle by gracefully restarting queue workers, verifying Horizon health, and monitoring failed jobs for the critical first 15 minutes after deploy. Ensure zero-downtime worker updates and catch serialization or compatibility regressions before they accumulate.

## When To Use
- Every production deployment that changes application code
- After any deployment that modifies queued job classes, event listeners, or service providers
- After configuration changes that affect queue workers
- During rollback procedures
- After scaling Horizon supervisors (adding/removing workers)

## When NOT To Use
- For deployments that only change static assets (CSS, JS, images)
- For deployments that only add new routes without modifying queue workers
- In local development (Horizon's `--watch` mode auto-restarts)
- For read-only maintenance that doesn't change worker code

## Prerequisites
- Understanding of `queue:restart` (signals `queue:work` daemons to exit gracefully)
- Familiarity with `horizon:terminate` (graceful Horizon shutdown, supervisor auto-restarts)
- Knowledge of supervisor configuration (`autorestart`, `stopwaitsecs`, `stopasgroup`)
- Understanding of `config:cache` and why it must run before worker restart
- Familiarity with Horizon dashboard health indicators

## Inputs
- The deployment pipeline and script
- The Horizon supervisor configuration (`config/horizon.php`)
- The supervisor system configuration (`/etc/supervisor/conf.d/horizon.conf`)
- The longest job timeout across all supervisors (determines `stopwaitsecs`)
- Whether the deployment changes queue topology, config values, or job classes

## Workflow
1. **Cache configuration and routes** — Run `config:cache`, `route:cache`, `view:cache`, `event:cache` BEFORE restarting workers. Workers load config during bootstrap; stale cache means new config values don't take effect.
2. **Restart queue workers** — Run `queue:restart` for `queue:work` daemons. Run `horizon:terminate` for Horizon. Both signal workers to finish their current job before exiting. Never use `kill -9` or `supervisorctl stop`.
3. **Wait for supervisor auto-restart** — Supervisor's `autorestart=true` automatically restarts workers after they exit. Wait 30 seconds for the restart cycle.
4. **Verify Horizon health** — Run `php artisan horizon:status` (exit code 0 = healthy). Run `php artisan horizon:list` to see all supervisors and worker counts. Check the Horizon dashboard: all supervisors should be active with correct worker counts.
5. **Verify supervisor configuration** — Check `supervisorctl status horizon`. Ensure `autorestart=true` and `stopwaitsecs >= longest job timeout`.
6. **Monitor failed jobs for 15 minutes** — Check at 5, 10, and 15 minutes. Any new failed jobs indicate a serialization issue, config mismatch, or new bug. Use an automated `deploy:monitor` command or manual checks.
7. **Monitor additional metrics** — Queue wait times (return to normal within 1-2 minutes), worker CPU/memory (within normal range), job throughput (within 10% of pre-deploy baseline), exception rate (no spikes).
8. **If failures spike, execute rollback** — Deploy previous code, restart workers, retry failed jobs, monitor for 15 minutes to confirm recovery.

## Validation Checklist
- [ ] Deployment sequence documented and tested in staging
- [ ] `config:cache` runs before `queue:restart` or `horizon:terminate`
- [ ] `queue:restart` and/or `horizon:terminate` runs as part of every code deployment
- [ ] Supervisor config has `autorestart=true` and `stopwaitsecs >= longest job timeout`
- [ ] Horizon health verified after every deployment (`horizon:status`, dashboard check)
- [ ] Post-deploy monitoring covers: failed jobs, queue wait times, worker CPU/memory, throughput
- [ ] Failed job alerts configured (Slack, PagerDuty, email)
- [ ] Rollback procedure documented and tested
- [ ] Phased migration strategy for large-table migrations
- [ ] `deploy:monitor` command runs automatically or as documented manual step

## Common Failures
- Running `config:cache` after `queue:restart` — workers load stale config
- Force-killing workers with `kill -9` — half-processed jobs, billing state divergence
- Not verifying Horizon after `horizon:terminate` — workers may not restart if supervisor is misconfigured
- Deploying and walking away — failed jobs accumulate for hours before discovery
- `stopwaitsecs` shorter than longest job timeout — long-running jobs force-killed during deploy

## Decision Points
- **Is Horizon healthy after restart?** — If `horizon:status` returns non-zero, investigate supervisor config and Redis connection
- **Are failed jobs spiking?** — If yes within the first 5 minutes, consider rollback
- **Is queue wait time returning to normal?** — If not within 2 minutes, workers may be stuck or insufficient

## Performance Considerations
- `queue:restart` is instant (sets a cache key). Workers restart within `sleep` seconds.
- `horizon:terminate` may take up to `timeout` seconds if a job is long-running.
- Config/route caching reduces worker boot time by 50-200ms per job.
- Post-deploy monitoring script should be non-blocking — run in background and alert via Slack/PagerDuty.

## Security Considerations
- `queue:restart` must never be exposed via HTTP — CLI-only maintenance command
- Horizon dashboard must be behind authentication (`Horizon::auth()`)
- Failed jobs table may contain serialized model data — restrict access
- Worker restarts should not invalidate user sessions or tokens

## Related Rules (from 05-rules.md)
- Always Run config:cache Before queue:restart
- Never Force-Kill Queue Workers — Always Use Graceful Shutdown
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment
- Verify Horizon Health After Every Deployment
- Set supervisor stopwaitsecs to Match Your Longest Job Timeout

## Related Skills
- Backward-compatible deployments (safe vs unsafe changes, phased migrations)
- Billing webhook metrics (monitoring webhook lifecycle post-deploy)
- Queue deployment safety (worker lifecycle and deployment ordering)

## Success Criteria
- All workers restart gracefully with new code — no job killed mid-execution
- Horizon is verified healthy after every deployment
- Failed jobs are detected within 15 minutes of deployment
- Config and route caches are fresh before workers restart
- Rollback procedure is documented and tested in staging
