# Metadata
**Domain:** DevOps & Infrastructure
**Subdomain:** Queue Deployment Safety
**Knowledge Unit:** Queue Restart, Horizon Verification & Post-Deployment Monitoring
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Deployment sequence documented and tested in staging
- [ ] `php artisan queue:restart` runs as part of every code deployment
- [ ] `php artisan horizon:terminate` runs for Horizon deployments
- [ ] Supervisor config has `autorestart=true` and appropriate `stopwaitsecs`
- [ ] `php artisan config:cache` runs before any queue restart
- [ ] Post-deploy monitoring covers: failed jobs, queue wait times, worker CPU/memory, job throughput
- [ ] Horizon dashboard verified after every deployment (all supervisors active, correct workers)
- [ ] Rollback procedure documented and tested
- [ ] Failed job alerts configured (Slack, PagerDuty, email)
- [ ] Phased migration strategy in place for large-table migrations
- [ ] Monitoring script (`deploy:monitor`) runs automatically after each production deploy

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Deployment sequence**: (1) Deploy code, (2) config:cache + route:cache, (3) queue:restart, (4) horizon:terminate, (5) Verify Horizon, (6) Monitor 15 min
- **Restart layer**: `queue:restart` for `queue:work` daemons, `horizon:terminate` for Horizon
- **Supervisor layer**: `autorestart=true`, `stopwaitsecs` >= longest job timeout
- **Verification layer**: `horizon:status`, `horizon:list`, dashboard checks
- **Monitoring layer**: Post-deploy script checking failed jobs, queue depth, worker health

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Deployment script: `config:cache → route:cache → queue:restart → horizon:terminate`
- [ ] Horizon supervisor config: `stopwaitsecs` matches longest `timeout` value
- [ ] Supervisor config: `autorestart=true`, `autostart=true`
- [ ] Post-deploy monitoring script: checks failed_jobs every 60 seconds for 15 minutes
- [ ] `php artisan horizon:status` in deploy script with non-zero exit on failure
- [ ] `php artisan horizon:list` for detailed supervisor verification
- [ ] Alert integration: Slack/PagerDuty notification for post-deploy failures
- [ ] Rollback script: deploy old code → config:cache → queue:restart → horizon:terminate → retry failed

# Performance Checklist
- `queue:restart` is instant (sets cache key); workers check on next iteration
- `horizon:terminate` wait time depends on longest running job + `stopwaitsecs`
- Config caching reduces worker bootstrap by 50-200ms per job
- Post-deploy monitoring script runs in background — non-blocking to deployment pipeline
- Large-table migrations run on dedicated `migrations` queue to avoid blocking billing

# Security Checklist
- [ ] `queue:restart` never exposed via HTTP — CLI-only during authorized deployments
- [ ] Horizon dashboard behind authentication in production
- [ ] Failed jobs table access restricted — contains serialized model and billing data
- [ ] Supervisor configuration under version control with restricted write access

# Reliability Checklist
- [ ] Graceful shutdown ensures no jobs are killed mid-execution
- [ ] `autorestart=true` ensures workers restart after `horizon:terminate`
- [ ] `stopwaitsecs` accommodates longest possible job duration
- [ ] Post-deploy monitoring catches failures within first 5 minutes
- [ ] Rollback procedure tested and ready for immediate execution
- [ ] All servers running workers receive the restart signal (multi-server deploys)

# Testing Checklist
- [ ] Test `queue:restart` and `horizon:terminate` graceful shutdown in staging
- [ ] Test supervisor auto-restart after `horizon:terminate`
- [ ] Test post-deploy monitoring script detects injected failures
- [ ] Test rollback procedure end-to-end
- [ ] Test that `config:cache` before restart picks up new config values
- [ ] Test multi-server restart: all workers on all servers pick up new code

# Maintainability Checklist
- [ ] Deployment script under version control with documented steps
- [ ] Supervisor config template documented with rationale for each setting
- [ ] `stopwaitsecs` review triggered when job timeouts change
- [ ] Post-deploy monitoring script updated when new alert conditions are added

# Anti-Pattern Prevention Checklist
- [ ] Prevent: "Deploy and forget" (no post-deploy monitoring for 15 minutes)
- [ ] Prevent: Skipping Horizon health checks ("it always works")
- [ ] Prevent: Using `sudo kill` on Horizon processes (hard kill mid-job)
- [ ] Prevent: Deploying without `autorestart=true` in supervisor
- [ ] Prevent: Monitoring only failed job count, not failed job types

# Production Readiness Checklist
- [ ] Deployment sequence tested and documented
- [ ] `queue:restart` and `horizon:terminate` in deployment script
- [ ] Supervisor `stopwaitsecs` >= longest Horizon `timeout`
- [ ] `autorestart=true` in all supervisor configs
- [ ] Post-deploy monitoring script deployed and configured
- [ ] Failed job alerts routed to on-call (Slack/PagerDuty)
- [ ] Horizon dashboard verified after last production deploy
- [ ] Rollback procedure accessible to on-call team
- [ ] Large-table migration jobs use dedicated `migrations` queue
- [ ] Multiple server deploy ensures all workers restarted

# Final Approval Checklist
- [ ] Architecture review completed (restart sequence, supervisor config, monitoring)
- [ ] Security review completed (restart access control, dashboard auth)
- [ ] Performance impact assessed (graceful shutdown timing, config cache)
- [ ] Testing coverage adequate (graceful shutdown, auto-restart, monitoring, rollback)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Always Run config:cache Before queue:restart
- Never Force-Kill Queue Workers — Always Use Graceful Shutdown
- Monitor Failed Jobs for a Minimum of 15 Minutes After Every Deployment
- Verify Horizon Health After Every Deployment
- Set supervisor stopwaitsecs to Match Your Longest Job Timeout
## Anti-Patterns
- "Deploy and forget"
- Skipping Horizon health checks
- Using sudo kill on Horizon processes
- Deploying without autorestart=true in supervisor
